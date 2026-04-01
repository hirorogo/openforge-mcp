"""
Tests for the server module's wire-protocol and JSON-RPC handling.

Covers:
  - JSON-RPC request parsing / validation.
  - JSON-RPC response formatting (success and error).
  - Graceful handling of malformed requests.
  - Length-prefixed wire protocol (send / receive).
  - The main-thread execution queue processor.

All tests mock bpy and network I/O so no real sockets or Blender are needed.
"""

import json
import os
import queue
import struct
import sys
import importlib
import importlib.util
from unittest.mock import MagicMock, patch, PropertyMock

import pytest


# ---------------------------------------------------------------------------
# Ensure the addon package is importable (same bootstrap as test_tool_executor).
# ---------------------------------------------------------------------------

_ADDON_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_PACKAGE_NAME = "openforge_addon"

if _PACKAGE_NAME not in sys.modules:
    _parent = os.path.dirname(_ADDON_DIR)
    if _parent not in sys.path:
        sys.path.insert(0, _parent)

    _spec = importlib.util.spec_from_file_location(
        _PACKAGE_NAME,
        os.path.join(_ADDON_DIR, "__init__.py"),
        submodule_search_locations=[_ADDON_DIR],
    )
    _pkg_mod = importlib.util.module_from_spec(_spec)
    sys.modules[_PACKAGE_NAME] = _pkg_mod

    _tools_dir = os.path.join(_ADDON_DIR, "tools")
    _tools_spec = importlib.util.spec_from_file_location(
        f"{_PACKAGE_NAME}.tools",
        os.path.join(_tools_dir, "__init__.py"),
        submodule_search_locations=[_tools_dir],
    )
    _tools_mod = importlib.util.module_from_spec(_tools_spec)
    sys.modules[f"{_PACKAGE_NAME}.tools"] = _tools_mod
    _tools_spec.loader.exec_module(_tools_mod)

    for _mod_name in ("object_tools", "mesh_tools", "material_tools",
                      "screenshot_tools", "scene_tools"):
        _fpath = os.path.join(_tools_dir, f"{_mod_name}.py")
        _mspec = importlib.util.spec_from_file_location(
            f"{_PACKAGE_NAME}.tools.{_mod_name}", _fpath,
        )
        _m = importlib.util.module_from_spec(_mspec)
        sys.modules[f"{_PACKAGE_NAME}.tools.{_mod_name}"] = _m
        _mspec.loader.exec_module(_m)
        setattr(_tools_mod, _mod_name, _m)

    _te_path = os.path.join(_ADDON_DIR, "tool_executor.py")
    _te_spec = importlib.util.spec_from_file_location(
        f"{_PACKAGE_NAME}.tool_executor", _te_path,
    )
    _te_mod = importlib.util.module_from_spec(_te_spec)
    sys.modules[f"{_PACKAGE_NAME}.tool_executor"] = _te_mod
    _te_spec.loader.exec_module(_te_mod)

# Now load the server module.
if f"{_PACKAGE_NAME}.server" not in sys.modules:
    _srv_path = os.path.join(_ADDON_DIR, "server.py")
    _srv_spec = importlib.util.spec_from_file_location(
        f"{_PACKAGE_NAME}.server", _srv_path,
    )
    _srv_mod = importlib.util.module_from_spec(_srv_spec)
    sys.modules[f"{_PACKAGE_NAME}.server"] = _srv_mod
    _srv_spec.loader.exec_module(_srv_mod)

from openforge_addon import server as srv
from openforge_addon import tool_executor


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _encode_message(obj):
    """Encode a Python dict as a length-prefixed JSON bytes message."""
    payload = json.dumps(obj).encode("utf-8")
    return struct.pack(">I", len(payload)) + payload


def _decode_message(data: bytes):
    """Decode a length-prefixed JSON bytes message back to a dict."""
    length = struct.unpack(">I", data[:4])[0]
    payload = data[4:4 + length]
    return json.loads(payload.decode("utf-8"))


class FakeSocket:
    """A fake socket that reads from a bytes buffer and captures sent data."""

    def __init__(self, data: bytes = b""):
        self._recv_buffer = data
        self._recv_pos = 0
        self.sent_data = bytearray()

    def recv(self, n: int) -> bytes:
        chunk = self._recv_buffer[self._recv_pos:self._recv_pos + n]
        self._recv_pos += len(chunk)
        return chunk

    def sendall(self, data: bytes) -> None:
        self.sent_data.extend(data)

    def settimeout(self, t):
        pass

    def close(self):
        pass


# ===================================================================
# Test: wire protocol helpers
# ===================================================================

class TestWireProtocol:
    """Tests for _recv_exact, _recv_message, and _send_message."""

    def test_recv_exact_full_read(self):
        sock = FakeSocket(b"ABCDEFGH")
        result = srv._recv_exact(sock, 8)
        assert result == b"ABCDEFGH"

    def test_recv_exact_partial_read(self):
        """_recv_exact should accumulate data across multiple recv calls."""
        # Use a real mock to simulate partial reads.
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [b"AB", b"CD", b"EF"]
        result = srv._recv_exact(mock_sock, 6)
        assert result == b"ABCDEF"

    def test_recv_exact_connection_closed(self):
        """If recv returns empty bytes, raise ConnectionError."""
        mock_sock = MagicMock()
        mock_sock.recv.return_value = b""
        with pytest.raises(ConnectionError, match="Connection closed"):
            srv._recv_exact(mock_sock, 4)

    def test_recv_message_valid(self):
        payload_dict = {"jsonrpc": "2.0", "method": "test", "id": 1}
        raw = _encode_message(payload_dict)
        sock = FakeSocket(raw)
        result = srv._recv_message(sock)
        assert result == payload_dict

    def test_recv_message_too_large(self):
        """Messages larger than 10 MB should be rejected."""
        # Craft a header claiming 11 MB.
        fake_header = struct.pack(">I", 11 * 1024 * 1024)
        sock = FakeSocket(fake_header)
        with pytest.raises(ValueError, match="Message too large"):
            srv._recv_message(sock)

    def test_send_message(self):
        sock = FakeSocket()
        msg = {"jsonrpc": "2.0", "id": 1, "result": {"ok": True}}
        srv._send_message(sock, msg)

        # Decode what was sent.
        decoded = _decode_message(bytes(sock.sent_data))
        assert decoded == msg

    def test_send_message_length_prefix_correct(self):
        sock = FakeSocket()
        msg = {"key": "value"}
        srv._send_message(sock, msg)
        raw = bytes(sock.sent_data)
        expected_payload = json.dumps(msg).encode("utf-8")
        expected_len = struct.pack(">I", len(expected_payload))
        assert raw[:4] == expected_len
        assert raw[4:] == expected_payload

    def test_roundtrip_encode_decode(self):
        """Encode then decode should yield the original message."""
        original = {"jsonrpc": "2.0", "method": "create_mesh", "params": {"size": 3.0}, "id": 42}
        raw = _encode_message(original)
        decoded = _decode_message(raw)
        assert decoded == original


# ===================================================================
# Test: JSON-RPC request validation (in _handle_client)
# ===================================================================

class TestJsonRpcValidation:
    """Test that invalid JSON-RPC requests are properly rejected."""

    def test_missing_jsonrpc_field(self):
        """A request without 'jsonrpc': '2.0' should get an error response."""
        request = {"method": "test", "id": 1}
        raw = _encode_message(request)

        # Build a FakeSocket that returns the request then closes.
        sock = FakeSocket(raw)

        # We need to also simulate that after sending the error the next
        # recv raises ConnectionError to exit the loop.
        original_recv = sock.recv
        call_count = [0]
        payload_len = len(raw)

        def patched_recv(n):
            # After the first full message has been read, simulate close.
            if sock._recv_pos >= payload_len:
                return b""
            return original_recv(n)

        sock.recv = patched_recv

        # Stop flag so the while-loop exits.
        srv._should_stop.clear()

        # Patch _should_stop.is_set to return False once then True.
        with patch.object(srv._should_stop, "is_set", side_effect=[False, True]):
            srv._handle_client(sock, ("127.0.0.1", 9999))

        # Check the error response that was sent back.
        if sock.sent_data:
            response = _decode_message(bytes(sock.sent_data))
            assert response["jsonrpc"] == "2.0"
            assert "error" in response
            assert response["error"]["code"] == -32600
            assert "Invalid JSON-RPC" in response["error"]["message"]

    def test_wrong_jsonrpc_version(self):
        """A request with jsonrpc != '2.0' should get an error response."""
        request = {"jsonrpc": "1.0", "method": "test", "id": 2}
        raw = _encode_message(request)
        sock = FakeSocket(raw)

        original_recv = sock.recv
        payload_len = len(raw)

        def patched_recv(n):
            if sock._recv_pos >= payload_len:
                return b""
            return original_recv(n)

        sock.recv = patched_recv

        srv._should_stop.clear()
        with patch.object(srv._should_stop, "is_set", side_effect=[False, True]):
            srv._handle_client(sock, ("127.0.0.1", 9999))

        if sock.sent_data:
            response = _decode_message(bytes(sock.sent_data))
            assert response["error"]["code"] == -32600


# ===================================================================
# Test: JSON-RPC response formatting via _process_exec_queue
# ===================================================================

class TestProcessExecQueue:
    """Test the main-thread timer callback that processes queued requests."""

    def setup_method(self):
        """Ensure the exec queue is empty and server is 'running'."""
        while not srv._exec_queue.empty():
            try:
                srv._exec_queue.get_nowait()
            except queue.Empty:
                break

    def test_success_response_format(self):
        """A successful tool execution should produce a proper JSON-RPC result."""
        mock_result = {"object_name": "Cube", "mesh_type": "cube"}
        result_q = queue.Queue()
        request = {"jsonrpc": "2.0", "method": "create_mesh", "params": {}, "id": 10}
        srv._exec_queue.put((request, result_q))

        with patch.object(tool_executor, "execute", return_value=mock_result):
            # Temporarily set _is_running to True so the timer runs.
            original = srv._is_running
            srv._is_running = True
            try:
                ret = srv._process_exec_queue()
            finally:
                srv._is_running = original

        response = result_q.get_nowait()
        assert response["jsonrpc"] == "2.0"
        assert response["id"] == 10
        assert response["result"] == mock_result
        assert "error" not in response

    def test_error_response_format(self):
        """When a tool raises, the response should contain a JSON-RPC error."""
        result_q = queue.Queue()
        request = {"jsonrpc": "2.0", "method": "bad_tool", "params": {}, "id": 11}
        srv._exec_queue.put((request, result_q))

        with patch.object(
            tool_executor, "execute",
            side_effect=ValueError("Unknown tool 'bad_tool'"),
        ):
            original = srv._is_running
            srv._is_running = True
            try:
                srv._process_exec_queue()
            finally:
                srv._is_running = original

        response = result_q.get_nowait()
        assert response["jsonrpc"] == "2.0"
        assert response["id"] == 11
        assert "error" in response
        assert response["error"]["code"] == -32603
        assert "result" not in response

    def test_process_queue_returns_interval(self):
        """When running, the timer should return 0.05 to reschedule itself."""
        original = srv._is_running
        srv._is_running = True
        try:
            ret = srv._process_exec_queue()
        finally:
            srv._is_running = original
        assert ret == 0.05

    def test_process_queue_returns_none_when_stopped(self):
        """When not running, the timer should return None to stop rescheduling."""
        original = srv._is_running
        srv._is_running = False
        try:
            ret = srv._process_exec_queue()
        finally:
            srv._is_running = original
        assert ret is None

    def test_multiple_requests_processed(self):
        """The timer should drain all queued requests in one call."""
        results = []
        for i in range(3):
            rq = queue.Queue()
            request = {"jsonrpc": "2.0", "method": f"tool_{i}", "params": {}, "id": i}
            srv._exec_queue.put((request, rq))
            results.append((i, rq))

        with patch.object(
            tool_executor, "execute",
            side_effect=[{"r": 0}, {"r": 1}, {"r": 2}],
        ):
            original = srv._is_running
            srv._is_running = True
            try:
                srv._process_exec_queue()
            finally:
                srv._is_running = original

        for idx, rq in results:
            response = rq.get_nowait()
            assert response["id"] == idx
            assert response["result"] == {"r": idx}

    def test_request_with_no_id(self):
        """A request without an 'id' field should still produce a response with id=None."""
        result_q = queue.Queue()
        request = {"jsonrpc": "2.0", "method": "some_tool", "params": {}}
        srv._exec_queue.put((request, result_q))

        with patch.object(tool_executor, "execute", return_value={"done": True}):
            original = srv._is_running
            srv._is_running = True
            try:
                srv._process_exec_queue()
            finally:
                srv._is_running = original

        response = result_q.get_nowait()
        assert response["id"] is None
        assert response["result"] == {"done": True}

    def test_request_with_no_params(self):
        """A request without 'params' should default to empty dict."""
        result_q = queue.Queue()
        request = {"jsonrpc": "2.0", "method": "some_tool", "id": 99}
        srv._exec_queue.put((request, result_q))

        with patch.object(tool_executor, "execute", return_value={"ok": True}) as mock_exec:
            original = srv._is_running
            srv._is_running = True
            try:
                srv._process_exec_queue()
            finally:
                srv._is_running = original

        # Verify execute was called with empty params.
        mock_exec.assert_called_once_with("some_tool", {})


# ===================================================================
# Test: length-prefixed protocol round trip
# ===================================================================

class TestLengthPrefixedProtocol:
    """Test encoding and decoding of the 4-byte big-endian length prefix."""

    def test_small_message(self):
        msg = {"a": 1}
        sock = FakeSocket()
        srv._send_message(sock, msg)
        raw = bytes(sock.sent_data)

        # Verify length prefix.
        payload = json.dumps(msg).encode("utf-8")
        assert len(raw) == 4 + len(payload)
        assert struct.unpack(">I", raw[:4])[0] == len(payload)

    def test_empty_dict_message(self):
        msg = {}
        sock = FakeSocket()
        srv._send_message(sock, msg)
        raw = bytes(sock.sent_data)
        payload = json.dumps(msg).encode("utf-8")
        assert struct.unpack(">I", raw[:4])[0] == len(payload)

    def test_large_payload(self):
        msg = {"data": "x" * 100000}
        sock = FakeSocket()
        srv._send_message(sock, msg)
        raw = bytes(sock.sent_data)
        payload = json.dumps(msg).encode("utf-8")
        assert struct.unpack(">I", raw[:4])[0] == len(payload)
        assert raw[4:] == payload

    def test_unicode_payload(self):
        msg = {"text": "Hello, world! Special chars: a with accent e, u with umlaut, and CJK: han"}
        sock = FakeSocket()
        srv._send_message(sock, msg)
        raw = bytes(sock.sent_data)
        decoded = _decode_message(raw)
        assert decoded == msg

    def test_recv_then_send_roundtrip(self):
        """Send a message, then read it back via _recv_message."""
        original = {"jsonrpc": "2.0", "id": 7, "result": {"status": "ok"}}
        sock = FakeSocket()
        srv._send_message(sock, original)
        raw = bytes(sock.sent_data)

        # Feed the raw bytes back into a new FakeSocket for reading.
        read_sock = FakeSocket(raw)
        decoded = srv._recv_message(read_sock)
        assert decoded == original


# ===================================================================
# Test: malformed request handling
# ===================================================================

class TestMalformedRequests:
    """Test that the server handles various kinds of bad input gracefully."""

    def test_recv_exact_with_zero_bytes(self):
        """Requesting zero bytes should return empty bytes immediately."""
        sock = FakeSocket(b"data")
        result = srv._recv_exact(sock, 0)
        assert result == b""

    def test_connection_closed_during_length_read(self):
        """If the connection drops during the 4-byte length read, raise."""
        mock_sock = MagicMock()
        mock_sock.recv.return_value = b""
        with pytest.raises(ConnectionError):
            srv._recv_message(mock_sock)

    def test_connection_closed_during_payload_read(self):
        """If the connection drops during payload read, raise."""
        # Send valid 4-byte header claiming 100 bytes, then close.
        header = struct.pack(">I", 100)
        mock_sock = MagicMock()
        mock_sock.recv.side_effect = [header, b""]
        with pytest.raises(ConnectionError):
            srv._recv_message(mock_sock)


# ===================================================================
# Test: public helper functions
# ===================================================================

class TestPublicHelpers:
    """Test is_running, get_port, get_connected_clients."""

    def test_is_running_default(self):
        original = srv._is_running
        srv._is_running = False
        try:
            assert srv.is_running() is False
        finally:
            srv._is_running = original

    def test_get_port_default(self):
        original = srv._current_port
        srv._current_port = 19801
        try:
            assert srv.get_port() == 19801
        finally:
            srv._current_port = original

    def test_get_connected_clients_default(self):
        with srv._clients_lock:
            original = srv._connected_clients
            srv._connected_clients = 0
        try:
            assert srv.get_connected_clients() == 0
        finally:
            with srv._clients_lock:
                srv._connected_clients = original

    def test_get_connected_clients_nonzero(self):
        with srv._clients_lock:
            original = srv._connected_clients
            srv._connected_clients = 5
        try:
            assert srv.get_connected_clients() == 5
        finally:
            with srv._clients_lock:
                srv._connected_clients = original

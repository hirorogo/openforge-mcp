"""
TCP server for receiving JSON-RPC requests from the MCP server.

Runs in a background thread and dispatches Blender API calls to the main
thread via bpy.app.timers so the single-threaded Blender API is never
called from a secondary thread.
"""

import json
import queue
import socket
import struct
import threading
import traceback
from typing import Any, Dict, Optional

import bpy

from . import tool_executor

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------

_server_thread: Optional[threading.Thread] = None
_server_socket: Optional[socket.socket] = None
_should_stop = threading.Event()
_connected_clients: int = 0
_clients_lock = threading.Lock()
_is_running: bool = False
_current_port: int = 19801

# Execution queue: items are (request_dict, result_queue) tuples.
_exec_queue: queue.Queue = queue.Queue()


# ---------------------------------------------------------------------------
# Public helpers (read from any thread)
# ---------------------------------------------------------------------------

def is_running() -> bool:
    return _is_running


def get_port() -> int:
    return _current_port


def get_connected_clients() -> int:
    with _clients_lock:
        return _connected_clients


# ---------------------------------------------------------------------------
# Wire protocol helpers
#
# Each message is framed as:
#   4 bytes  - big-endian uint32 payload length
#   N bytes  - UTF-8 JSON payload
# ---------------------------------------------------------------------------

def _recv_exact(sock: socket.socket, n: int) -> bytes:
    """Receive exactly *n* bytes from *sock*, or raise ConnectionError."""
    data = b""
    while len(data) < n:
        chunk = sock.recv(n - len(data))
        if not chunk:
            raise ConnectionError("Connection closed")
        data += chunk
    return data


def _recv_message(sock: socket.socket) -> Dict[str, Any]:
    """Read one length-prefixed JSON message."""
    raw_len = _recv_exact(sock, 4)
    length = struct.unpack(">I", raw_len)[0]
    if length > 10 * 1024 * 1024:
        raise ValueError(f"Message too large: {length} bytes")
    payload = _recv_exact(sock, length)
    return json.loads(payload.decode("utf-8"))


def _send_message(sock: socket.socket, obj: Dict[str, Any]) -> None:
    """Send one length-prefixed JSON message."""
    payload = json.dumps(obj).encode("utf-8")
    sock.sendall(struct.pack(">I", len(payload)) + payload)


# ---------------------------------------------------------------------------
# Main-thread execution via bpy.app.timers
# ---------------------------------------------------------------------------

def _process_exec_queue() -> Optional[float]:
    """Timer callback executed in Blender's main thread.

    Drains the execution queue, runs each tool call, and places the result
    back into the per-request result queue so the client handler thread can
    send the response.

    Returns 0.05 to be called again in ~50 ms, or ``None`` to stop.
    """
    if not _is_running:
        return None

    try:
        while not _exec_queue.empty():
            request, result_q = _exec_queue.get_nowait()
            method = request.get("method", "")
            params = request.get("params", {})
            req_id = request.get("id")

            try:
                result = tool_executor.execute(method, params)
                response: Dict[str, Any] = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": result,
                }
            except Exception:
                tb = traceback.format_exc()
                response = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32603,
                        "message": str(tb),
                    },
                }
            result_q.put(response)
    except Exception:
        traceback.print_exc()

    return 0.05


# ---------------------------------------------------------------------------
# Client handler (runs in its own thread per connection)
# ---------------------------------------------------------------------------

def _handle_client(conn: socket.socket, addr: tuple) -> None:
    global _connected_clients

    with _clients_lock:
        _connected_clients += 1

    try:
        conn.settimeout(1.0)
        while not _should_stop.is_set():
            try:
                request = _recv_message(conn)
            except socket.timeout:
                continue
            except (ConnectionError, ValueError):
                break

            # Validate minimal JSON-RPC structure
            if not isinstance(request, dict) or request.get("jsonrpc") != "2.0":
                error_resp: Dict[str, Any] = {
                    "jsonrpc": "2.0",
                    "id": request.get("id") if isinstance(request, dict) else None,
                    "error": {
                        "code": -32600,
                        "message": "Invalid JSON-RPC 2.0 request",
                    },
                }
                try:
                    _send_message(conn, error_resp)
                except Exception:
                    break
                continue

            # Enqueue for main-thread execution and wait for the result.
            result_q: queue.Queue = queue.Queue()
            _exec_queue.put((request, result_q))

            try:
                response = result_q.get(timeout=30.0)
            except queue.Empty:
                response = {
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "error": {
                        "code": -32603,
                        "message": "Execution timed out (30 s)",
                    },
                }

            try:
                _send_message(conn, response)
            except Exception:
                break
    finally:
        with _clients_lock:
            _connected_clients -= 1
        try:
            conn.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Accept loop (runs in the server thread)
# ---------------------------------------------------------------------------

def _accept_loop(sock: socket.socket) -> None:
    """Accept incoming connections until ``_should_stop`` is set."""
    sock.settimeout(1.0)
    while not _should_stop.is_set():
        try:
            conn, addr = sock.accept()
        except socket.timeout:
            continue
        except OSError:
            break

        client_thread = threading.Thread(
            target=_handle_client,
            args=(conn, addr),
            daemon=True,
            name=f"openforge-client-{addr}",
        )
        client_thread.start()


# ---------------------------------------------------------------------------
# Public start / stop
# ---------------------------------------------------------------------------

def start_server(port: int = 19801) -> None:
    global _server_thread, _server_socket, _is_running, _current_port

    if _is_running:
        return

    _should_stop.clear()
    _current_port = port

    _server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    _server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        _server_socket.bind(("127.0.0.1", port))
    except OSError as exc:
        _server_socket.close()
        _server_socket = None
        raise RuntimeError(f"Cannot bind to port {port}: {exc}") from exc

    _server_socket.listen(5)

    _server_thread = threading.Thread(
        target=_accept_loop,
        args=(_server_socket,),
        daemon=True,
        name="openforge-server",
    )
    _server_thread.start()

    _is_running = True

    # Register the main-thread timer that drains the execution queue.
    bpy.app.timers.register(_process_exec_queue, first_interval=0.1, persistent=True)

    print(f"[OpenForge MCP] Server started on 127.0.0.1:{port}")


def stop_server() -> None:
    global _server_thread, _server_socket, _is_running

    if not _is_running:
        return

    _should_stop.set()
    _is_running = False

    if _server_socket is not None:
        try:
            _server_socket.close()
        except Exception:
            pass
        _server_socket = None

    if _server_thread is not None:
        _server_thread.join(timeout=5.0)
        _server_thread = None

    # The timer will self-remove on next tick because _is_running is False.

    # Drain any leftover items in the queue.
    while not _exec_queue.empty():
        try:
            _exec_queue.get_nowait()
        except queue.Empty:
            break

    with _clients_lock:
        global _connected_clients
        _connected_clients = 0

    print("[OpenForge MCP] Server stopped")

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor
{
    [InitializeOnLoad]
    public static class OpenForgeServer
    {
        private static TcpListener _listener;
        private static Thread _listenThread;
        private static volatile bool _running;
        private static int _port = 19800;

        private static readonly ConcurrentQueue<PendingRequest> _requestQueue =
            new ConcurrentQueue<PendingRequest>();

        private static bool _connected;
        private static string _lastError;
        private static int _activeClientCount;

        public static bool IsRunning => _running;
        public static bool IsConnected => _connected;
        public static int Port => _port;
        public static string LastError => _lastError;
        public static int ActiveClients => _activeClientCount;

        static OpenForgeServer()
        {
            Start();
            EditorApplication.update += Update;
            EditorApplication.quitting += Stop;
            AssemblyReloadEvents.beforeAssemblyReload += Stop;
            AssemblyReloadEvents.afterAssemblyReload += Start;
        }

        public static void Start()
        {
            if (_running) return;

            _port = EditorPrefs.GetInt("OpenForge_Port", 19800);

            try
            {
                _listener = new TcpListener(IPAddress.Loopback, _port);
                _listener.Start();
                _running = true;
                _lastError = null;

                _listenThread = new Thread(ListenLoop)
                {
                    IsBackground = true,
                    Name = "OpenForge-Listen"
                };
                _listenThread.Start();

                Debug.Log($"[OpenForge] Server started on port {_port}");
            }
            catch (Exception ex)
            {
                _lastError = ex.Message;
                Debug.LogError($"[OpenForge] Failed to start server: {ex.Message}");
            }
        }

        public static void Stop()
        {
            if (!_running) return;
            _running = false;

            try
            {
                _listener?.Stop();
            }
            catch (Exception)
            {
                // Ignore errors during shutdown.
            }

            _connected = false;
            _activeClientCount = 0;
            Debug.Log("[OpenForge] Server stopped");
        }

        public static void Restart()
        {
            Stop();
            Start();
        }

        public static void SetPort(int port)
        {
            EditorPrefs.SetInt("OpenForge_Port", port);
            if (_running)
            {
                Restart();
            }
        }

        private static void ListenLoop()
        {
            while (_running)
            {
                try
                {
                    TcpClient client = _listener.AcceptTcpClient();
                    Interlocked.Increment(ref _activeClientCount);
                    _connected = true;

                    Thread clientThread = new Thread(() => HandleClient(client))
                    {
                        IsBackground = true,
                        Name = "OpenForge-Client"
                    };
                    clientThread.Start();
                }
                catch (SocketException)
                {
                    // Expected when listener is stopped.
                }
                catch (ObjectDisposedException)
                {
                    // Expected when listener is disposed.
                }
            }
        }

        private static void HandleClient(TcpClient client)
        {
            try
            {
                using (client)
                using (NetworkStream stream = client.GetStream())
                {
                    client.ReceiveTimeout = 30000;
                    client.SendTimeout = 30000;

                    byte[] lengthBuffer = new byte[4];

                    while (_running && client.Connected)
                    {
                        // Read message length prefix (4 bytes, big-endian).
                        int bytesRead = ReadExact(stream, lengthBuffer, 4);
                        if (bytesRead < 4) break;

                        int messageLength = (lengthBuffer[0] << 24)
                                          | (lengthBuffer[1] << 16)
                                          | (lengthBuffer[2] << 8)
                                          | lengthBuffer[3];

                        if (messageLength <= 0 || messageLength > 10 * 1024 * 1024)
                        {
                            // Try newline-delimited fallback: reconstruct what we read so far.
                            string partial = Encoding.UTF8.GetString(lengthBuffer);
                            string line = partial + ReadLine(stream);
                            if (!string.IsNullOrEmpty(line))
                            {
                                ProcessRawMessage(line.Trim(), stream);
                            }
                            continue;
                        }

                        byte[] messageBuffer = new byte[messageLength];
                        bytesRead = ReadExact(stream, messageBuffer, messageLength);
                        if (bytesRead < messageLength) break;

                        string json = Encoding.UTF8.GetString(messageBuffer);
                        ProcessRawMessage(json, stream);
                    }
                }
            }
            catch (IOException)
            {
                // Client disconnected.
            }
            catch (Exception ex)
            {
                Debug.LogError($"[OpenForge] Client error: {ex.Message}");
            }
            finally
            {
                int count = Interlocked.Decrement(ref _activeClientCount);
                if (count <= 0) _connected = false;
            }
        }

        private static void ProcessRawMessage(string json, NetworkStream stream)
        {
            // Also support newline-delimited JSON: split by newline, process each.
            string[] lines = json.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (string line in lines)
            {
                string trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                ManualResetEventSlim done = new ManualResetEventSlim(false);
                string response = null;

                PendingRequest pending = new PendingRequest
                {
                    Json = trimmed,
                    OnComplete = (result) =>
                    {
                        response = result;
                        done.Set();
                    }
                };

                _requestQueue.Enqueue(pending);

                // Wait for the main thread to process (up to 60 seconds).
                done.Wait(60000);

                if (response != null)
                {
                    SendResponse(stream, response);
                }
            }
        }

        private static void SendResponse(NetworkStream stream, string json)
        {
            try
            {
                byte[] data = Encoding.UTF8.GetBytes(json);
                byte[] length = new byte[4];
                length[0] = (byte)((data.Length >> 24) & 0xFF);
                length[1] = (byte)((data.Length >> 16) & 0xFF);
                length[2] = (byte)((data.Length >> 8) & 0xFF);
                length[3] = (byte)(data.Length & 0xFF);

                stream.Write(length, 0, 4);
                stream.Write(data, 0, data.Length);
                stream.Flush();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[OpenForge] Failed to send response: {ex.Message}");
            }
        }

        private static int ReadExact(NetworkStream stream, byte[] buffer, int count)
        {
            int offset = 0;
            while (offset < count)
            {
                int read = stream.Read(buffer, offset, count - offset);
                if (read == 0) return offset;
                offset += read;
            }
            return offset;
        }

        private static string ReadLine(NetworkStream stream)
        {
            StringBuilder sb = new StringBuilder();
            int b;
            while ((b = stream.ReadByte()) >= 0)
            {
                if (b == '\n') break;
                sb.Append((char)b);
            }
            return sb.ToString();
        }

        private static void Update()
        {
            // Process pending requests on the main thread.
            int processed = 0;
            while (_requestQueue.TryDequeue(out PendingRequest request) && processed < 10)
            {
                processed++;
                string response;
                try
                {
                    response = DispatchRequest(request.Json);
                }
                catch (Exception ex)
                {
                    response = CreateErrorResponse(null, -32603, $"Internal error: {ex.Message}");
                }
                request.OnComplete?.Invoke(response);
            }
        }

        private static string DispatchRequest(string json)
        {
            JsonRpcRequest rpc;
            try
            {
                rpc = JsonUtility.FromJson<JsonRpcRequest>(json);
            }
            catch (Exception)
            {
                return CreateErrorResponse(null, -32700, "Parse error: invalid JSON");
            }

            if (string.IsNullOrEmpty(rpc.method))
            {
                return CreateErrorResponse(rpc.id, -32600, "Invalid request: missing method");
            }

            try
            {
                ToolResult result = ToolExecutor.Execute(rpc.method, rpc.@params);
                return CreateSuccessResponse(rpc.id, result);
            }
            catch (Exception ex)
            {
                return CreateErrorResponse(rpc.id, -32603, ex.Message);
            }
        }

        private static string CreateSuccessResponse(string id, ToolResult result)
        {
            JsonRpcResponse response = new JsonRpcResponse
            {
                jsonrpc = "2.0",
                id = id,
                result = result
            };
            return JsonUtility.ToJson(response);
        }

        private static string CreateErrorResponse(string id, int code, string message)
        {
            // Build error response manually since nested serialization can be tricky.
            return $"{{\"jsonrpc\":\"2.0\",\"id\":{(id != null ? $"\"{id}\"" : "null")},\"error\":{{\"code\":{code},\"message\":{EscapeJsonString(message)}}}}}";
        }

        private static string EscapeJsonString(string s)
        {
            if (s == null) return "null";
            StringBuilder sb = new StringBuilder("\"");
            foreach (char c in s)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default: sb.Append(c); break;
                }
            }
            sb.Append('"');
            return sb.ToString();
        }

        [Serializable]
        private class JsonRpcRequest
        {
            public string jsonrpc;
            public string id;
            public string method;
            public string @params;
        }

        [Serializable]
        private class JsonRpcResponse
        {
            public string jsonrpc;
            public string id;
            public ToolResult result;
        }

        private class PendingRequest
        {
            public string Json;
            public Action<string> OnComplete;
        }
    }

    [Serializable]
    public class ToolResult
    {
        public bool success;
        public string message;
        public string data;
    }
}

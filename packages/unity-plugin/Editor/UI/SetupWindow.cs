using System;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.UI
{
    public class SetupWindow : EditorWindow
    {
        private int _port;
        private int _selectedMode;
        private string _statusMessage;
        private MessageType _statusType;
        private Vector2 _scrollPosition;

        private static readonly string[] ModeLabels = { "Full", "Essential", "Dynamic" };
        private static readonly string[] ModeDescriptions =
        {
            "All tools enabled. Maximum control over the Editor.",
            "Core tools only: scene, gameobject, and material operations.",
            "Tools are loaded on demand based on the current task."
        };

        [MenuItem("Tools/OpenForge/Setup")]
        public static void ShowWindow()
        {
            SetupWindow window = GetWindow<SetupWindow>("OpenForge Setup");
            window.minSize = new Vector2(380, 340);
        }

        private void OnEnable()
        {
            _port = EditorPrefs.GetInt("OpenForge_Port", 19800);
            _selectedMode = EditorPrefs.GetInt("OpenForge_Mode", 0);
            _statusMessage = null;
        }

        private void OnGUI()
        {
            _scrollPosition = EditorGUILayout.BeginScrollView(_scrollPosition);

            // Header
            EditorGUILayout.Space(8);
            EditorGUILayout.LabelField("OpenForge MCP", EditorStyles.boldLabel);
            EditorGUILayout.LabelField("Control Unity Editor via natural language AI.", EditorStyles.miniLabel);
            DrawSeparator();

            // Connection Status
            EditorGUILayout.LabelField("Connection", EditorStyles.boldLabel);
            EditorGUILayout.Space(4);

            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Status:", GUILayout.Width(80));
            if (OpenForgeServer.IsRunning)
            {
                if (OpenForgeServer.IsConnected)
                {
                    EditorGUILayout.LabelField(
                        $"Connected ({OpenForgeServer.ActiveClients} client(s))",
                        CreateStatusStyle(new Color(0.2f, 0.7f, 0.2f)));
                }
                else
                {
                    EditorGUILayout.LabelField(
                        "Listening (no clients)",
                        CreateStatusStyle(new Color(0.8f, 0.6f, 0.1f)));
                }
            }
            else
            {
                EditorGUILayout.LabelField(
                    "Stopped",
                    CreateStatusStyle(new Color(0.8f, 0.2f, 0.2f)));
            }
            EditorGUILayout.EndHorizontal();

            if (!string.IsNullOrEmpty(OpenForgeServer.LastError))
            {
                EditorGUILayout.HelpBox($"Error: {OpenForgeServer.LastError}", MessageType.Error);
            }

            EditorGUILayout.Space(8);

            // Port
            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Port:", GUILayout.Width(80));
            int newPort = EditorGUILayout.IntField(_port);
            if (newPort != _port)
            {
                _port = Mathf.Clamp(newPort, 1024, 65535);
            }
            EditorGUILayout.EndHorizontal();

            if (_port != EditorPrefs.GetInt("OpenForge_Port", 19800))
            {
                EditorGUILayout.HelpBox("Port changed. Click Apply to restart the server.", MessageType.Info);
            }

            EditorGUILayout.Space(4);

            EditorGUILayout.BeginHorizontal();
            if (GUILayout.Button("Apply", GUILayout.Width(80)))
            {
                OpenForgeServer.SetPort(_port);
                _statusMessage = $"Server restarted on port {_port}";
                _statusType = MessageType.Info;
            }

            if (OpenForgeServer.IsRunning)
            {
                if (GUILayout.Button("Stop Server", GUILayout.Width(100)))
                {
                    OpenForgeServer.Stop();
                    _statusMessage = "Server stopped";
                    _statusType = MessageType.Warning;
                }
            }
            else
            {
                if (GUILayout.Button("Start Server", GUILayout.Width(100)))
                {
                    OpenForgeServer.Start();
                    _statusMessage = "Server started";
                    _statusType = MessageType.Info;
                }
            }
            EditorGUILayout.EndHorizontal();

            DrawSeparator();

            // Mode
            EditorGUILayout.LabelField("Tool Mode", EditorStyles.boldLabel);
            EditorGUILayout.Space(4);

            int newMode = GUILayout.SelectionGrid(_selectedMode, ModeLabels, 3);
            if (newMode != _selectedMode)
            {
                _selectedMode = newMode;
                EditorPrefs.SetInt("OpenForge_Mode", _selectedMode);
            }

            EditorGUILayout.Space(2);
            EditorGUILayout.LabelField(ModeDescriptions[_selectedMode], EditorStyles.wordWrappedMiniLabel);

            DrawSeparator();

            // Actions
            EditorGUILayout.LabelField("Actions", EditorStyles.boldLabel);
            EditorGUILayout.Space(4);

            EditorGUILayout.BeginHorizontal();

            if (GUILayout.Button("Test Connection"))
            {
                TestConnection();
            }

            if (GUILayout.Button("Copy MCP Config"))
            {
                CopyMcpConfig();
            }

            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space(4);

            // Registered tools info
            if (GUILayout.Button("Show Registered Tools"))
            {
                ShowRegisteredTools();
            }

            // Status message
            if (!string.IsNullOrEmpty(_statusMessage))
            {
                EditorGUILayout.Space(8);
                EditorGUILayout.HelpBox(_statusMessage, _statusType);
            }

            EditorGUILayout.Space(8);

            // Footer
            EditorGUILayout.LabelField($"v0.1.0  |  Port {OpenForgeServer.Port}", EditorStyles.centeredGreyMiniLabel);

            EditorGUILayout.EndScrollView();
        }

        private void TestConnection()
        {
            if (!OpenForgeServer.IsRunning)
            {
                _statusMessage = "Server is not running. Start it first.";
                _statusType = MessageType.Error;
                return;
            }

            try
            {
                using (var client = new System.Net.Sockets.TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", OpenForgeServer.Port, null, null);
                    bool connected = result.AsyncWaitHandle.WaitOne(TimeSpan.FromSeconds(2));

                    if (connected && client.Connected)
                    {
                        client.EndConnect(result);
                        _statusMessage = $"Connection successful. Server is listening on port {OpenForgeServer.Port}.";
                        _statusType = MessageType.Info;
                    }
                    else
                    {
                        _statusMessage = $"Could not connect to port {OpenForgeServer.Port}.";
                        _statusType = MessageType.Error;
                    }
                }
            }
            catch (Exception ex)
            {
                _statusMessage = $"Connection test failed: {ex.Message}";
                _statusType = MessageType.Error;
            }

            Repaint();
        }

        private void CopyMcpConfig()
        {
            string config = "{\n"
                + "  \"mcpServers\": {\n"
                + "    \"openforge-unity\": {\n"
                + "      \"transport\": {\n"
                + "        \"type\": \"tcp\",\n"
                + $"        \"host\": \"127.0.0.1\",\n"
                + $"        \"port\": {_port}\n"
                + "      }\n"
                + "    }\n"
                + "  }\n"
                + "}";

            EditorGUIUtility.systemCopyBuffer = config;
            _statusMessage = "MCP configuration copied to clipboard.";
            _statusType = MessageType.Info;
            Repaint();
        }

        private void ShowRegisteredTools()
        {
            // Force initialization so we can read the tool list.
            ToolExecutor.Execute("__noop__", null);

            var handlers = ToolExecutor.Handlers;
            string toolList = $"{handlers.Count} registered tool(s):\n";
            foreach (var key in handlers.Keys)
            {
                toolList += $"  - {key}\n";
            }

            _statusMessage = toolList;
            _statusType = MessageType.Info;
            Repaint();
        }

        private static void DrawSeparator()
        {
            EditorGUILayout.Space(4);
            Rect rect = EditorGUILayout.GetControlRect(false, 1);
            EditorGUI.DrawRect(rect, new Color(0.5f, 0.5f, 0.5f, 0.3f));
            EditorGUILayout.Space(4);
        }

        private static GUIStyle CreateStatusStyle(Color color)
        {
            GUIStyle style = new GUIStyle(EditorStyles.label);
            style.normal.textColor = color;
            style.fontStyle = FontStyle.Bold;
            return style;
        }
    }
}

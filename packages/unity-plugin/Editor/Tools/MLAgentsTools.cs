using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class MLAgentsTools
    {
        private static Process _trainingProcess;
        private static string _activeRunId;
        private static DateTime _trainingStartTime;

        public static void Register()
        {
            ToolExecutor.Register("setup_ml_agents", SetupMLAgents);
            ToolExecutor.Register("create_training_environment", CreateTrainingEnvironment);
            ToolExecutor.Register("add_ml_agent", AddMLAgent);
            ToolExecutor.Register("configure_behavior", ConfigureBehavior);
            ToolExecutor.Register("add_observation", AddObservation);
            ToolExecutor.Register("add_reward_signal", AddRewardSignal);
            ToolExecutor.Register("start_training", StartTraining);
            ToolExecutor.Register("stop_training", StopTraining);
            ToolExecutor.Register("load_trained_model", LoadTrainedModel);
            ToolExecutor.Register("get_training_status", GetTrainingStatus);
        }

        // ---- Tool Implementations ----

        private static ToolResult SetupMLAgents(Dictionary<string, string> p)
        {
            string version = GetParam(p, "version", "");

#if UNITY_2019_1_OR_NEWER
            var listRequest = UnityEditor.PackageManager.Client.List(true);
            while (!listRequest.IsCompleted)
            {
                System.Threading.Thread.Sleep(10);
            }

            if (listRequest.Status == UnityEditor.PackageManager.StatusCode.Success)
            {
                foreach (var pkg in listRequest.Result)
                {
                    if (pkg.name == "com.unity.ml-agents")
                    {
                        return new ToolResult
                        {
                            success = true,
                            message = $"ML-Agents is already installed. Version: {pkg.version}",
                            data = $"{{\"installed\":true,\"version\":\"{Escape(pkg.version)}\",\"name\":\"{Escape(pkg.name)}\"}}"
                        };
                    }
                }
            }

            string packageId = string.IsNullOrEmpty(version)
                ? "com.unity.ml-agents"
                : $"com.unity.ml-agents@{version}";

            var addRequest = UnityEditor.PackageManager.Client.Add(packageId);
            while (!addRequest.IsCompleted)
            {
                System.Threading.Thread.Sleep(10);
            }

            if (addRequest.Status == UnityEditor.PackageManager.StatusCode.Success)
            {
                return new ToolResult
                {
                    success = true,
                    message = $"ML-Agents package installed successfully. Version: {addRequest.Result.version}",
                    data = $"{{\"installed\":true,\"version\":\"{Escape(addRequest.Result.version)}\",\"name\":\"{Escape(addRequest.Result.name)}\"}}"
                };
            }
            else
            {
                string error = addRequest.Error != null ? addRequest.Error.message : "Unknown error";
                return Fail($"Failed to install ML-Agents package: {error}");
            }
#else
            return Fail("ML-Agents package installation requires Unity 2019.1 or newer.");
#endif
        }

        private static ToolResult CreateTrainingEnvironment(Dictionary<string, string> p)
        {
            float groundSize = 20f;
            float wallHeight = 2f;
            string agentName = GetParam(p, "agentName", "TrainingAgent");
            string targetName = GetParam(p, "targetName", "Target");

            if (p.TryGetValue("groundSize", out string gsStr))
                float.TryParse(gsStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out groundSize);
            if (p.TryGetValue("wallHeight", out string whStr))
                float.TryParse(whStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out wallHeight);

            // Create parent container
            var envRoot = new GameObject("TrainingEnvironment");
            Undo.RegisterCreatedObjectUndo(envRoot, "Create Training Environment");

            // Ground plane
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.SetParent(envRoot.transform);
            ground.transform.localScale = new Vector3(groundSize / 10f, 1f, groundSize / 10f);
            ground.transform.localPosition = Vector3.zero;
            Undo.RegisterCreatedObjectUndo(ground, "Create Ground");

            // Walls
            float halfSize = groundSize / 2f;
            float wallThickness = 0.5f;
            string[] wallNames = { "WallNorth", "WallSouth", "WallEast", "WallWest" };
            Vector3[] wallPositions = {
                new Vector3(0, wallHeight / 2f, halfSize),
                new Vector3(0, wallHeight / 2f, -halfSize),
                new Vector3(halfSize, wallHeight / 2f, 0),
                new Vector3(-halfSize, wallHeight / 2f, 0)
            };
            Vector3[] wallScales = {
                new Vector3(groundSize, wallHeight, wallThickness),
                new Vector3(groundSize, wallHeight, wallThickness),
                new Vector3(wallThickness, wallHeight, groundSize),
                new Vector3(wallThickness, wallHeight, groundSize)
            };

            for (int i = 0; i < 4; i++)
            {
                var wall = GameObject.CreatePrimitive(PrimitiveType.Cube);
                wall.name = wallNames[i];
                wall.transform.SetParent(envRoot.transform);
                wall.transform.localPosition = wallPositions[i];
                wall.transform.localScale = wallScales[i];
                wall.tag = "Wall";
                Undo.RegisterCreatedObjectUndo(wall, $"Create {wallNames[i]}");
            }

            // Agent
            var agent = GameObject.CreatePrimitive(PrimitiveType.Cube);
            agent.name = agentName;
            agent.transform.SetParent(envRoot.transform);
            agent.transform.localPosition = new Vector3(0, 0.5f, 0);
            agent.transform.localScale = Vector3.one;
            var agentRb = agent.AddComponent<Rigidbody>();
            agentRb.constraints = RigidbodyConstraints.FreezeRotation;
            Undo.RegisterCreatedObjectUndo(agent, "Create Agent");

            // Target
            var target = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            target.name = targetName;
            target.transform.SetParent(envRoot.transform);
            target.transform.localPosition = new Vector3(5f, 0.5f, 5f);
            target.transform.localScale = Vector3.one;
            target.tag = "Target";
            Undo.RegisterCreatedObjectUndo(target, "Create Target");

            var sb = new StringBuilder();
            sb.Append("{\"environmentRoot\":\"TrainingEnvironment\"");
            sb.Append(",\"agent\":\"").Append(Escape(agentName)).Append("\"");
            sb.Append(",\"target\":\"").Append(Escape(targetName)).Append("\"");
            sb.Append(",\"groundSize\":").Append(groundSize.ToString(System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"wallHeight\":").Append(wallHeight.ToString(System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"objectsCreated\":7}");

            return new ToolResult
            {
                success = true,
                message = $"Training environment created with ground ({groundSize}x{groundSize}), 4 walls, agent '{agentName}', and target '{targetName}'.",
                data = sb.ToString()
            };
        }

        private static ToolResult AddMLAgent(Dictionary<string, string> p)
        {
            string goName = GetParam(p, "gameObject", "");
            if (string.IsNullOrEmpty(goName))
                return Fail("Parameter 'gameObject' is required.");

            string behaviorName = GetParam(p, "behaviorName", "DefaultBehavior");
            int decisionInterval = 5;
            if (p.TryGetValue("decisionInterval", out string diStr))
                int.TryParse(diStr, out decisionInterval);

            GameObject go = GameObject.Find(goName);
            if (go == null)
                return Fail($"GameObject '{goName}' not found in the scene.");

            var componentsAdded = new List<string>();

            // Add Agent component via reflection (since ML-Agents may not be compiled yet)
            Type agentType = FindType("Unity.MLAgents.Agent");
            if (agentType != null)
            {
                if (go.GetComponent(agentType) == null)
                {
                    Undo.AddComponent(go, agentType);
                    componentsAdded.Add("Agent");
                }
            }
            else
            {
                componentsAdded.Add("Agent (ML-Agents package not found - install first)");
            }

            // Add BehaviorParameters
            Type bpType = FindType("Unity.MLAgents.Policies.BehaviorParameters");
            if (bpType != null)
            {
                var bp = go.GetComponent(bpType);
                if (bp == null)
                {
                    bp = Undo.AddComponent(go, bpType);
                    componentsAdded.Add("BehaviorParameters");
                }
                // Set behavior name
                var nameField = bpType.GetField("BehaviorName",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (nameField != null)
                {
                    nameField.SetValue(bp, behaviorName);
                }
            }
            else
            {
                componentsAdded.Add("BehaviorParameters (ML-Agents package not found - install first)");
            }

            // Add DecisionRequester
            Type drType = FindType("Unity.MLAgents.DecisionRequester");
            if (drType != null)
            {
                var dr = go.GetComponent(drType);
                if (dr == null)
                {
                    dr = Undo.AddComponent(go, drType);
                    componentsAdded.Add("DecisionRequester");
                }
                var intervalField = drType.GetField("DecisionPeriod",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (intervalField != null)
                {
                    intervalField.SetValue(dr, decisionInterval);
                }
            }
            else
            {
                componentsAdded.Add("DecisionRequester (ML-Agents package not found - install first)");
            }

            string componentsList = string.Join(", ", componentsAdded);
            var sb = new StringBuilder();
            sb.Append("{\"gameObject\":\"").Append(Escape(goName)).Append("\"");
            sb.Append(",\"behaviorName\":\"").Append(Escape(behaviorName)).Append("\"");
            sb.Append(",\"decisionInterval\":").Append(decisionInterval);
            sb.Append(",\"componentsAdded\":[");
            for (int i = 0; i < componentsAdded.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append("\"").Append(Escape(componentsAdded[i])).Append("\"");
            }
            sb.Append("]}");

            return new ToolResult
            {
                success = true,
                message = $"Added ML-Agent components to '{goName}': {componentsList}.",
                data = sb.ToString()
            };
        }

        private static ToolResult ConfigureBehavior(Dictionary<string, string> p)
        {
            string goName = GetParam(p, "gameObject", "");
            string behaviorName = GetParam(p, "behaviorName", "");
            if (string.IsNullOrEmpty(goName))
                return Fail("Parameter 'gameObject' is required.");
            if (string.IsNullOrEmpty(behaviorName))
                return Fail("Parameter 'behaviorName' is required.");

            GameObject go = GameObject.Find(goName);
            if (go == null)
                return Fail($"GameObject '{goName}' not found in the scene.");

            Type bpType = FindType("Unity.MLAgents.Policies.BehaviorParameters");
            if (bpType == null)
                return Fail("ML-Agents package is not installed. Run setup_ml_agents first.");

            var bp = go.GetComponent(bpType);
            if (bp == null)
                return Fail($"No BehaviorParameters component found on '{goName}'. Run add_ml_agent first.");

            Undo.RecordObject(bp, "Configure Behavior");

            // Set behavior name
            var nameField = bpType.GetField("BehaviorName",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (nameField != null)
                nameField.SetValue(bp, behaviorName);

            // Configure observation space via BrainParameters
            var brainParamsProperty = bpType.GetProperty("BrainParameters",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            object brainParams = brainParamsProperty?.GetValue(bp);

            int observationSize = 0;
            int continuousActions = 0;
            string discreteBranches = "";

            if (brainParams != null)
            {
                if (p.TryGetValue("observationSize", out string obsStr) && int.TryParse(obsStr, out observationSize))
                {
                    var vecObsSizeField = brainParams.GetType().GetField("VectorObservationSize",
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                    if (vecObsSizeField != null)
                        vecObsSizeField.SetValue(brainParams, observationSize);
                }

                // Configure action spec
                if (p.TryGetValue("continuousActions", out string contStr))
                    int.TryParse(contStr, out continuousActions);

                discreteBranches = GetParam(p, "discreteBranches", "");

                var actionSpecProperty = brainParams.GetType().GetProperty("ActionSpec",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (actionSpecProperty != null)
                {
                    Type actionSpecType = FindType("Unity.MLAgents.Actuators.ActionSpec");
                    if (actionSpecType != null)
                    {
                        int[] branches = ParseIntArray(discreteBranches);
                        var makeMethod = actionSpecType.GetMethod("MakeDiscrete",
                            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);
                        var makeContinuousMethod = actionSpecType.GetMethod("MakeContinuous",
                            System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static);

                        if (continuousActions > 0 && branches.Length == 0 && makeContinuousMethod != null)
                        {
                            var spec = makeContinuousMethod.Invoke(null, new object[] { continuousActions });
                            actionSpecProperty.SetValue(brainParams, spec);
                        }
                        else if (branches.Length > 0 && makeMethod != null)
                        {
                            var spec = makeMethod.Invoke(null, new object[] { branches });
                            actionSpecProperty.SetValue(brainParams, spec);
                        }
                    }
                }
            }

            EditorUtility.SetDirty(bp);

            var sb = new StringBuilder();
            sb.Append("{\"gameObject\":\"").Append(Escape(goName)).Append("\"");
            sb.Append(",\"behaviorName\":\"").Append(Escape(behaviorName)).Append("\"");
            sb.Append(",\"observationSize\":").Append(observationSize);
            sb.Append(",\"continuousActions\":").Append(continuousActions);
            sb.Append(",\"discreteBranches\":\"").Append(Escape(discreteBranches)).Append("\"");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Configured behavior '{behaviorName}' on '{goName}' with observation size {observationSize}.",
                data = sb.ToString()
            };
        }

        private static ToolResult AddObservation(Dictionary<string, string> p)
        {
            string goName = GetParam(p, "gameObject", "");
            string obsType = GetParam(p, "type", "");
            if (string.IsNullOrEmpty(goName))
                return Fail("Parameter 'gameObject' is required.");
            if (string.IsNullOrEmpty(obsType))
                return Fail("Parameter 'type' is required.");

            GameObject go = GameObject.Find(goName);
            if (go == null)
                return Fail($"GameObject '{goName}' not found in the scene.");

            if (obsType == "ray_perception")
            {
                int raysPerDirection = 3;
                float maxRayDegrees = 70f;
                float rayLength = 20f;
                string detectableTags = GetParam(p, "detectableTags", "");

                if (p.TryGetValue("raysPerDirection", out string rpdStr)) int.TryParse(rpdStr, out raysPerDirection);
                if (p.TryGetValue("maxRayDegrees", out string mrdStr))
                    float.TryParse(mrdStr, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out maxRayDegrees);
                if (p.TryGetValue("rayLength", out string rlStr))
                    float.TryParse(rlStr, System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture, out rayLength);

                Type sensorType = FindType("Unity.MLAgents.Sensors.RayPerceptionSensorComponent3D");
                if (sensorType == null)
                    return Fail("ML-Agents package is not installed. Run setup_ml_agents first.");

                var sensor = Undo.AddComponent(go, sensorType);

                // Configure sensor via reflection
                SetFieldOrProperty(sensor, "RaysPerDirection", raysPerDirection);
                SetFieldOrProperty(sensor, "MaxRayDegrees", maxRayDegrees);
                SetFieldOrProperty(sensor, "RayLength", rayLength);

                if (!string.IsNullOrEmpty(detectableTags))
                {
                    string[] tags = detectableTags.Split(',');
                    var tagList = new List<string>();
                    foreach (string tag in tags)
                    {
                        string trimmed = tag.Trim();
                        if (!string.IsNullOrEmpty(trimmed))
                            tagList.Add(trimmed);
                    }
                    SetFieldOrProperty(sensor, "DetectableTags", tagList);
                }

                EditorUtility.SetDirty(sensor);

                return new ToolResult
                {
                    success = true,
                    message = $"Added RayPerceptionSensor3D to '{goName}' with {raysPerDirection} rays per direction, {maxRayDegrees} degrees, length {rayLength}.",
                    data = $"{{\"gameObject\":\"{Escape(goName)}\",\"type\":\"ray_perception\",\"raysPerDirection\":{raysPerDirection},\"maxRayDegrees\":{maxRayDegrees.ToString(System.Globalization.CultureInfo.InvariantCulture)},\"rayLength\":{rayLength.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}"
                };
            }
            else if (obsType == "vector")
            {
                int vectorSize = 0;
                if (p.TryGetValue("vectorSize", out string vsStr)) int.TryParse(vsStr, out vectorSize);
                if (vectorSize <= 0)
                    return Fail("Parameter 'vectorSize' must be a positive integer for vector observations.");

                // Vector observations are configured via BrainParameters
                Type bpType = FindType("Unity.MLAgents.Policies.BehaviorParameters");
                if (bpType == null)
                    return Fail("ML-Agents package is not installed. Run setup_ml_agents first.");

                var bp = go.GetComponent(bpType);
                if (bp == null)
                    return Fail($"No BehaviorParameters component found on '{goName}'. Run add_ml_agent first.");

                Undo.RecordObject(bp, "Add Vector Observation");

                var brainParamsProperty = bpType.GetProperty("BrainParameters",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                object brainParams = brainParamsProperty?.GetValue(bp);
                if (brainParams != null)
                {
                    var vecObsSizeField = brainParams.GetType().GetField("VectorObservationSize",
                        System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                    if (vecObsSizeField != null)
                        vecObsSizeField.SetValue(brainParams, vectorSize);
                }

                EditorUtility.SetDirty(bp);

                return new ToolResult
                {
                    success = true,
                    message = $"Set vector observation size to {vectorSize} on '{goName}'.",
                    data = $"{{\"gameObject\":\"{Escape(goName)}\",\"type\":\"vector\",\"vectorSize\":{vectorSize}}}"
                };
            }

            return Fail($"Unknown observation type: '{obsType}'. Use 'ray_perception' or 'vector'.");
        }

        private static ToolResult AddRewardSignal(Dictionary<string, string> p)
        {
            string goName = GetParam(p, "gameObject", "");
            string signalName = GetParam(p, "signalName", "");
            string condition = GetParam(p, "condition", "");
            string triggerTag = GetParam(p, "triggerTag", "");
            bool endEpisode = GetParam(p, "endEpisode", "false").ToLowerInvariant() == "true";

            if (string.IsNullOrEmpty(goName)) return Fail("Parameter 'gameObject' is required.");
            if (string.IsNullOrEmpty(signalName)) return Fail("Parameter 'signalName' is required.");
            if (string.IsNullOrEmpty(condition)) return Fail("Parameter 'condition' is required.");

            float rewardValue = 0f;
            if (p.TryGetValue("value", out string valStr))
                float.TryParse(valStr, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out rewardValue);

            GameObject go = GameObject.Find(goName);
            if (go == null)
                return Fail($"GameObject '{goName}' not found in the scene.");

            // Generate a reward signal script
            string sanitizedName = signalName.Replace(" ", "").Replace("-", "_");
            string className = $"RewardSignal_{sanitizedName}";
            string scriptContent = GenerateRewardScript(className, signalName, rewardValue, condition, triggerTag, endEpisode);

            string scriptsFolder = "Assets/Scripts/MLAgents";
            if (!Directory.Exists(scriptsFolder))
                Directory.CreateDirectory(scriptsFolder);

            string scriptPath = $"{scriptsFolder}/{className}.cs";
            File.WriteAllText(scriptPath, scriptContent);
            AssetDatabase.ImportAsset(scriptPath);

            var sb = new StringBuilder();
            sb.Append("{\"gameObject\":\"").Append(Escape(goName)).Append("\"");
            sb.Append(",\"signalName\":\"").Append(Escape(signalName)).Append("\"");
            sb.Append(",\"value\":").Append(rewardValue.ToString(System.Globalization.CultureInfo.InvariantCulture));
            sb.Append(",\"condition\":\"").Append(Escape(condition)).Append("\"");
            sb.Append(",\"endEpisode\":").Append(endEpisode ? "true" : "false");
            sb.Append(",\"scriptPath\":\"").Append(Escape(scriptPath)).Append("\"");
            sb.Append(",\"className\":\"").Append(Escape(className)).Append("\"");
            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = $"Created reward signal script '{className}' at '{scriptPath}'. Attach it to '{goName}' after compilation.",
                data = sb.ToString()
            };
        }

        private static ToolResult StartTraining(Dictionary<string, string> p)
        {
            string configPath = GetParam(p, "configPath", "");
            if (string.IsNullOrEmpty(configPath))
                return Fail("Parameter 'configPath' is required.");

            string runId = GetParam(p, "runId", DateTime.Now.ToString("yyyyMMdd_HHmmss"));
            int basePort = 5004;
            if (p.TryGetValue("basePort", out string bpStr)) int.TryParse(bpStr, out basePort);

            bool resume = GetParam(p, "resume", "false").ToLowerInvariant() == "true";
            bool force = GetParam(p, "force", "false").ToLowerInvariant() == "true";

            string maxStepsArg = "";
            if (p.TryGetValue("maxSteps", out string msStr) && !string.IsNullOrEmpty(msStr))
                maxStepsArg = $" --max-steps={msStr}";

            if (_trainingProcess != null && !_trainingProcess.HasExited)
                return Fail($"Training is already in progress (run-id: '{_activeRunId}'). Stop it first.");

            if (!File.Exists(configPath))
                return Fail($"Configuration file not found: '{configPath}'.");

            string args = $"\"{configPath}\" --run-id=\"{runId}\" --base-port={basePort}";
            if (resume) args += " --resume";
            if (force) args += " --force";
            args += maxStepsArg;

            try
            {
                _trainingProcess = new Process();
                _trainingProcess.StartInfo = new ProcessStartInfo
                {
                    FileName = "mlagents-learn",
                    Arguments = args,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
                _trainingProcess.Start();
                _activeRunId = runId;
                _trainingStartTime = DateTime.Now;

                return new ToolResult
                {
                    success = true,
                    message = $"Training started with run-id '{runId}'. Config: {configPath}, base port: {basePort}.",
                    data = $"{{\"runId\":\"{Escape(runId)}\",\"configPath\":\"{Escape(configPath)}\",\"basePort\":{basePort},\"pid\":{_trainingProcess.Id}}}"
                };
            }
            catch (Exception ex)
            {
                return Fail($"Failed to start training: {ex.Message}. Ensure mlagents-learn is installed (pip install mlagents).");
            }
        }

        private static ToolResult StopTraining(Dictionary<string, string> p)
        {
            if (_trainingProcess == null || _trainingProcess.HasExited)
            {
                _trainingProcess = null;
                string prevRunId = _activeRunId ?? "none";
                _activeRunId = null;
                return new ToolResult
                {
                    success = true,
                    message = $"No active training process to stop. Last run-id: '{prevRunId}'.",
                    data = $"{{\"wasRunning\":false,\"lastRunId\":\"{Escape(prevRunId)}\"}}"
                };
            }

            string stoppedRunId = _activeRunId ?? "unknown";
            try
            {
                _trainingProcess.Kill();
                _trainingProcess.WaitForExit(5000);
            }
            catch (Exception ex)
            {
                return Fail($"Failed to stop training process: {ex.Message}");
            }

            _trainingProcess = null;
            _activeRunId = null;

            return new ToolResult
            {
                success = true,
                message = $"Training process stopped. Run-id: '{stoppedRunId}'.",
                data = $"{{\"wasRunning\":true,\"stoppedRunId\":\"{Escape(stoppedRunId)}\"}}"
            };
        }

        private static ToolResult LoadTrainedModel(Dictionary<string, string> p)
        {
            string goName = GetParam(p, "gameObject", "");
            string modelPath = GetParam(p, "modelPath", "");

            if (string.IsNullOrEmpty(goName)) return Fail("Parameter 'gameObject' is required.");
            if (string.IsNullOrEmpty(modelPath)) return Fail("Parameter 'modelPath' is required.");

            GameObject go = GameObject.Find(goName);
            if (go == null)
                return Fail($"GameObject '{goName}' not found in the scene.");

            // Ensure path starts with Assets/ for AssetDatabase
            if (!modelPath.StartsWith("Assets/") && !modelPath.StartsWith("Assets\\"))
            {
                if (File.Exists(modelPath))
                {
                    // Absolute path - try to make it relative
                    string dataPath = Application.dataPath;
                    if (modelPath.StartsWith(dataPath))
                    {
                        modelPath = "Assets" + modelPath.Substring(dataPath.Length);
                    }
                    else
                    {
                        // Copy to Assets
                        string destDir = "Assets/Models/MLAgents";
                        if (!Directory.Exists(destDir))
                            Directory.CreateDirectory(destDir);
                        string destPath = $"{destDir}/{Path.GetFileName(modelPath)}";
                        File.Copy(modelPath, destPath, true);
                        AssetDatabase.ImportAsset(destPath);
                        modelPath = destPath;
                    }
                }
                else
                {
                    return Fail($"Model file not found: '{modelPath}'.");
                }
            }

            // Load the model as NNModel asset
            var modelAsset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(modelPath);
            if (modelAsset == null)
            {
                AssetDatabase.ImportAsset(modelPath);
                modelAsset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(modelPath);
            }
            if (modelAsset == null)
                return Fail($"Could not load model asset at '{modelPath}'. Ensure it is a valid .onnx file.");

            // Assign to BehaviorParameters
            Type bpType = FindType("Unity.MLAgents.Policies.BehaviorParameters");
            if (bpType == null)
                return Fail("ML-Agents package is not installed. Run setup_ml_agents first.");

            var bp = go.GetComponent(bpType);
            if (bp == null)
                return Fail($"No BehaviorParameters on '{goName}'. Run add_ml_agent first.");

            Undo.RecordObject(bp, "Load Trained Model");

            var modelProperty = bpType.GetProperty("Model",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (modelProperty != null)
            {
                modelProperty.SetValue(bp, modelAsset);
            }
            else
            {
                var modelField = bpType.GetField("Model",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (modelField != null)
                    modelField.SetValue(bp, modelAsset);
            }

            // Set behavior type to inference
            var behaviorTypeProperty = bpType.GetProperty("BehaviorType",
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (behaviorTypeProperty != null)
            {
                Type behaviorTypeEnum = FindType("Unity.MLAgents.Policies.BehaviorType");
                if (behaviorTypeEnum != null)
                {
                    var inferenceValue = Enum.Parse(behaviorTypeEnum, "InferenceOnly");
                    behaviorTypeProperty.SetValue(bp, inferenceValue);
                }
            }

            EditorUtility.SetDirty(bp);

            string behaviorNameValue = "";
            if (p.TryGetValue("behaviorName", out string bn))
            {
                var nameField = bpType.GetField("BehaviorName",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
                if (nameField != null)
                {
                    nameField.SetValue(bp, bn);
                    behaviorNameValue = bn;
                }
            }

            return new ToolResult
            {
                success = true,
                message = $"Loaded model '{Path.GetFileName(modelPath)}' onto '{goName}'. Set to inference mode.",
                data = $"{{\"gameObject\":\"{Escape(goName)}\",\"modelPath\":\"{Escape(modelPath)}\",\"modelName\":\"{Escape(modelAsset.name)}\",\"behaviorName\":\"{Escape(behaviorNameValue)}\"}}"
            };
        }

        private static ToolResult GetTrainingStatus(Dictionary<string, string> p)
        {
            bool isRunning = _trainingProcess != null && !_trainingProcess.HasExited;
            string runId = _activeRunId ?? "";

            var sb = new StringBuilder();
            sb.Append("{\"isRunning\":").Append(isRunning ? "true" : "false");
            sb.Append(",\"runId\":\"").Append(Escape(runId)).Append("\"");

            if (isRunning)
            {
                double elapsedSeconds = (DateTime.Now - _trainingStartTime).TotalSeconds;
                sb.Append(",\"elapsedSeconds\":").Append(
                    elapsedSeconds.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.Append(",\"pid\":").Append(_trainingProcess.Id);
            }

            // Check for results directory
            string resultsDir = $"results/{runId}";
            if (!string.IsNullOrEmpty(runId) && Directory.Exists(resultsDir))
            {
                sb.Append(",\"resultsDirectory\":\"").Append(Escape(resultsDir)).Append("\"");

                // Look for model files
                string[] onnxFiles = Directory.GetFiles(resultsDir, "*.onnx", SearchOption.AllDirectories);
                sb.Append(",\"modelFiles\":[");
                for (int i = 0; i < onnxFiles.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append("\"").Append(Escape(onnxFiles[i])).Append("\"");
                }
                sb.Append("]");
            }

            sb.Append("}");

            string statusMsg = isRunning
                ? $"Training is running. Run-id: '{runId}'."
                : string.IsNullOrEmpty(runId)
                    ? "No training is currently running."
                    : $"Training is not running. Last run-id: '{runId}'.";

            return new ToolResult
            {
                success = true,
                message = statusMsg,
                data = sb.ToString()
            };
        }

        // ---- Helpers ----

        private static string GenerateRewardScript(string className, string signalName,
            float value, string condition, string triggerTag, bool endEpisode)
        {
            string valueStr = value.ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
            string endEpisodeCode = endEpisode ? "\n            EndEpisode();" : "";

            var sb = new StringBuilder();
            sb.AppendLine("using UnityEngine;");
            sb.AppendLine("using Unity.MLAgents;");
            sb.AppendLine();
            sb.AppendLine($"/// <summary>");
            sb.AppendLine($"/// Reward signal: {signalName}");
            sb.AppendLine($"/// Value: {valueStr}, Condition: {condition}");
            sb.AppendLine($"/// Generated by OpenForge ML-Agents Tools.");
            sb.AppendLine($"/// </summary>");
            sb.AppendLine($"public class {className} : MonoBehaviour");
            sb.AppendLine("{");
            sb.AppendLine("    private Agent _agent;");
            sb.AppendLine();
            sb.AppendLine("    private void Awake()");
            sb.AppendLine("    {");
            sb.AppendLine("        _agent = GetComponent<Agent>();");
            sb.AppendLine("    }");

            if (condition == "on_trigger_enter")
            {
                sb.AppendLine();
                sb.AppendLine("    private void OnTriggerEnter(Collider other)");
                sb.AppendLine("    {");
                if (!string.IsNullOrEmpty(triggerTag))
                {
                    sb.AppendLine($"        if (!other.CompareTag(\"{triggerTag}\")) return;");
                }
                sb.AppendLine($"        if (_agent != null)");
                sb.AppendLine("        {");
                sb.AppendLine($"            _agent.AddReward({valueStr}f);{endEpisodeCode}");
                sb.AppendLine("        }");
                sb.AppendLine("    }");
            }
            else if (condition == "on_collision_enter")
            {
                sb.AppendLine();
                sb.AppendLine("    private void OnCollisionEnter(Collision collision)");
                sb.AppendLine("    {");
                if (!string.IsNullOrEmpty(triggerTag))
                {
                    sb.AppendLine($"        if (!collision.collider.CompareTag(\"{triggerTag}\")) return;");
                }
                sb.AppendLine($"        if (_agent != null)");
                sb.AppendLine("        {");
                sb.AppendLine($"            _agent.AddReward({valueStr}f);{endEpisodeCode}");
                sb.AppendLine("        }");
                sb.AppendLine("    }");
            }
            else if (condition == "per_step")
            {
                sb.AppendLine();
                sb.AppendLine("    private void FixedUpdate()");
                sb.AppendLine("    {");
                sb.AppendLine($"        if (_agent != null)");
                sb.AppendLine("        {");
                sb.AppendLine($"            _agent.AddReward({valueStr}f);");
                sb.AppendLine("        }");
                sb.AppendLine("    }");
            }
            else if (condition == "custom")
            {
                sb.AppendLine();
                sb.AppendLine($"    /// <summary>");
                sb.AppendLine($"    /// Call this method to apply the reward signal.");
                sb.AppendLine($"    /// </summary>");
                sb.AppendLine($"    public void ApplyReward()");
                sb.AppendLine("    {");
                sb.AppendLine($"        if (_agent != null)");
                sb.AppendLine("        {");
                sb.AppendLine($"            _agent.AddReward({valueStr}f);{endEpisodeCode}");
                sb.AppendLine("        }");
                sb.AppendLine("    }");
            }

            sb.AppendLine("}");
            return sb.ToString();
        }

        private static Type FindType(string fullName)
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type t = assembly.GetType(fullName);
                if (t != null) return t;
            }
            return null;
        }

        private static void SetFieldOrProperty(object obj, string name, object value)
        {
            if (obj == null) return;
            Type type = obj.GetType();

            var prop = type.GetProperty(name,
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (prop != null && prop.CanWrite)
            {
                prop.SetValue(obj, value);
                return;
            }

            var field = type.GetField(name,
                System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(obj, value);
            }
        }

        private static int[] ParseIntArray(string csv)
        {
            if (string.IsNullOrEmpty(csv)) return new int[0];
            string[] parts = csv.Split(',');
            var result = new List<int>();
            foreach (string part in parts)
            {
                if (int.TryParse(part.Trim(), out int val))
                    result.Add(val);
            }
            return result.ToArray();
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static string Escape(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }
    }
}

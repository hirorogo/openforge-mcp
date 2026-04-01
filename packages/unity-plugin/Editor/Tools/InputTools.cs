using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using UnityEngine.EventSystems;

namespace OpenForge.Editor.Tools
{
    public static class InputTools
    {
        public static void Register()
        {
            ToolExecutor.Register("setup_input_system", SetupInputSystem);
            ToolExecutor.Register("create_input_action", CreateInputAction);
            ToolExecutor.Register("add_touch_input", AddTouchInput);
            ToolExecutor.Register("add_drag_drop", AddDragDrop);
            ToolExecutor.Register("create_interaction_zone", CreateInteractionZone);
            ToolExecutor.Register("add_raycast_interaction", AddRaycastInteraction);
            ToolExecutor.Register("setup_player_input", SetupPlayerInput);
            ToolExecutor.Register("create_input_binding", CreateInputBinding);
            ToolExecutor.Register("add_event_trigger", AddEventTrigger);
            ToolExecutor.Register("get_input_config", GetInputConfig);
        }

        private static ToolResult SetupInputSystem(Dictionary<string, string> p)
        {
            string scriptName = "InputSystemSetup";
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, scriptName + ".cs");

            string script = @"using UnityEngine;

/// <summary>
/// Central input system manager. Reads Unity Input axes and dispatches
/// movement / look / action events each frame. Attach to a persistent
/// GameObject (e.g. ""InputManager"").
/// </summary>
public class InputSystemSetup : MonoBehaviour
{
    public static InputSystemSetup Instance { get; private set; }

    public Vector2 MoveInput { get; private set; }
    public Vector2 LookInput { get; private set; }
    public bool JumpPressed { get; private set; }
    public bool FirePressed { get; private set; }
    public bool InteractPressed { get; private set; }

    public event System.Action OnJump;
    public event System.Action OnFire;
    public event System.Action OnInteract;

    [Header(""Sensitivity"")]
    public float lookSensitivity = 2f;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Update()
    {
        MoveInput = new Vector2(Input.GetAxis(""Horizontal""), Input.GetAxis(""Vertical""));
        LookInput = new Vector2(Input.GetAxis(""Mouse X""), Input.GetAxis(""Mouse Y"")) * lookSensitivity;

        JumpPressed = Input.GetButtonDown(""Jump"");
        FirePressed = Input.GetButtonDown(""Fire1"");
        InteractPressed = Input.GetKeyDown(KeyCode.E);

        if (JumpPressed) OnJump?.Invoke();
        if (FirePressed) OnFire?.Invoke();
        if (InteractPressed) OnInteract?.Invoke();
    }
}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            GameObject go = new GameObject("InputManager");
            Undo.RegisterCreatedObjectUndo(go, "Setup Input System");

            return new ToolResult
            {
                success = true,
                message = $"Created InputSystemSetup script at {path} and InputManager GameObject",
                data = $"{{\"script\":\"{EscapeJson(path)}\",\"gameObject\":\"InputManager\"}}"
            };
        }

        private static ToolResult CreateInputAction(Dictionary<string, string> p)
        {
            string actionName = GetRequiredParam(p, "name");
            string actionType = GetParam(p, "type", "button");
            string key = GetParam(p, "key", "");
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string className = SanitizeClassName(actionName + "Action");
            string path = Path.Combine(folder, className + ".cs");

            string keyCheck;
            if (!string.IsNullOrEmpty(key))
            {
                keyCheck = $"Input.GetKeyDown(KeyCode.{key})";
            }
            else
            {
                keyCheck = $"Input.GetButtonDown(\"{actionName}\")";
            }

            string valueRead;
            switch (actionType.ToLower())
            {
                case "axis":
                    valueRead = $"Value = Input.GetAxis(\"{actionName}\");";
                    break;
                case "vector2":
                    valueRead = $"Vector2Value = new Vector2(Input.GetAxis(\"{actionName}X\"), Input.GetAxis(\"{actionName}Y\"));";
                    break;
                default:
                    valueRead = $"IsPressed = {keyCheck};";
                    break;
            }

            string script = $@"using UnityEngine;

/// <summary>
/// Input action for '{actionName}'. Reads input each frame and exposes
/// state via public properties plus a C# event.
/// </summary>
public class {className} : MonoBehaviour
{{
    public bool IsPressed {{ get; private set; }}
    public float Value {{ get; private set; }}
    public Vector2 Vector2Value {{ get; private set; }}

    public event System.Action OnTriggered;

    private bool _wasPressedLastFrame;

    private void Update()
    {{
        bool prev = IsPressed;
        {valueRead}

        if (IsPressed && !_wasPressedLastFrame)
        {{
            OnTriggered?.Invoke();
        }}
        _wasPressedLastFrame = IsPressed;
    }}
}}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created input action '{actionName}' at {path}",
                data = $"{{\"action\":\"{EscapeJson(actionName)}\",\"type\":\"{EscapeJson(actionType)}\",\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult AddTouchInput(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, "TouchInputHandler.cs");

            string script = @"using UnityEngine;

/// <summary>
/// Handles single-finger tap, double-tap, swipe, and pinch-to-zoom gestures.
/// Fires C# events that other scripts can subscribe to.
/// </summary>
public class TouchInputHandler : MonoBehaviour
{
    public float swipeThreshold = 50f;
    public float doubleTapTime = 0.3f;
    public float pinchSpeed = 0.02f;

    public event System.Action<Vector2> OnTap;
    public event System.Action<Vector2> OnDoubleTap;
    public event System.Action<Vector2> OnSwipe;
    public event System.Action<float> OnPinch;
    public event System.Action<Vector2, Vector2> OnDrag;

    private float _lastTapTime;
    private Vector2 _touchStart;
    private bool _isDragging;

    private void Update()
    {
        HandleMouseFallback();

        if (Input.touchCount == 1)
        {
            Touch t = Input.GetTouch(0);
            switch (t.phase)
            {
                case TouchPhase.Began:
                    _touchStart = t.position;
                    _isDragging = false;
                    break;

                case TouchPhase.Moved:
                    _isDragging = true;
                    OnDrag?.Invoke(_touchStart, t.position);
                    break;

                case TouchPhase.Ended:
                    Vector2 delta = t.position - _touchStart;
                    if (delta.magnitude > swipeThreshold)
                    {
                        OnSwipe?.Invoke(delta.normalized);
                    }
                    else if (!_isDragging)
                    {
                        float now = Time.unscaledTime;
                        if (now - _lastTapTime < doubleTapTime)
                        {
                            OnDoubleTap?.Invoke(t.position);
                        }
                        else
                        {
                            OnTap?.Invoke(t.position);
                        }
                        _lastTapTime = now;
                    }
                    break;
            }
        }
        else if (Input.touchCount == 2)
        {
            Touch t0 = Input.GetTouch(0);
            Touch t1 = Input.GetTouch(1);

            float prevDist = ((t0.position - t0.deltaPosition) - (t1.position - t1.deltaPosition)).magnitude;
            float curDist = (t0.position - t1.position).magnitude;
            float diff = curDist - prevDist;

            OnPinch?.Invoke(diff * pinchSpeed);
        }
    }

    private void HandleMouseFallback()
    {
#if UNITY_EDITOR || UNITY_STANDALONE
        if (Input.GetMouseButtonDown(0))
        {
            _touchStart = Input.mousePosition;
            _isDragging = false;
        }
        if (Input.GetMouseButton(0) && (((Vector2)Input.mousePosition) - _touchStart).magnitude > 5f)
        {
            _isDragging = true;
            OnDrag?.Invoke(_touchStart, Input.mousePosition);
        }
        if (Input.GetMouseButtonUp(0))
        {
            Vector2 delta = (Vector2)Input.mousePosition - _touchStart;
            if (delta.magnitude > swipeThreshold)
                OnSwipe?.Invoke(delta.normalized);
            else if (!_isDragging)
                OnTap?.Invoke(Input.mousePosition);
        }
#endif
    }
}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            GameObject go;
            if (!string.IsNullOrEmpty(targetName))
            {
                go = FindByNameOrId(targetName);
                if (go == null)
                    return Fail($"GameObject not found: {targetName}");
            }
            else
            {
                go = new GameObject("TouchInputHandler");
                Undo.RegisterCreatedObjectUndo(go, "Add Touch Input");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created TouchInputHandler at {path}",
                data = $"{{\"script\":\"{EscapeJson(path)}\",\"gameObject\":\"{EscapeJson(go.name)}\"}}"
            };
        }

        private static ToolResult AddDragDrop(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, "DragDropHandler.cs");

            string script = @"using UnityEngine;
using UnityEngine.EventSystems;

/// <summary>
/// Attach to any UI element or world-space object to make it draggable.
/// For UI objects: works with RectTransform via drag events.
/// For 3D objects: uses screen-to-world raycasting.
/// Fires events on drag start, during drag, and on drop.
/// </summary>
public class DragDropHandler : MonoBehaviour,
    IBeginDragHandler, IDragHandler, IEndDragHandler, IDropHandler
{
    public bool lockX;
    public bool lockY;
    public bool lockZ;
    public bool snapToGrid;
    public float gridSize = 1f;
    public LayerMask dropLayer = ~0;

    public event System.Action<GameObject> OnDragStarted;
    public event System.Action<GameObject> OnDragEnded;
    public event System.Action<GameObject, GameObject> OnDroppedOn;

    private Vector3 _offset;
    private float _zDepth;
    private Camera _cam;
    private RectTransform _rectTransform;
    private Canvas _canvas;
    private Vector3 _originalPos;

    private void Awake()
    {
        _cam = Camera.main;
        _rectTransform = GetComponent<RectTransform>();
        if (_rectTransform != null)
            _canvas = GetComponentInParent<Canvas>();
    }

    public void OnBeginDrag(PointerEventData eventData)
    {
        _originalPos = transform.position;
        OnDragStarted?.Invoke(gameObject);

        if (_rectTransform != null)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _canvas.transform as RectTransform, eventData.position,
                eventData.pressEventCamera, out Vector2 localPoint);
        }
        else
        {
            _zDepth = _cam.WorldToScreenPoint(transform.position).z;
            Vector3 worldPos = _cam.ScreenToWorldPoint(new Vector3(eventData.position.x, eventData.position.y, _zDepth));
            _offset = transform.position - worldPos;
        }
    }

    public void OnDrag(PointerEventData eventData)
    {
        if (_rectTransform != null)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _canvas.transform as RectTransform, eventData.position,
                eventData.pressEventCamera, out Vector2 localPoint);
            _rectTransform.localPosition = localPoint;
        }
        else
        {
            Vector3 screenPos = new Vector3(eventData.position.x, eventData.position.y, _zDepth);
            Vector3 newPos = _cam.ScreenToWorldPoint(screenPos) + _offset;

            if (lockX) newPos.x = _originalPos.x;
            if (lockY) newPos.y = _originalPos.y;
            if (lockZ) newPos.z = _originalPos.z;

            if (snapToGrid && gridSize > 0)
            {
                newPos.x = Mathf.Round(newPos.x / gridSize) * gridSize;
                newPos.y = Mathf.Round(newPos.y / gridSize) * gridSize;
                newPos.z = Mathf.Round(newPos.z / gridSize) * gridSize;
            }

            transform.position = newPos;
        }
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        OnDragEnded?.Invoke(gameObject);
    }

    public void OnDrop(PointerEventData eventData)
    {
        if (eventData.pointerDrag != null)
        {
            OnDroppedOn?.Invoke(eventData.pointerDrag, gameObject);
        }
    }
}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject go = FindByNameOrId(targetName);
                if (go == null)
                    return Fail($"GameObject not found: {targetName}");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created DragDropHandler at {path}",
                data = $"{{\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult CreateInteractionZone(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "InteractionZone");
            string shape = GetParam(p, "shape", "sphere");
            float radius = float.TryParse(GetParam(p, "radius", "3"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out float r) ? r : 3f;
            string tag = GetParam(p, "tag", "");

            GameObject go = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(go, $"Create Interaction Zone {name}");

            ApplyTransformParams(go.transform, p);

            Collider col;
            if (shape.ToLower() == "box")
            {
                BoxCollider box = Undo.AddComponent<BoxCollider>(go);
                box.isTrigger = true;
                box.size = new Vector3(radius * 2, radius * 2, radius * 2);
                col = box;
            }
            else
            {
                SphereCollider sphere = Undo.AddComponent<SphereCollider>(go);
                sphere.isTrigger = true;
                sphere.radius = radius;
                col = sphere;
            }

            if (!string.IsNullOrEmpty(tag))
            {
                try { go.tag = tag; } catch { }
            }

            // Create the interaction zone script.
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, "InteractionZone.cs");

            if (!File.Exists(path))
            {
                string script = @"using UnityEngine;

/// <summary>
/// Trigger-based interaction area. When a tagged object enters the zone,
/// OnInteractionAvailable fires. The player can then press the interact key
/// to trigger OnInteract. OnInteractionLost fires on exit.
/// </summary>
public class InteractionZone : MonoBehaviour
{
    public string interactKey = ""e"";
    public string requiredTag = ""Player"";
    public string promptMessage = ""Press E to interact"";

    public event System.Action<GameObject> OnInteractionAvailable;
    public event System.Action<GameObject> OnInteract;
    public event System.Action<GameObject> OnInteractionLost;

    private GameObject _currentActor;
    private bool _isInZone;

    private void OnTriggerEnter(Collider other)
    {
        if (!string.IsNullOrEmpty(requiredTag) && !other.CompareTag(requiredTag))
            return;

        _currentActor = other.gameObject;
        _isInZone = true;
        OnInteractionAvailable?.Invoke(_currentActor);
    }

    private void OnTriggerExit(Collider other)
    {
        if (other.gameObject == _currentActor)
        {
            OnInteractionLost?.Invoke(_currentActor);
            _currentActor = null;
            _isInZone = false;
        }
    }

    private void Update()
    {
        if (_isInZone && _currentActor != null && Input.GetKeyDown(interactKey))
        {
            OnInteract?.Invoke(_currentActor);
        }
    }

    private void OnGUI()
    {
        if (_isInZone && !string.IsNullOrEmpty(promptMessage))
        {
            GUIStyle style = new GUIStyle(GUI.skin.box);
            style.fontSize = 18;
            style.alignment = TextAnchor.MiddleCenter;
            float w = 300f, h = 50f;
            Rect rect = new Rect((Screen.width - w) / 2f, Screen.height - h - 60f, w, h);
            GUI.Box(rect, promptMessage, style);
        }
    }
}
";
                File.WriteAllText(path, script);
                AssetDatabase.Refresh();
            }

            return new ToolResult
            {
                success = true,
                message = $"Created interaction zone '{name}' with {shape} trigger (radius={radius})",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"shape\":\"{EscapeJson(shape)}\",\"radius\":{radius}}}"
            };
        }

        private static ToolResult AddRaycastInteraction(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            float maxDistance = float.TryParse(GetParam(p, "distance", "100"), System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out float d) ? d : 100f;
            string layerMask = GetParam(p, "layer_mask", "-1");
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, "RaycastInteraction.cs");

            string script = $@"using UnityEngine;

/// <summary>
/// Raycast-based selection and clicking. Casts a ray from the main camera
/// through the mouse position each frame. Highlights hovered objects and
/// fires events on click.
/// </summary>
public class RaycastInteraction : MonoBehaviour
{{
    public float maxDistance = {maxDistance.ToString(System.Globalization.CultureInfo.InvariantCulture)}f;
    public LayerMask layerMask = {layerMask};
    public Color highlightColor = Color.yellow;
    public KeyCode selectKey = KeyCode.Mouse0;

    public event System.Action<GameObject> OnHoverEnter;
    public event System.Action<GameObject> OnHoverExit;
    public event System.Action<GameObject> OnSelect;

    private GameObject _lastHovered;
    private Color _originalColor;
    private Camera _cam;

    private void Awake()
    {{
        _cam = Camera.main;
    }}

    private void Update()
    {{
        if (_cam == null) _cam = Camera.main;
        if (_cam == null) return;

        Ray ray = _cam.ScreenPointToRay(Input.mousePosition);
        RaycastHit hit;
        GameObject hovered = null;

        if (Physics.Raycast(ray, out hit, maxDistance, layerMask))
        {{
            hovered = hit.collider.gameObject;
        }}

        if (hovered != _lastHovered)
        {{
            if (_lastHovered != null)
            {{
                RestoreColor(_lastHovered);
                OnHoverExit?.Invoke(_lastHovered);
            }}
            if (hovered != null)
            {{
                ApplyHighlight(hovered);
                OnHoverEnter?.Invoke(hovered);
            }}
            _lastHovered = hovered;
        }}

        if (hovered != null && Input.GetKeyDown(selectKey))
        {{
            OnSelect?.Invoke(hovered);
        }}
    }}

    private void ApplyHighlight(GameObject go)
    {{
        Renderer r = go.GetComponent<Renderer>();
        if (r != null && r.material != null)
        {{
            _originalColor = r.material.color;
            r.material.color = highlightColor;
        }}
    }}

    private void RestoreColor(GameObject go)
    {{
        Renderer r = go.GetComponent<Renderer>();
        if (r != null && r.material != null)
        {{
            r.material.color = _originalColor;
        }}
    }}
}}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            GameObject holder;
            if (!string.IsNullOrEmpty(targetName))
            {
                holder = FindByNameOrId(targetName);
                if (holder == null)
                    return Fail($"GameObject not found: {targetName}");
            }
            else
            {
                holder = new GameObject("RaycastInteraction");
                Undo.RegisterCreatedObjectUndo(holder, "Add Raycast Interaction");
            }

            return new ToolResult
            {
                success = true,
                message = $"Created RaycastInteraction at {path}",
                data = $"{{\"script\":\"{EscapeJson(path)}\",\"maxDistance\":{maxDistance}}}"
            };
        }

        private static ToolResult SetupPlayerInput(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string path = Path.Combine(folder, "PlayerInputController.cs");

            string script = @"using UnityEngine;

/// <summary>
/// Player input controller that reads axes and buttons each frame and
/// provides clean properties for movement, look, and common actions.
/// Attach to the player GameObject.
/// </summary>
public class PlayerInputController : MonoBehaviour
{
    [Header(""Movement"")]
    public string horizontalAxis = ""Horizontal"";
    public string verticalAxis = ""Vertical"";

    [Header(""Look"")]
    public string mouseXAxis = ""Mouse X"";
    public string mouseYAxis = ""Mouse Y"";
    public float mouseSensitivity = 2f;

    [Header(""Actions"")]
    public KeyCode jumpKey = KeyCode.Space;
    public KeyCode sprintKey = KeyCode.LeftShift;
    public KeyCode crouchKey = KeyCode.LeftControl;
    public KeyCode interactKey = KeyCode.E;
    public KeyCode reloadKey = KeyCode.R;

    public Vector2 MoveInput { get; private set; }
    public Vector2 LookInput { get; private set; }
    public bool Jump { get; private set; }
    public bool Sprint { get; private set; }
    public bool Crouch { get; private set; }
    public bool Interact { get; private set; }
    public bool Reload { get; private set; }
    public bool Fire { get; private set; }
    public bool Aim { get; private set; }

    private void Update()
    {
        MoveInput = new Vector2(
            Input.GetAxis(horizontalAxis),
            Input.GetAxis(verticalAxis)
        );

        LookInput = new Vector2(
            Input.GetAxis(mouseXAxis) * mouseSensitivity,
            Input.GetAxis(mouseYAxis) * mouseSensitivity
        );

        Jump = Input.GetKeyDown(jumpKey);
        Sprint = Input.GetKey(sprintKey);
        Crouch = Input.GetKeyDown(crouchKey);
        Interact = Input.GetKeyDown(interactKey);
        Reload = Input.GetKeyDown(reloadKey);
        Fire = Input.GetMouseButton(0);
        Aim = Input.GetMouseButton(1);
    }
}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created PlayerInputController at {path} for '{go.name}'",
                data = $"{{\"script\":\"{EscapeJson(path)}\",\"target\":\"{EscapeJson(go.name)}\"}}"
            };
        }

        private static ToolResult CreateInputBinding(Dictionary<string, string> p)
        {
            string action = GetRequiredParam(p, "action");
            string key = GetRequiredParam(p, "key");
            string callbackMethod = GetParam(p, "callback", "On" + SanitizeClassName(action));
            string folder = GetParam(p, "folder", "Assets/Scripts/Input");

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string className = SanitizeClassName("Binding_" + action);
            string path = Path.Combine(folder, className + ".cs");

            string script = $@"using UnityEngine;

/// <summary>
/// Binds the '{action}' action to {key}. When pressed, calls {callbackMethod}
/// on this component and optionally sends the message to all siblings.
/// </summary>
public class {className} : MonoBehaviour
{{
    public KeyCode boundKey = KeyCode.{key};
    public bool sendMessageToSiblings = true;

    public event System.Action OnPressed;
    public event System.Action OnReleased;
    public event System.Action OnHeld;

    private void Update()
    {{
        if (Input.GetKeyDown(boundKey))
        {{
            OnPressed?.Invoke();
            {callbackMethod}();
            if (sendMessageToSiblings)
                SendMessage(""{callbackMethod}"", SendMessageOptions.DontRequireReceiver);
        }}
        if (Input.GetKey(boundKey))
        {{
            OnHeld?.Invoke();
        }}
        if (Input.GetKeyUp(boundKey))
        {{
            OnReleased?.Invoke();
        }}
    }}

    private void {callbackMethod}()
    {{
        // Override in subclass or subscribe to OnPressed event.
    }}
}}
";

            File.WriteAllText(path, script);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created input binding '{action}' -> {key} at {path}",
                data = $"{{\"action\":\"{EscapeJson(action)}\",\"key\":\"{EscapeJson(key)}\",\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult AddEventTrigger(Dictionary<string, string> p)
        {
            string targetName = GetRequiredParam(p, "target");
            string eventType = GetParam(p, "event_type", "PointerClick");

            GameObject go = FindByNameOrId(targetName);
            if (go == null)
                return Fail($"GameObject not found: {targetName}");

            EventTrigger trigger = go.GetComponent<EventTrigger>();
            if (trigger == null)
            {
                trigger = Undo.AddComponent<EventTrigger>(go);
            }
            else
            {
                Undo.RecordObject(trigger, "Add Event Trigger Entry");
            }

            if (!Enum.TryParse(eventType, true, out EventTriggerType triggerType))
            {
                return Fail($"Unknown event type: {eventType}. Valid: PointerEnter, PointerExit, PointerDown, PointerUp, PointerClick, Drag, Drop, Scroll, UpdateSelected, Select, Deselect, Move, InitializePotentialDrag, BeginDrag, EndDrag, Submit, Cancel");
            }

            EventTrigger.Entry entry = new EventTrigger.Entry();
            entry.eventID = triggerType;
            trigger.triggers.Add(entry);

            return new ToolResult
            {
                success = true,
                message = $"Added EventTrigger ({eventType}) to '{go.name}'",
                data = $"{{\"gameObject\":\"{EscapeJson(go.name)}\",\"eventType\":\"{EscapeJson(eventType)}\",\"totalTriggers\":{trigger.triggers.Count}}}"
            };
        }

        private static ToolResult GetInputConfig(Dictionary<string, string> p)
        {
            StringBuilder sb = new StringBuilder("{");

            // List defined axes from InputManager.
            sb.Append("\"inputAxes\":[");
            SerializedObject inputManager = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/InputManager.asset")[0]);
            SerializedProperty axes = inputManager.FindProperty("m_Axes");
            bool first = true;
            if (axes != null && axes.isArray)
            {
                for (int i = 0; i < axes.arraySize; i++)
                {
                    SerializedProperty axis = axes.GetArrayElementAtIndex(i);
                    SerializedProperty axisName = axis.FindPropertyRelative("m_Name");
                    if (axisName != null)
                    {
                        if (!first) sb.Append(",");
                        first = false;
                        sb.Append($"\"{EscapeJson(axisName.stringValue)}\"");
                    }
                }
            }
            inputManager.Dispose();
            sb.Append("],");

            // Check for EventSystem in scene.
            EventSystem es = UnityEngine.Object.FindObjectOfType<EventSystem>();
            sb.Append($"\"hasEventSystem\":{(es != null ? "true" : "false")},");

            // Check for common input scripts.
            sb.Append("\"inputScripts\":[");
            string[] guids = AssetDatabase.FindAssets("t:MonoScript", new[] { "Assets/Scripts/Input" });
            first = true;
            foreach (string guid in guids)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                if (!first) sb.Append(",");
                first = false;
                sb.Append($"\"{EscapeJson(Path.GetFileNameWithoutExtension(assetPath))}\"");
            }
            sb.Append("]");

            sb.Append("}");

            return new ToolResult
            {
                success = true,
                message = "Retrieved input configuration",
                data = sb.ToString()
            };
        }

        // --- Helpers ---

        private static GameObject FindByNameOrId(string nameOrId)
        {
            if (int.TryParse(nameOrId, out int id))
            {
                UnityEngine.Object obj = EditorUtility.InstanceIDToObject(id);
                if (obj is GameObject go) return go;
            }

            GameObject found = GameObject.Find(nameOrId);
            if (found != null) return found;

            GameObject[] allObjects = Resources.FindObjectsOfTypeAll<GameObject>();
            foreach (GameObject go in allObjects)
            {
                if (go.hideFlags != HideFlags.None) continue;
                if (go.scene.isLoaded && go.name == nameOrId)
                    return go;
            }
            return null;
        }

        private static void ApplyTransformParams(Transform t, Dictionary<string, string> p)
        {
            if (TryParseVector3(p, "position", out Vector3 pos))
                t.localPosition = pos;
            if (TryParseVector3(p, "rotation", out Vector3 rot))
                t.localEulerAngles = rot;
            if (TryParseVector3(p, "scale", out Vector3 scale))
                t.localScale = scale;
        }

        private static bool TryParseVector3(Dictionary<string, string> p, string key, out Vector3 v)
        {
            v = Vector3.zero;
            if (p.TryGetValue(key, out string raw) && !string.IsNullOrEmpty(raw))
            {
                raw = raw.Trim().Trim('[', ']');
                string[] parts = raw.Split(',');
                if (parts.Length >= 3
                    && float.TryParse(parts[0].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float x)
                    && float.TryParse(parts[1].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float y)
                    && float.TryParse(parts[2].Trim(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float z))
                {
                    v = new Vector3(x, y, z);
                    return true;
                }
            }
            return false;
        }

        private static string GetParam(Dictionary<string, string> p, string key, string defaultValue = "")
        {
            return p.TryGetValue(key, out string value) ? value : defaultValue;
        }

        private static string GetRequiredParam(Dictionary<string, string> p, string key)
        {
            if (!p.TryGetValue(key, out string value) || string.IsNullOrEmpty(value))
                throw new ArgumentException($"Missing required parameter: {key}");
            return value;
        }

        private static ToolResult Fail(string message)
        {
            return new ToolResult { success = false, message = message };
        }

        private static string EscapeJson(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
        }

        private static string SanitizeClassName(string name)
        {
            StringBuilder sb = new StringBuilder();
            bool nextUpper = true;
            foreach (char c in name)
            {
                if (char.IsLetterOrDigit(c))
                {
                    sb.Append(nextUpper ? char.ToUpper(c) : c);
                    nextUpper = false;
                }
                else
                {
                    nextUpper = true;
                }
            }
            return sb.ToString();
        }
    }
}

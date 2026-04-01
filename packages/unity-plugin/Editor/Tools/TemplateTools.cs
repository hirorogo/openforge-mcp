using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace OpenForge.Editor.Tools
{
    public static class TemplateTools
    {
        public static void Register()
        {
            ToolExecutor.Register("create_fps_controller", CreateFPSController);
            ToolExecutor.Register("create_tps_controller", CreateTPSController);
            ToolExecutor.Register("create_platformer_controller", CreatePlatformerController);
            ToolExecutor.Register("create_inventory_system", CreateInventorySystem);
            ToolExecutor.Register("create_health_system", CreateHealthSystem);
            ToolExecutor.Register("create_dialogue_system", CreateDialogueSystem);
            ToolExecutor.Register("create_state_machine", CreateStateMachine);
            ToolExecutor.Register("create_spawn_system", CreateSpawnSystem);
            ToolExecutor.Register("create_waypoint_system", CreateWaypointSystem);
            ToolExecutor.Register("create_score_system", CreateScoreSystem);
        }

        private static ToolResult CreateFPSController(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "FPSPlayer");
            float speed = ParseFloat(p, "speed", 6f);
            float jumpForce = ParseFloat(p, "jump_force", 8f);
            float mouseSensitivity = ParseFloat(p, "mouse_sensitivity", 2f);
            string folder = GetParam(p, "folder", "Assets/Scripts/Player");

            EnsureFolder(folder);

            // Write FPS controller script.
            string scriptPath = Path.Combine(folder, "FPSController.cs");
            string script = $@"using UnityEngine;

/// <summary>
/// First-person character controller with mouse-look, WASD movement,
/// jumping, sprinting, and head-bob. Requires a CharacterController component.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class FPSController : MonoBehaviour
{{
    [Header(""Movement"")]
    public float walkSpeed = {F(speed)};
    public float sprintMultiplier = 1.6f;
    public float jumpForce = {F(jumpForce)};
    public float gravity = 20f;

    [Header(""Mouse Look"")]
    public float mouseSensitivity = {F(mouseSensitivity)};
    public float maxLookAngle = 85f;
    public bool invertY = false;

    [Header(""Head Bob"")]
    public bool enableHeadBob = true;
    public float bobFrequency = 8f;
    public float bobAmplitude = 0.05f;

    private CharacterController _cc;
    private Camera _camera;
    private float _xRotation;
    private Vector3 _velocity;
    private float _bobTimer;
    private float _defaultCamY;

    private void Awake()
    {{
        _cc = GetComponent<CharacterController>();
        _camera = GetComponentInChildren<Camera>();
        if (_camera == null)
        {{
            GameObject camObj = new GameObject(""FPSCamera"");
            camObj.transform.SetParent(transform);
            camObj.transform.localPosition = new Vector3(0f, 0.8f, 0f);
            _camera = camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
        }}
        _defaultCamY = _camera.transform.localPosition.y;
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }}

    private void Update()
    {{
        HandleMouseLook();
        HandleMovement();
        if (enableHeadBob) HandleHeadBob();
    }}

    private void HandleMouseLook()
    {{
        float mouseX = Input.GetAxis(""Mouse X"") * mouseSensitivity;
        float mouseY = Input.GetAxis(""Mouse Y"") * mouseSensitivity;

        if (invertY) mouseY = -mouseY;

        _xRotation -= mouseY;
        _xRotation = Mathf.Clamp(_xRotation, -maxLookAngle, maxLookAngle);

        _camera.transform.localRotation = Quaternion.Euler(_xRotation, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);
    }}

    private void HandleMovement()
    {{
        bool isGrounded = _cc.isGrounded;

        if (isGrounded && _velocity.y < 0f)
            _velocity.y = -2f;

        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");

        Vector3 move = transform.right * h + transform.forward * v;
        float currentSpeed = walkSpeed;
        if (Input.GetKey(KeyCode.LeftShift))
            currentSpeed *= sprintMultiplier;

        _cc.Move(move * currentSpeed * Time.deltaTime);

        if (isGrounded && Input.GetButtonDown(""Jump""))
            _velocity.y = jumpForce;

        _velocity.y -= gravity * Time.deltaTime;
        _cc.Move(_velocity * Time.deltaTime);
    }}

    private void HandleHeadBob()
    {{
        if (!_cc.isGrounded) return;
        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");
        bool isMoving = Mathf.Abs(h) > 0.1f || Mathf.Abs(v) > 0.1f;

        if (isMoving)
        {{
            _bobTimer += Time.deltaTime * bobFrequency;
            float bobOffset = Mathf.Sin(_bobTimer) * bobAmplitude;
            Vector3 camPos = _camera.transform.localPosition;
            camPos.y = _defaultCamY + bobOffset;
            _camera.transform.localPosition = camPos;
        }}
        else
        {{
            _bobTimer = 0f;
            Vector3 camPos = _camera.transform.localPosition;
            camPos.y = Mathf.Lerp(camPos.y, _defaultCamY, Time.deltaTime * 8f);
            _camera.transform.localPosition = camPos;
        }}
    }}
}}
";
            File.WriteAllText(scriptPath, script);

            // Create player hierarchy.
            GameObject player = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(player, $"Create FPS Controller {name}");
            ApplyTransformParams(player.transform, p);

            CharacterController cc = Undo.AddComponent<CharacterController>(player);
            cc.height = 1.8f;
            cc.center = new Vector3(0, 0.9f, 0);
            cc.radius = 0.3f;

            GameObject camObj = new GameObject("FPSCamera");
            Undo.RegisterCreatedObjectUndo(camObj, "Create FPS Camera");
            camObj.transform.SetParent(player.transform);
            camObj.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            Camera cam = camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();

            // Remove default Main Camera if it exists.
            Camera mainCam = Camera.main;
            if (mainCam != null && mainCam.gameObject != camObj)
            {
                mainCam.gameObject.SetActive(false);
            }

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created FPS controller '{name}' with camera, movement, and mouse look",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"script\":\"{EscapeJson(scriptPath)}\"}}"
            };
        }

        private static ToolResult CreateTPSController(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "TPSPlayer");
            float speed = ParseFloat(p, "speed", 5f);
            float cameraDistance = ParseFloat(p, "camera_distance", 5f);
            string folder = GetParam(p, "folder", "Assets/Scripts/Player");

            EnsureFolder(folder);

            string scriptPath = Path.Combine(folder, "TPSController.cs");
            string script = $@"using UnityEngine;

/// <summary>
/// Third-person character controller with orbital camera, WASD movement,
/// jumping, and smooth character rotation toward movement direction.
/// Requires a CharacterController component.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class TPSController : MonoBehaviour
{{
    [Header(""Movement"")]
    public float walkSpeed = {F(speed)};
    public float sprintMultiplier = 1.5f;
    public float jumpForce = 8f;
    public float gravity = 20f;
    public float rotationSmoothTime = 0.1f;

    [Header(""Camera"")]
    public float cameraDistance = {F(cameraDistance)};
    public float cameraHeight = 2f;
    public float cameraSensitivity = 3f;
    public float minPitch = -30f;
    public float maxPitch = 60f;

    private CharacterController _cc;
    private Transform _cameraTransform;
    private Transform _cameraPivot;
    private float _yaw;
    private float _pitch = 15f;
    private Vector3 _velocity;
    private float _rotationVelocity;

    private void Awake()
    {{
        _cc = GetComponent<CharacterController>();

        _cameraPivot = new GameObject(""CameraPivot"").transform;
        _cameraPivot.SetParent(transform);
        _cameraPivot.localPosition = new Vector3(0f, cameraHeight, 0f);

        _cameraTransform = GetComponentInChildren<Camera>()?.transform;
        if (_cameraTransform == null)
        {{
            GameObject camObj = new GameObject(""TPSCamera"");
            Camera cam = camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
            _cameraTransform = camObj.transform;
        }}
        _cameraTransform.SetParent(_cameraPivot);
        _cameraTransform.localPosition = new Vector3(0f, 0f, -cameraDistance);
        _cameraTransform.LookAt(_cameraPivot);

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }}

    private void LateUpdate()
    {{
        HandleCameraOrbit();
    }}

    private void Update()
    {{
        HandleMovement();
    }}

    private void HandleCameraOrbit()
    {{
        _yaw += Input.GetAxis(""Mouse X"") * cameraSensitivity;
        _pitch -= Input.GetAxis(""Mouse Y"") * cameraSensitivity;
        _pitch = Mathf.Clamp(_pitch, minPitch, maxPitch);

        _cameraPivot.rotation = Quaternion.Euler(_pitch, _yaw, 0f);

        // Handle camera collision.
        Vector3 desiredPos = _cameraPivot.position - _cameraPivot.forward * cameraDistance;
        RaycastHit hit;
        if (Physics.Linecast(_cameraPivot.position, desiredPos, out hit))
        {{
            _cameraTransform.position = hit.point + hit.normal * 0.2f;
        }}
        else
        {{
            _cameraTransform.localPosition = new Vector3(0f, 0f, -cameraDistance);
        }}
        _cameraTransform.LookAt(_cameraPivot);
    }}

    private void HandleMovement()
    {{
        bool isGrounded = _cc.isGrounded;
        if (isGrounded && _velocity.y < 0f)
            _velocity.y = -2f;

        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");
        Vector3 inputDir = new Vector3(h, 0f, v).normalized;

        if (inputDir.magnitude >= 0.1f)
        {{
            float targetAngle = Mathf.Atan2(inputDir.x, inputDir.z) * Mathf.Rad2Deg + _yaw;
            float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref _rotationVelocity, rotationSmoothTime);
            transform.rotation = Quaternion.Euler(0f, angle, 0f);

            Vector3 moveDir = Quaternion.Euler(0f, targetAngle, 0f) * Vector3.forward;
            float currentSpeed = walkSpeed;
            if (Input.GetKey(KeyCode.LeftShift))
                currentSpeed *= sprintMultiplier;

            _cc.Move(moveDir.normalized * currentSpeed * Time.deltaTime);
        }}

        if (isGrounded && Input.GetButtonDown(""Jump""))
            _velocity.y = jumpForce;

        _velocity.y -= gravity * Time.deltaTime;
        _cc.Move(_velocity * Time.deltaTime);
    }}
}}
";
            File.WriteAllText(scriptPath, script);

            // Create player hierarchy.
            GameObject player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = name;
            Undo.RegisterCreatedObjectUndo(player, $"Create TPS Controller {name}");
            ApplyTransformParams(player.transform, p);

            CharacterController cc = Undo.AddComponent<CharacterController>(player);
            cc.height = 2f;
            cc.center = new Vector3(0, 1f, 0);
            cc.radius = 0.35f;

            GameObject pivotObj = new GameObject("CameraPivot");
            Undo.RegisterCreatedObjectUndo(pivotObj, "Create Camera Pivot");
            pivotObj.transform.SetParent(player.transform);
            pivotObj.transform.localPosition = new Vector3(0f, 2f, 0f);

            GameObject camObj = new GameObject("TPSCamera");
            Undo.RegisterCreatedObjectUndo(camObj, "Create TPS Camera");
            camObj.transform.SetParent(pivotObj.transform);
            camObj.transform.localPosition = new Vector3(0f, 0f, -cameraDistance);
            camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created third-person controller '{name}' with orbital camera",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"script\":\"{EscapeJson(scriptPath)}\"}}"
            };
        }

        private static ToolResult CreatePlatformerController(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "PlatformerPlayer");
            string mode = GetParam(p, "mode", "2d");
            float speed = ParseFloat(p, "speed", 7f);
            float jumpForce = ParseFloat(p, "jump_force", 12f);
            string folder = GetParam(p, "folder", "Assets/Scripts/Player");

            EnsureFolder(folder);

            bool is2D = mode.ToLower().Contains("2");

            if (is2D)
            {
                string scriptPath = Path.Combine(folder, "PlatformerController2D.cs");
                string script = $@"using UnityEngine;

/// <summary>
/// 2D platformer controller with ground detection, variable jump height,
/// coyote time, jump buffering, and wall slide. Requires Rigidbody2D
/// and a 2D collider.
/// </summary>
[RequireComponent(typeof(Rigidbody2D))]
public class PlatformerController2D : MonoBehaviour
{{
    [Header(""Movement"")]
    public float moveSpeed = {F(speed)};
    public float acceleration = 50f;
    public float deceleration = 40f;

    [Header(""Jumping"")]
    public float jumpForce = {F(jumpForce)};
    public int maxJumps = 2;
    public float coyoteTime = 0.12f;
    public float jumpBufferTime = 0.15f;
    public float variableJumpMultiplier = 0.5f;

    [Header(""Wall Slide"")]
    public bool enableWallSlide = true;
    public float wallSlideSpeed = 2f;
    public float wallJumpForce = 10f;

    [Header(""Ground Check"")]
    public LayerMask groundLayer = ~0;
    public float groundCheckDistance = 0.1f;

    private Rigidbody2D _rb;
    private Collider2D _col;
    private bool _isGrounded;
    private bool _isTouchingWall;
    private int _wallDirection;
    private int _jumpsRemaining;
    private float _coyoteTimer;
    private float _jumpBufferTimer;
    private bool _isFacingRight = true;

    private void Awake()
    {{
        _rb = GetComponent<Rigidbody2D>();
        _col = GetComponent<Collider2D>();
        _rb.freezeRotation = true;
    }}

    private void Update()
    {{
        CheckGround();
        CheckWall();
        HandleInput();
        HandleFlip();
    }}

    private void FixedUpdate()
    {{
        HandleMovement();
    }}

    private void CheckGround()
    {{
        Bounds bounds = _col.bounds;
        Vector2 origin = new Vector2(bounds.center.x, bounds.min.y);
        RaycastHit2D hit = Physics2D.Raycast(origin, Vector2.down, groundCheckDistance, groundLayer);
        bool wasGrounded = _isGrounded;
        _isGrounded = hit.collider != null;

        if (_isGrounded)
        {{
            _jumpsRemaining = maxJumps;
            _coyoteTimer = coyoteTime;
        }}
        else if (wasGrounded)
        {{
            _coyoteTimer = coyoteTime;
        }}
        else
        {{
            _coyoteTimer -= Time.deltaTime;
        }}
    }}

    private void CheckWall()
    {{
        if (!enableWallSlide) return;
        Bounds bounds = _col.bounds;
        float dir = _isFacingRight ? 1f : -1f;
        RaycastHit2D hit = Physics2D.Raycast(bounds.center, Vector2.right * dir, bounds.extents.x + 0.1f, groundLayer);
        _isTouchingWall = hit.collider != null && !_isGrounded;
        _wallDirection = _isFacingRight ? 1 : -1;
    }}

    private void HandleInput()
    {{
        if (Input.GetButtonDown(""Jump""))
            _jumpBufferTimer = jumpBufferTime;
        else
            _jumpBufferTimer -= Time.deltaTime;

        bool canJump = (_coyoteTimer > 0f || _jumpsRemaining > 0);

        if (_jumpBufferTimer > 0f && canJump)
        {{
            _jumpBufferTimer = 0f;
            _coyoteTimer = 0f;
            _jumpsRemaining--;
            _rb.linearVelocity = new Vector2(_rb.linearVelocity.x, jumpForce);
        }}
        else if (_jumpBufferTimer > 0f && _isTouchingWall && enableWallSlide)
        {{
            _jumpBufferTimer = 0f;
            _rb.linearVelocity = new Vector2(-_wallDirection * wallJumpForce * 0.7f, wallJumpForce);
            _isFacingRight = _wallDirection < 0;
        }}

        if (Input.GetButtonUp(""Jump"") && _rb.linearVelocity.y > 0f)
        {{
            _rb.linearVelocity = new Vector2(_rb.linearVelocity.x, _rb.linearVelocity.y * variableJumpMultiplier);
        }}
    }}

    private void HandleMovement()
    {{
        float h = Input.GetAxisRaw(""Horizontal"");
        float targetSpeed = h * moveSpeed;
        float accel = Mathf.Abs(h) > 0.01f ? acceleration : deceleration;
        float newSpeed = Mathf.MoveTowards(_rb.linearVelocity.x, targetSpeed, accel * Time.fixedDeltaTime);

        if (_isTouchingWall && _rb.linearVelocity.y < 0f && enableWallSlide)
        {{
            _rb.linearVelocity = new Vector2(newSpeed, Mathf.Max(_rb.linearVelocity.y, -wallSlideSpeed));
        }}
        else
        {{
            _rb.linearVelocity = new Vector2(newSpeed, _rb.linearVelocity.y);
        }}
    }}

    private void HandleFlip()
    {{
        float h = Input.GetAxisRaw(""Horizontal"");
        if ((h > 0f && !_isFacingRight) || (h < 0f && _isFacingRight))
        {{
            _isFacingRight = !_isFacingRight;
            Vector3 s = transform.localScale;
            s.x *= -1f;
            transform.localScale = s;
        }}
    }}
}}
";
                File.WriteAllText(scriptPath, script);

                GameObject player = new GameObject(name);
                Undo.RegisterCreatedObjectUndo(player, $"Create 2D Platformer {name}");
                ApplyTransformParams(player.transform, p);

                SpriteRenderer sr = Undo.AddComponent<SpriteRenderer>(player);
                sr.color = Color.green;

                Rigidbody2D rb = Undo.AddComponent<Rigidbody2D>(player);
                rb.freezeRotation = true;

                BoxCollider2D col = Undo.AddComponent<BoxCollider2D>(player);
                col.size = new Vector2(1f, 1f);

                AssetDatabase.Refresh();

                return new ToolResult
                {
                    success = true,
                    message = $"Created 2D platformer controller '{name}' with double-jump and wall slide",
                    data = $"{{\"name\":\"{EscapeJson(name)}\",\"mode\":\"2d\",\"script\":\"{EscapeJson(scriptPath)}\"}}"
                };
            }
            else
            {
                string scriptPath = Path.Combine(folder, "PlatformerController3D.cs");
                string script = $@"using UnityEngine;

/// <summary>
/// 3D platformer controller with ground detection, variable jump,
/// double-jump, and camera-relative movement. Requires a CharacterController.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class PlatformerController3D : MonoBehaviour
{{
    [Header(""Movement"")]
    public float moveSpeed = {F(speed)};
    public float rotationSpeed = 720f;
    public float gravity = 25f;

    [Header(""Jumping"")]
    public float jumpForce = {F(jumpForce)};
    public int maxJumps = 2;
    public float coyoteTime = 0.15f;

    private CharacterController _cc;
    private Camera _cam;
    private Vector3 _velocity;
    private int _jumpsRemaining;
    private float _coyoteTimer;

    private void Awake()
    {{
        _cc = GetComponent<CharacterController>();
        _cam = Camera.main;
    }}

    private void Update()
    {{
        bool isGrounded = _cc.isGrounded;
        if (isGrounded)
        {{
            _jumpsRemaining = maxJumps;
            _coyoteTimer = coyoteTime;
            if (_velocity.y < 0f) _velocity.y = -2f;
        }}
        else
        {{
            _coyoteTimer -= Time.deltaTime;
        }}

        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");
        Vector3 camForward = _cam.transform.forward;
        Vector3 camRight = _cam.transform.right;
        camForward.y = 0f; camForward.Normalize();
        camRight.y = 0f; camRight.Normalize();

        Vector3 moveDir = camForward * v + camRight * h;
        if (moveDir.magnitude > 1f) moveDir.Normalize();

        _cc.Move(moveDir * moveSpeed * Time.deltaTime);

        if (moveDir.magnitude > 0.1f)
        {{
            Quaternion targetRot = Quaternion.LookRotation(moveDir);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, targetRot, rotationSpeed * Time.deltaTime);
        }}

        bool canJump = (_coyoteTimer > 0f || _jumpsRemaining > 0);
        if (Input.GetButtonDown(""Jump"") && canJump)
        {{
            _velocity.y = jumpForce;
            _jumpsRemaining--;
            _coyoteTimer = 0f;
        }}

        if (Input.GetButtonUp(""Jump"") && _velocity.y > 0f)
            _velocity.y *= 0.5f;

        _velocity.y -= gravity * Time.deltaTime;
        _cc.Move(_velocity * Time.deltaTime);
    }}
}}
";
                File.WriteAllText(scriptPath, script);

                GameObject player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                player.name = name;
                Undo.RegisterCreatedObjectUndo(player, $"Create 3D Platformer {name}");
                ApplyTransformParams(player.transform, p);

                // Remove the default capsule collider; CharacterController has its own.
                CapsuleCollider capsule = player.GetComponent<CapsuleCollider>();
                if (capsule != null) UnityEngine.Object.DestroyImmediate(capsule);

                CharacterController cc = Undo.AddComponent<CharacterController>(player);
                cc.height = 2f;
                cc.center = new Vector3(0, 1f, 0);

                AssetDatabase.Refresh();

                return new ToolResult
                {
                    success = true,
                    message = $"Created 3D platformer controller '{name}' with double-jump",
                    data = $"{{\"name\":\"{EscapeJson(name)}\",\"mode\":\"3d\",\"script\":\"{EscapeJson(scriptPath)}\"}}"
                };
            }
        }

        private static ToolResult CreateInventorySystem(Dictionary<string, string> p)
        {
            int slots = int.TryParse(GetParam(p, "slots", "20"), out int s) ? s : 20;
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string itemPath = Path.Combine(folder, "InventoryItem.cs");
            string itemScript = @"using UnityEngine;

/// <summary>
/// ScriptableObject-based inventory item definition. Create instances
/// via Assets > Create > Inventory > Item.
/// </summary>
[CreateAssetMenu(fileName = ""NewItem"", menuName = ""Inventory/Item"")]
public class InventoryItem : ScriptableObject
{
    public string itemName;
    [TextArea] public string description;
    public Sprite icon;
    public int maxStack = 99;
    public bool isConsumable;
    public float weight;

    [Header(""Stats"")]
    public int healAmount;
    public int damageBonus;
    public int armorBonus;
}
";

            string inventoryPath = Path.Combine(folder, "InventorySystem.cs");
            string inventoryScript = $@"using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Runtime inventory that stores items in numbered slots. Supports add,
/// remove, stack, swap, and use operations. Fires C# events on every change
/// so UI can react.
/// </summary>
public class InventorySystem : MonoBehaviour
{{
    public static InventorySystem Instance {{ get; private set; }}

    [Serializable]
    public class Slot
    {{
        public InventoryItem item;
        public int count;
    }}

    public int maxSlots = {slots};
    public List<Slot> slots = new List<Slot>();

    public event Action<int> OnSlotChanged;
    public event Action<InventoryItem, int> OnItemAdded;
    public event Action<InventoryItem, int> OnItemRemoved;
    public event Action<InventoryItem> OnItemUsed;

    private void Awake()
    {{
        if (Instance != null && Instance != this) {{ Destroy(gameObject); return; }}
        Instance = this;
        DontDestroyOnLoad(gameObject);

        slots.Clear();
        for (int i = 0; i < maxSlots; i++)
            slots.Add(new Slot());
    }}

    public bool AddItem(InventoryItem item, int amount = 1)
    {{
        // Try stacking first.
        for (int i = 0; i < slots.Count; i++)
        {{
            if (slots[i].item == item && slots[i].count < item.maxStack)
            {{
                int canAdd = Mathf.Min(amount, item.maxStack - slots[i].count);
                slots[i].count += canAdd;
                amount -= canAdd;
                OnSlotChanged?.Invoke(i);
                OnItemAdded?.Invoke(item, canAdd);
                if (amount <= 0) return true;
            }}
        }}

        // Then use empty slots.
        for (int i = 0; i < slots.Count; i++)
        {{
            if (slots[i].item == null)
            {{
                int canAdd = Mathf.Min(amount, item.maxStack);
                slots[i].item = item;
                slots[i].count = canAdd;
                amount -= canAdd;
                OnSlotChanged?.Invoke(i);
                OnItemAdded?.Invoke(item, canAdd);
                if (amount <= 0) return true;
            }}
        }}

        return amount <= 0;
    }}

    public bool RemoveItem(InventoryItem item, int amount = 1)
    {{
        for (int i = slots.Count - 1; i >= 0; i--)
        {{
            if (slots[i].item == item)
            {{
                int canRemove = Mathf.Min(amount, slots[i].count);
                slots[i].count -= canRemove;
                amount -= canRemove;
                if (slots[i].count <= 0)
                {{
                    slots[i].item = null;
                    slots[i].count = 0;
                }}
                OnSlotChanged?.Invoke(i);
                OnItemRemoved?.Invoke(item, canRemove);
                if (amount <= 0) return true;
            }}
        }}
        return amount <= 0;
    }}

    public void UseItem(int slotIndex)
    {{
        if (slotIndex < 0 || slotIndex >= slots.Count) return;
        Slot slot = slots[slotIndex];
        if (slot.item == null) return;

        OnItemUsed?.Invoke(slot.item);

        if (slot.item.isConsumable)
        {{
            slot.count--;
            if (slot.count <= 0)
            {{
                slot.item = null;
                slot.count = 0;
            }}
            OnSlotChanged?.Invoke(slotIndex);
        }}
    }}

    public void SwapSlots(int a, int b)
    {{
        if (a < 0 || a >= slots.Count || b < 0 || b >= slots.Count) return;
        Slot temp = slots[a];
        slots[a] = slots[b];
        slots[b] = temp;
        OnSlotChanged?.Invoke(a);
        OnSlotChanged?.Invoke(b);
    }}

    public int GetItemCount(InventoryItem item)
    {{
        int total = 0;
        foreach (Slot slot in slots)
            if (slot.item == item) total += slot.count;
        return total;
    }}

    public bool HasItem(InventoryItem item, int amount = 1)
    {{
        return GetItemCount(item) >= amount;
    }}
}}
";

            File.WriteAllText(itemPath, itemScript);
            File.WriteAllText(inventoryPath, inventoryScript);

            GameObject go = new GameObject("InventorySystem");
            Undo.RegisterCreatedObjectUndo(go, "Create Inventory System");

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created inventory system with {slots} slots",
                data = $"{{\"slots\":{slots},\"scripts\":[\"{EscapeJson(itemPath)}\",\"{EscapeJson(inventoryPath)}\"]}}"
            };
        }

        private static ToolResult CreateHealthSystem(Dictionary<string, string> p)
        {
            string targetName = GetParam(p, "target", "");
            float maxHealth = ParseFloat(p, "max_health", 100f);
            bool hasShield = GetParam(p, "shield", "false") == "true";
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string path = Path.Combine(folder, "HealthSystem.cs");
            string script = $@"using UnityEngine;

/// <summary>
/// Health/damage system with optional shield, invincibility frames,
/// damage-over-time, and healing. Fires events for UI updates, hit
/// reactions, and death.
/// </summary>
public class HealthSystem : MonoBehaviour
{{
    [Header(""Health"")]
    public float maxHealth = {F(maxHealth)};
    public float currentHealth;

    [Header(""Shield"")]
    public bool hasShield = {(hasShield ? "true" : "false")};
    public float maxShield = 50f;
    public float currentShield;
    public float shieldRegenRate = 5f;
    public float shieldRegenDelay = 3f;

    [Header(""Invincibility"")]
    public float invincibilityDuration = 0.2f;

    public bool IsDead {{ get; private set; }}
    public float HealthPercent => maxHealth > 0f ? currentHealth / maxHealth : 0f;
    public float ShieldPercent => maxShield > 0f ? currentShield / maxShield : 0f;

    public event System.Action<float, float> OnHealthChanged;
    public event System.Action<float, float> OnShieldChanged;
    public event System.Action<float> OnDamaged;
    public event System.Action<float> OnHealed;
    public event System.Action OnDeath;
    public event System.Action OnRevive;

    private float _invTimer;
    private float _shieldRegenTimer;

    private void Awake()
    {{
        currentHealth = maxHealth;
        if (hasShield) currentShield = maxShield;
    }}

    private void Update()
    {{
        if (_invTimer > 0f) _invTimer -= Time.deltaTime;

        if (hasShield && currentShield < maxShield && !IsDead)
        {{
            _shieldRegenTimer -= Time.deltaTime;
            if (_shieldRegenTimer <= 0f)
            {{
                float prev = currentShield;
                currentShield = Mathf.Min(currentShield + shieldRegenRate * Time.deltaTime, maxShield);
                if (currentShield != prev) OnShieldChanged?.Invoke(currentShield, maxShield);
            }}
        }}
    }}

    public void TakeDamage(float amount)
    {{
        if (IsDead || amount <= 0f || _invTimer > 0f) return;

        float remaining = amount;

        if (hasShield && currentShield > 0f)
        {{
            float absorbed = Mathf.Min(remaining, currentShield);
            currentShield -= absorbed;
            remaining -= absorbed;
            _shieldRegenTimer = shieldRegenDelay;
            OnShieldChanged?.Invoke(currentShield, maxShield);
        }}

        if (remaining > 0f)
        {{
            currentHealth -= remaining;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }}

        _invTimer = invincibilityDuration;
        OnDamaged?.Invoke(amount);

        if (currentHealth <= 0f)
        {{
            currentHealth = 0f;
            IsDead = true;
            OnDeath?.Invoke();
        }}
    }}

    public void Heal(float amount)
    {{
        if (IsDead || amount <= 0f) return;
        float prev = currentHealth;
        currentHealth = Mathf.Min(currentHealth + amount, maxHealth);
        float healed = currentHealth - prev;
        if (healed > 0f)
        {{
            OnHealed?.Invoke(healed);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }}
    }}

    public void Revive(float healthPercent = 1f)
    {{
        if (!IsDead) return;
        IsDead = false;
        currentHealth = maxHealth * Mathf.Clamp01(healthPercent);
        if (hasShield) currentShield = maxShield;
        OnHealthChanged?.Invoke(currentHealth, maxHealth);
        if (hasShield) OnShieldChanged?.Invoke(currentShield, maxShield);
        OnRevive?.Invoke();
    }}

    public void SetMaxHealth(float newMax, bool heal = false)
    {{
        maxHealth = newMax;
        if (heal || currentHealth > maxHealth)
            currentHealth = maxHealth;
        OnHealthChanged?.Invoke(currentHealth, maxHealth);
    }}
}}
";
            File.WriteAllText(path, script);

            if (!string.IsNullOrEmpty(targetName))
            {
                GameObject go = FindByNameOrId(targetName);
                if (go == null) return Fail($"GameObject not found: {targetName}");
            }
            else
            {
                GameObject go = new GameObject("HealthSystem");
                Undo.RegisterCreatedObjectUndo(go, "Create Health System");
            }

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created health system (max={maxHealth}, shield={hasShield})",
                data = $"{{\"maxHealth\":{F(maxHealth)},\"hasShield\":{(hasShield ? "true" : "false")},\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult CreateDialogueSystem(Dictionary<string, string> p)
        {
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string nodePath = Path.Combine(folder, "DialogueNode.cs");
            string nodeScript = @"using UnityEngine;

/// <summary>
/// ScriptableObject for a single dialogue node. Contains speaker name,
/// dialogue text, and an array of choices that link to other nodes.
/// Create via Assets > Create > Dialogue > Node.
/// </summary>
[CreateAssetMenu(fileName = ""NewDialogue"", menuName = ""Dialogue/Node"")]
public class DialogueNode : ScriptableObject
{
    public string speakerName;
    [TextArea(3, 8)] public string text;
    public Sprite speakerPortrait;

    [System.Serializable]
    public class Choice
    {
        public string text;
        public DialogueNode nextNode;
        public string conditionFlag;
    }

    public Choice[] choices;
    public DialogueNode nextNode;
    public bool isEndNode;

    [Header(""Events"")]
    public string onEnterEvent;
    public string onExitEvent;
}
";

            string systemPath = Path.Combine(folder, "DialogueSystem.cs");
            string systemScript = @"using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Dialogue manager that drives conversations from DialogueNode assets.
/// Manages a simple UI with speaker name, portrait, text, and choice
/// buttons. Fires events for external systems to react to.
/// </summary>
public class DialogueSystem : MonoBehaviour
{
    public static DialogueSystem Instance { get; private set; }

    [Header(""UI References (assign in Inspector)"")]
    public Canvas dialogueCanvas;
    public UnityEngine.UI.Text speakerNameText;
    public UnityEngine.UI.Text dialogueText;
    public UnityEngine.UI.Image portraitImage;
    public Transform choiceContainer;
    public GameObject choiceButtonPrefab;

    public bool IsDialogueActive { get; private set; }

    public event System.Action<DialogueNode> OnNodeEntered;
    public event System.Action<string> OnDialogueEvent;
    public event System.Action OnDialogueStarted;
    public event System.Action OnDialogueEnded;

    private DialogueNode _currentNode;
    private HashSet<string> _flags = new HashSet<string>();

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        if (dialogueCanvas != null)
            dialogueCanvas.gameObject.SetActive(false);
    }

    public void SetFlag(string flag) { _flags.Add(flag); }
    public void ClearFlag(string flag) { _flags.Remove(flag); }
    public bool HasFlag(string flag) { return _flags.Contains(flag); }

    public void StartDialogue(DialogueNode startNode)
    {
        if (startNode == null) return;
        IsDialogueActive = true;
        OnDialogueStarted?.Invoke();
        if (dialogueCanvas != null) dialogueCanvas.gameObject.SetActive(true);
        ShowNode(startNode);
    }

    public void ShowNode(DialogueNode node)
    {
        if (node == null) { EndDialogue(); return; }
        _currentNode = node;
        OnNodeEntered?.Invoke(node);

        if (!string.IsNullOrEmpty(node.onEnterEvent))
            OnDialogueEvent?.Invoke(node.onEnterEvent);

        if (speakerNameText != null) speakerNameText.text = node.speakerName;
        if (dialogueText != null) dialogueText.text = node.text;
        if (portraitImage != null)
        {
            portraitImage.sprite = node.speakerPortrait;
            portraitImage.gameObject.SetActive(node.speakerPortrait != null);
        }

        ClearChoices();

        if (node.choices != null && node.choices.Length > 0)
        {
            foreach (DialogueNode.Choice choice in node.choices)
            {
                if (!string.IsNullOrEmpty(choice.conditionFlag) && !HasFlag(choice.conditionFlag))
                    continue;
                CreateChoiceButton(choice);
            }
        }
    }

    public void AdvanceDialogue()
    {
        if (_currentNode == null) return;

        if (!string.IsNullOrEmpty(_currentNode.onExitEvent))
            OnDialogueEvent?.Invoke(_currentNode.onExitEvent);

        if (_currentNode.isEndNode)
        {
            EndDialogue();
            return;
        }

        if (_currentNode.choices != null && _currentNode.choices.Length > 0)
            return; // Wait for choice selection.

        ShowNode(_currentNode.nextNode);
    }

    public void SelectChoice(DialogueNode.Choice choice)
    {
        if (choice.nextNode != null)
            ShowNode(choice.nextNode);
        else
            EndDialogue();
    }

    public void EndDialogue()
    {
        if (_currentNode != null && !string.IsNullOrEmpty(_currentNode.onExitEvent))
            OnDialogueEvent?.Invoke(_currentNode.onExitEvent);

        IsDialogueActive = false;
        _currentNode = null;
        ClearChoices();
        if (dialogueCanvas != null) dialogueCanvas.gameObject.SetActive(false);
        OnDialogueEnded?.Invoke();
    }

    private void Update()
    {
        if (IsDialogueActive && Input.GetKeyDown(KeyCode.Space))
        {
            AdvanceDialogue();
        }
    }

    private void CreateChoiceButton(DialogueNode.Choice choice)
    {
        if (choiceContainer == null || choiceButtonPrefab == null) return;
        GameObject btnObj = Instantiate(choiceButtonPrefab, choiceContainer);
        UnityEngine.UI.Text txt = btnObj.GetComponentInChildren<UnityEngine.UI.Text>();
        if (txt != null) txt.text = choice.text;
        UnityEngine.UI.Button btn = btnObj.GetComponent<UnityEngine.UI.Button>();
        if (btn != null)
        {
            DialogueNode.Choice captured = choice;
            btn.onClick.AddListener(() => SelectChoice(captured));
        }
    }

    private void ClearChoices()
    {
        if (choiceContainer == null) return;
        for (int i = choiceContainer.childCount - 1; i >= 0; i--)
            Destroy(choiceContainer.GetChild(i).gameObject);
    }
}
";

            File.WriteAllText(nodePath, nodeScript);
            File.WriteAllText(systemPath, systemScript);

            GameObject go = new GameObject("DialogueSystem");
            Undo.RegisterCreatedObjectUndo(go, "Create Dialogue System");

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = "Created dialogue system with DialogueNode ScriptableObject and DialogueSystem manager",
                data = $"{{\"scripts\":[\"{EscapeJson(nodePath)}\",\"{EscapeJson(systemPath)}\"]}}"
            };
        }

        private static ToolResult CreateStateMachine(Dictionary<string, string> p)
        {
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string basePath = Path.Combine(folder, "StateMachine.cs");
            string script = @"using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Generic finite state machine. Each state is a ScriptableObject that
/// implements IState. Supports enter/exit/update callbacks and
/// conditional transitions defined in data.
/// </summary>
public class StateMachine : MonoBehaviour
{
    [Serializable]
    public class Transition
    {
        public string fromState;
        public string toState;
        public string condition;
    }

    public string initialState = ""Idle"";
    public List<Transition> transitions = new List<Transition>();

    public string CurrentStateName { get; private set; }
    public event Action<string, string> OnStateChanged;

    private Dictionary<string, IState> _states = new Dictionary<string, IState>();
    private IState _currentState;
    private Dictionary<string, bool> _conditions = new Dictionary<string, bool>();

    private void Start()
    {
        if (!string.IsNullOrEmpty(initialState))
            ChangeState(initialState);
    }

    private void Update()
    {
        _currentState?.OnUpdate(this);
        EvaluateTransitions();
    }

    private void FixedUpdate()
    {
        _currentState?.OnFixedUpdate(this);
    }

    public void RegisterState(string name, IState state)
    {
        _states[name] = state;
    }

    public void SetCondition(string condition, bool value)
    {
        _conditions[condition] = value;
    }

    public bool GetCondition(string condition)
    {
        return _conditions.TryGetValue(condition, out bool val) && val;
    }

    public void ChangeState(string newStateName)
    {
        if (!_states.ContainsKey(newStateName))
        {
            Debug.LogWarning($""State '{newStateName}' not registered in StateMachine on {gameObject.name}"");
            return;
        }

        string oldName = CurrentStateName;
        _currentState?.OnExit(this);
        CurrentStateName = newStateName;
        _currentState = _states[newStateName];
        _currentState.OnEnter(this);
        OnStateChanged?.Invoke(oldName, newStateName);
    }

    private void EvaluateTransitions()
    {
        foreach (Transition t in transitions)
        {
            if (t.fromState == CurrentStateName && GetCondition(t.condition))
            {
                SetCondition(t.condition, false);
                ChangeState(t.toState);
                return;
            }
        }
    }
}

public interface IState
{
    void OnEnter(StateMachine sm);
    void OnUpdate(StateMachine sm);
    void OnFixedUpdate(StateMachine sm);
    void OnExit(StateMachine sm);
}

/// <summary>
/// Concrete state base class that implements IState with virtual methods.
/// Subclass this to create specific states.
/// </summary>
public abstract class BaseState : IState
{
    public virtual void OnEnter(StateMachine sm) { }
    public virtual void OnUpdate(StateMachine sm) { }
    public virtual void OnFixedUpdate(StateMachine sm) { }
    public virtual void OnExit(StateMachine sm) { }
}

/// <summary>
/// Example idle state that transitions to ""Moving"" when speed exceeds threshold.
/// </summary>
public class IdleState : BaseState
{
    public override void OnUpdate(StateMachine sm)
    {
        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");
        if (Mathf.Abs(h) > 0.1f || Mathf.Abs(v) > 0.1f)
            sm.SetCondition(""StartMoving"", true);
    }
}

/// <summary>
/// Example moving state that transitions back to ""Idle"" when input stops.
/// </summary>
public class MovingState : BaseState
{
    public override void OnUpdate(StateMachine sm)
    {
        float h = Input.GetAxis(""Horizontal"");
        float v = Input.GetAxis(""Vertical"");
        if (Mathf.Abs(h) < 0.1f && Mathf.Abs(v) < 0.1f)
            sm.SetCondition(""StopMoving"", true);
    }
}
";
            File.WriteAllText(basePath, script);
            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = "Created state machine framework with IState interface, BaseState, and example states",
                data = $"{{\"script\":\"{EscapeJson(basePath)}\"}}"
            };
        }

        private static ToolResult CreateSpawnSystem(Dictionary<string, string> p)
        {
            int poolSize = int.TryParse(GetParam(p, "pool_size", "20"), out int ps) ? ps : 20;
            float spawnInterval = ParseFloat(p, "interval", 2f);
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string path = Path.Combine(folder, "SpawnSystem.cs");
            string script = $@"using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Object spawner with built-in pooling. Pre-allocates objects at startup
/// and recycles them instead of instantiating/destroying at runtime.
/// Supports multiple prefabs, spawn points, and wave-based spawning.
/// </summary>
public class SpawnSystem : MonoBehaviour
{{
    public static SpawnSystem Instance {{ get; private set; }}

    [System.Serializable]
    public class SpawnEntry
    {{
        public GameObject prefab;
        public int weight = 1;
    }}

    [Header(""Pool"")]
    public int poolSizePerPrefab = {poolSize};
    public SpawnEntry[] spawnEntries;

    [Header(""Spawning"")]
    public Transform[] spawnPoints;
    public float spawnInterval = {F(spawnInterval)};
    public int maxActiveObjects = 50;
    public bool autoSpawn = true;

    [Header(""Waves"")]
    public bool useWaves;
    public int enemiesPerWave = 10;
    public float waveCooldown = 5f;

    public int CurrentWave {{ get; private set; }}
    public int ActiveCount => _activeObjects.Count;

    public event System.Action<GameObject> OnSpawned;
    public event System.Action<GameObject> OnDespawned;
    public event System.Action<int> OnWaveStarted;
    public event System.Action<int> OnWaveCompleted;

    private Dictionary<GameObject, Queue<GameObject>> _pools = new Dictionary<GameObject, Queue<GameObject>>();
    private List<GameObject> _activeObjects = new List<GameObject>();
    private float _spawnTimer;
    private int _spawnedThisWave;
    private int _totalWeight;

    private void Awake()
    {{
        if (Instance != null && Instance != this) {{ Destroy(gameObject); return; }}
        Instance = this;
        InitializePools();
    }}

    private void InitializePools()
    {{
        _totalWeight = 0;
        if (spawnEntries == null) return;

        foreach (SpawnEntry entry in spawnEntries)
        {{
            if (entry.prefab == null) continue;
            _totalWeight += entry.weight;

            Queue<GameObject> pool = new Queue<GameObject>();
            for (int i = 0; i < poolSizePerPrefab; i++)
            {{
                GameObject obj = Instantiate(entry.prefab, transform);
                obj.SetActive(false);
                pool.Enqueue(obj);
            }}
            _pools[entry.prefab] = pool;
        }}
    }}

    private void Update()
    {{
        if (!autoSpawn) return;

        _spawnTimer -= Time.deltaTime;
        if (_spawnTimer <= 0f)
        {{
            _spawnTimer = spawnInterval;

            if (useWaves)
            {{
                if (_spawnedThisWave < enemiesPerWave)
                {{
                    SpawnRandom();
                    _spawnedThisWave++;
                }}
                else if (_activeObjects.Count == 0)
                {{
                    CurrentWave++;
                    _spawnedThisWave = 0;
                    OnWaveStarted?.Invoke(CurrentWave);
                    _spawnTimer = waveCooldown;
                }}
            }}
            else
            {{
                if (_activeObjects.Count < maxActiveObjects)
                    SpawnRandom();
            }}
        }}

        _activeObjects.RemoveAll(o => o == null || !o.activeInHierarchy);
    }}

    public GameObject SpawnRandom()
    {{
        if (spawnEntries == null || spawnEntries.Length == 0) return null;

        int roll = Random.Range(0, _totalWeight);
        GameObject prefab = spawnEntries[0].prefab;
        int cumulative = 0;
        foreach (SpawnEntry entry in spawnEntries)
        {{
            cumulative += entry.weight;
            if (roll < cumulative) {{ prefab = entry.prefab; break; }}
        }}

        return Spawn(prefab);
    }}

    public GameObject Spawn(GameObject prefab)
    {{
        if (prefab == null || _activeObjects.Count >= maxActiveObjects) return null;

        GameObject obj = GetFromPool(prefab);
        if (obj == null) return null;

        Vector3 pos = Vector3.zero;
        Quaternion rot = Quaternion.identity;
        if (spawnPoints != null && spawnPoints.Length > 0)
        {{
            Transform sp = spawnPoints[Random.Range(0, spawnPoints.Length)];
            pos = sp.position;
            rot = sp.rotation;
        }}

        obj.transform.position = pos;
        obj.transform.rotation = rot;
        obj.SetActive(true);
        _activeObjects.Add(obj);
        OnSpawned?.Invoke(obj);
        return obj;
    }}

    public void Despawn(GameObject obj)
    {{
        if (obj == null) return;
        obj.SetActive(false);
        _activeObjects.Remove(obj);
        OnDespawned?.Invoke(obj);

        foreach (var kvp in _pools)
        {{
            if (obj.name.StartsWith(kvp.Key.name))
            {{
                kvp.Value.Enqueue(obj);
                return;
            }}
        }}
    }}

    private GameObject GetFromPool(GameObject prefab)
    {{
        if (!_pools.ContainsKey(prefab)) return null;
        Queue<GameObject> pool = _pools[prefab];

        if (pool.Count > 0) return pool.Dequeue();

        // Expand pool.
        GameObject obj = Instantiate(prefab, transform);
        obj.SetActive(false);
        return obj;
    }}
}}
";
            File.WriteAllText(path, script);

            GameObject go = new GameObject("SpawnSystem");
            Undo.RegisterCreatedObjectUndo(go, "Create Spawn System");

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created spawn system with object pooling (pool={poolSize}, interval={spawnInterval}s)",
                data = $"{{\"poolSize\":{poolSize},\"interval\":{F(spawnInterval)},\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult CreateWaypointSystem(Dictionary<string, string> p)
        {
            string name = GetParam(p, "name", "WaypointSystem");
            string mode = GetParam(p, "mode", "loop");
            float speed = ParseFloat(p, "speed", 3f);
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string path = Path.Combine(folder, "WaypointSystem.cs");
            string script = $@"using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Waypoint navigation system. An agent follows a sequence of Transform
/// waypoints using configurable patrol modes: loop, ping-pong, or once.
/// Supports speed curves, wait times at each point, and look-at rotation.
/// </summary>
public class WaypointSystem : MonoBehaviour
{{
    public enum PatrolMode {{ Loop, PingPong, Once, Random }}

    [Header(""Waypoints"")]
    public List<Transform> waypoints = new List<Transform>();
    public PatrolMode patrolMode = PatrolMode.{char.ToUpper(mode[0]) + mode.Substring(1)};

    [Header(""Movement"")]
    public float moveSpeed = {F(speed)};
    public float rotationSpeed = 360f;
    public float arrivalDistance = 0.2f;
    public float waitTimeAtWaypoint = 0f;
    public AnimationCurve speedCurve = AnimationCurve.Linear(0f, 1f, 1f, 1f);

    [Header(""Options"")]
    public bool faceMovementDirection = true;
    public bool startOnAwake = true;

    public int CurrentWaypointIndex {{ get; private set; }}
    public bool IsMoving {{ get; private set; }}
    public float Progress {{ get; private set; }}

    public event System.Action<int> OnWaypointReached;
    public event System.Action OnPatrolComplete;

    private int _direction = 1;
    private float _waitTimer;
    private bool _started;

    private void Start()
    {{
        if (startOnAwake && waypoints.Count > 0)
            StartPatrol();
    }}

    public void StartPatrol()
    {{
        if (waypoints.Count == 0) return;
        CurrentWaypointIndex = 0;
        _direction = 1;
        IsMoving = true;
        _started = true;
    }}

    public void StopPatrol()
    {{
        IsMoving = false;
    }}

    public void ResumePatrol()
    {{
        if (_started) IsMoving = true;
    }}

    private void Update()
    {{
        if (!IsMoving || waypoints.Count == 0) return;

        if (_waitTimer > 0f)
        {{
            _waitTimer -= Time.deltaTime;
            return;
        }}

        Transform target = waypoints[CurrentWaypointIndex];
        if (target == null) return;

        Vector3 direction = target.position - transform.position;
        float dist = direction.magnitude;

        float t = waypoints.Count > 1 ? (float)CurrentWaypointIndex / (waypoints.Count - 1) : 0f;
        float currentSpeed = moveSpeed * speedCurve.Evaluate(t);

        transform.position = Vector3.MoveTowards(transform.position, target.position, currentSpeed * Time.deltaTime);

        if (faceMovementDirection && direction.sqrMagnitude > 0.001f)
        {{
            Quaternion targetRot = Quaternion.LookRotation(direction.normalized);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, targetRot, rotationSpeed * Time.deltaTime);
        }}

        if (dist <= arrivalDistance)
        {{
            OnWaypointReached?.Invoke(CurrentWaypointIndex);
            _waitTimer = waitTimeAtWaypoint;
            AdvanceWaypoint();
        }}

        Progress = waypoints.Count > 1 ? (float)CurrentWaypointIndex / (waypoints.Count - 1) : 1f;
    }}

    private void AdvanceWaypoint()
    {{
        switch (patrolMode)
        {{
            case PatrolMode.Loop:
                CurrentWaypointIndex = (CurrentWaypointIndex + 1) % waypoints.Count;
                break;

            case PatrolMode.PingPong:
                CurrentWaypointIndex += _direction;
                if (CurrentWaypointIndex >= waypoints.Count - 1) _direction = -1;
                else if (CurrentWaypointIndex <= 0) _direction = 1;
                break;

            case PatrolMode.Once:
                if (CurrentWaypointIndex < waypoints.Count - 1)
                    CurrentWaypointIndex++;
                else
                {{
                    IsMoving = false;
                    OnPatrolComplete?.Invoke();
                }}
                break;

            case PatrolMode.Random:
                int next = Random.Range(0, waypoints.Count);
                while (next == CurrentWaypointIndex && waypoints.Count > 1)
                    next = Random.Range(0, waypoints.Count);
                CurrentWaypointIndex = next;
                break;
        }}
    }}

    private void OnDrawGizmosSelected()
    {{
        if (waypoints == null || waypoints.Count < 2) return;
        Gizmos.color = Color.cyan;
        for (int i = 0; i < waypoints.Count; i++)
        {{
            if (waypoints[i] == null) continue;
            Gizmos.DrawWireSphere(waypoints[i].position, 0.3f);
            if (i < waypoints.Count - 1 && waypoints[i + 1] != null)
                Gizmos.DrawLine(waypoints[i].position, waypoints[i + 1].position);
        }}
        if (patrolMode == PatrolMode.Loop && waypoints.Count > 2 && waypoints[0] != null && waypoints[waypoints.Count - 1] != null)
            Gizmos.DrawLine(waypoints[waypoints.Count - 1].position, waypoints[0].position);
    }}
}}
";
            File.WriteAllText(path, script);

            // Create waypoint container with sample points.
            GameObject container = new GameObject(name);
            Undo.RegisterCreatedObjectUndo(container, "Create Waypoint System");

            for (int i = 0; i < 4; i++)
            {
                GameObject wp = new GameObject($"Waypoint_{i}");
                Undo.RegisterCreatedObjectUndo(wp, $"Create Waypoint {i}");
                wp.transform.SetParent(container.transform);
                float angle = i * Mathf.PI * 2f / 4f;
                wp.transform.localPosition = new Vector3(Mathf.Cos(angle) * 5f, 0f, Mathf.Sin(angle) * 5f);
            }

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created waypoint system '{name}' with 4 sample waypoints",
                data = $"{{\"name\":\"{EscapeJson(name)}\",\"mode\":\"{EscapeJson(mode)}\",\"script\":\"{EscapeJson(path)}\"}}"
            };
        }

        private static ToolResult CreateScoreSystem(Dictionary<string, string> p)
        {
            int initialScore = int.TryParse(GetParam(p, "initial_score", "0"), out int isc) ? isc : 0;
            bool persistent = GetParam(p, "persistent", "true") != "false";
            string folder = GetParam(p, "folder", "Assets/Scripts/Systems");
            EnsureFolder(folder);

            string path = Path.Combine(folder, "ScoreSystem.cs");
            string script = $@"using UnityEngine;

/// <summary>
/// Score/points tracking singleton. Supports add, subtract, multiply,
/// high-score persistence via PlayerPrefs, combo multipliers, and
/// events for UI updates.
/// </summary>
public class ScoreSystem : MonoBehaviour
{{
    public static ScoreSystem Instance {{ get; private set; }}

    [Header(""Score"")]
    public int currentScore = {initialScore};
    public int highScore;

    [Header(""Combo"")]
    public float comboMultiplier = 1f;
    public float comboDecayTime = 3f;
    public float comboIncrement = 0.5f;
    public float maxCombo = 10f;

    [Header(""Persistence"")]
    public bool persistHighScore = {(persistent ? "true" : "false")};
    public string highScoreKey = ""HighScore"";

    public event System.Action<int> OnScoreChanged;
    public event System.Action<int> OnHighScoreBeaten;
    public event System.Action<float> OnComboChanged;

    private float _comboTimer;

    private void Awake()
    {{
        if (Instance != null && Instance != this) {{ Destroy(gameObject); return; }}
        Instance = this;
        DontDestroyOnLoad(gameObject);

        if (persistHighScore)
            highScore = PlayerPrefs.GetInt(highScoreKey, 0);
    }}

    private void Update()
    {{
        if (comboMultiplier > 1f)
        {{
            _comboTimer -= Time.deltaTime;
            if (_comboTimer <= 0f)
            {{
                comboMultiplier = 1f;
                OnComboChanged?.Invoke(comboMultiplier);
            }}
        }}
    }}

    public void AddScore(int points)
    {{
        int actual = Mathf.RoundToInt(points * comboMultiplier);
        currentScore += actual;
        OnScoreChanged?.Invoke(currentScore);

        comboMultiplier = Mathf.Min(comboMultiplier + comboIncrement, maxCombo);
        _comboTimer = comboDecayTime;
        OnComboChanged?.Invoke(comboMultiplier);

        if (currentScore > highScore)
        {{
            highScore = currentScore;
            if (persistHighScore)
                PlayerPrefs.SetInt(highScoreKey, highScore);
            OnHighScoreBeaten?.Invoke(highScore);
        }}
    }}

    public void SubtractScore(int points)
    {{
        currentScore = Mathf.Max(0, currentScore - points);
        OnScoreChanged?.Invoke(currentScore);
    }}

    public void ResetScore()
    {{
        currentScore = 0;
        comboMultiplier = 1f;
        OnScoreChanged?.Invoke(currentScore);
        OnComboChanged?.Invoke(comboMultiplier);
    }}

    public void ResetHighScore()
    {{
        highScore = 0;
        if (persistHighScore)
            PlayerPrefs.SetInt(highScoreKey, 0);
    }}

    public int GetScore() => currentScore;
    public int GetHighScore() => highScore;
    public float GetCombo() => comboMultiplier;
}}
";
            File.WriteAllText(path, script);

            GameObject go = new GameObject("ScoreSystem");
            Undo.RegisterCreatedObjectUndo(go, "Create Score System");

            AssetDatabase.Refresh();

            return new ToolResult
            {
                success = true,
                message = $"Created score system with combo multiplier and high score persistence",
                data = $"{{\"initialScore\":{initialScore},\"persistent\":{(persistent ? "true" : "false")},\"script\":\"{EscapeJson(path)}\"}}"
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

        private static float ParseFloat(Dictionary<string, string> p, string key, float defaultValue)
        {
            string val = GetParam(p, key, "");
            if (float.TryParse(val, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float result))
                return result;
            return defaultValue;
        }

        private static string F(float v)
        {
            return v.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        private static void EnsureFolder(string folder)
        {
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);
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
    }
}

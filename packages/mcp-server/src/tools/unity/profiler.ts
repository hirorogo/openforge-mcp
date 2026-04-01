import { ToolDefinition } from "../../registry.js";

const profilerTools: ToolDefinition[] = [
  {
    name: "start_profiling",
    description: "Begin Unity Profiler recording to capture performance data",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        deep_profile: {
          type: "boolean",
          description: "Enable deep profiling for detailed call stacks (slower)",
        },
        log_file: {
          type: "string",
          description: "File path for binary profiler log output",
        },
      },
      required: [],
    },
  },
  {
    name: "stop_profiling",
    description: "Stop Unity Profiler recording",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_cpu_usage",
    description: "Get CPU frame time breakdown including FPS and memory overview",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_memory_stats",
    description:
      "Get detailed memory allocation info (total, Mono heap, GFX driver, system)",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_rendering_stats",
    description:
      "Get rendering statistics: draw calls, triangles, batches, set-pass calls",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_gc_stats",
    description:
      "Get garbage collection info: Mono heap usage, GC generation counts, total managed memory",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "save_profiler_data",
    description: "Save captured profiler data to a file for later analysis",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File path to save profiler data (default: Assets/ProfilerData/profiler_capture.raw)",
        },
      },
      required: [],
    },
  },
  {
    name: "analyze_performance",
    description:
      "Run a comprehensive performance analysis covering memory, FPS, GC, scene complexity, rendering, and quality settings with recommendations",
    category: "profiler",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default profilerTools;

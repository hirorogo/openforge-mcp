import { ToolDefinition } from "../../registry.js";

const weatherTools: ToolDefinition[] = [
  {
    name: "create_weather_system",
    description:
      "Create a complete weather controller with rain, snow, and wind zone children",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the weather system root GameObject",
          default: "WeatherSystem",
        },
      },
      required: [],
    },
  },
  {
    name: "set_rain",
    description:
      "Enable or configure rain particle system with adjustable intensity and area coverage",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable or disable rain",
          default: true,
        },
        intensity: {
          type: "number",
          description:
            "Rain intensity multiplier (1.0 = normal, 2.0 = heavy)",
          default: 1,
        },
        area_size: {
          type: "number",
          description: "Size of the rain area in world units",
          default: 30,
        },
      },
      required: [],
    },
  },
  {
    name: "set_snow",
    description:
      "Enable or configure snow particle system with noise-based drift and adjustable intensity",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable or disable snow",
          default: true,
        },
        intensity: {
          type: "number",
          description:
            "Snow intensity multiplier (1.0 = normal, 2.0 = blizzard)",
          default: 1,
        },
        area_size: {
          type: "number",
          description: "Size of the snow area in world units",
          default: 30,
        },
      },
      required: [],
    },
  },
  {
    name: "set_fog_weather",
    description:
      "Set fog density, color, and mode for atmospheric weather effects",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable or disable fog",
          default: true,
        },
        density: {
          type: "number",
          description: "Fog density (0.0 to 1.0, typical range 0.01-0.1)",
          default: 0.05,
        },
        color: {
          type: "string",
          description:
            "Fog color as hex (#RRGGBB) or RGB values (r,g,b). Defaults to light gray.",
        },
      },
      required: [],
    },
  },
  {
    name: "set_thunderstorm",
    description:
      "Enable a thunderstorm combining heavy rain, lightning flashes, dark ambient, and fog",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        enabled: {
          type: "boolean",
          description: "Enable or disable thunderstorm",
          default: true,
        },
        rain_intensity: {
          type: "number",
          description: "Rain intensity during storm",
          default: 1.5,
        },
        lightning_interval: {
          type: "number",
          description: "Average seconds between lightning flashes",
          default: 5,
        },
      },
      required: [],
    },
  },
  {
    name: "create_day_night_cycle",
    description:
      "Create a 24-hour day/night cycle with sun and moon directional lights, gradient-based ambient, and sunrise/sunset events",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        cycle_duration: {
          type: "number",
          description:
            "Duration of a full 24-hour cycle in real-time seconds",
          default: 120,
        },
        start_time: {
          type: "number",
          description: "Starting hour (0-24, where 12 = noon)",
          default: 12,
        },
        folder: {
          type: "string",
          description: "Folder for the controller script",
          default: "Assets/Scripts/Environment",
        },
      },
      required: [],
    },
  },
  {
    name: "set_time_of_day",
    description:
      "Set the current time of day, updating sun rotation, intensity, and ambient lighting",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        hour: {
          type: "number",
          description: "Hour of day (0-24, where 0/24 = midnight, 12 = noon)",
        },
      },
      required: ["hour"],
    },
  },
  {
    name: "set_wind",
    description:
      "Configure a wind zone with main strength, turbulence, pulse, and direction",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        main: {
          type: "number",
          description: "Main wind strength",
          default: 1,
        },
        turbulence: {
          type: "number",
          description: "Wind turbulence amount",
          default: 0.5,
        },
        pulse_frequency: {
          type: "number",
          description: "Frequency of wind pulses",
          default: 0.5,
        },
        mode: {
          type: "string",
          enum: ["directional", "spherical"],
          description: "Wind zone mode",
          default: "directional",
        },
        direction: {
          type: "string",
          description: "Wind direction as [x,y,z] vector",
        },
      },
      required: [],
    },
  },
  {
    name: "create_cloud_system",
    description:
      "Create a particle-based cloud system at a specified height with configurable density and area",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        height: {
          type: "number",
          description: "Height of the cloud layer in world units",
          default: 50,
        },
        area_size: {
          type: "number",
          description: "Size of the cloud area",
          default: 100,
        },
        count: {
          type: "number",
          description: "Maximum number of cloud particles",
          default: 200,
        },
      },
      required: [],
    },
  },
  {
    name: "get_weather_info",
    description:
      "Get the current weather state including rain, snow, fog, wind, clouds, and ambient settings",
    category: "weather",
    target: "unity",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export default weatherTools;

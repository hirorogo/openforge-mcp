import { ToolDefinition } from "../../registry.js";

const vfxTools: ToolDefinition[] = [
  {
    name: "create_particle_system",
    description: "Create a new Particle System with configurable main module settings",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Particle system name" },
        position: { type: "string", description: "Position as 'x,y,z'" },
        duration: { type: "number", description: "System duration in seconds" },
        loop: { type: "boolean", description: "Enable looping" },
        start_speed: { type: "number", description: "Initial particle speed" },
        start_size: { type: "number", description: "Initial particle size" },
        start_lifetime: { type: "number", description: "Particle lifetime in seconds" },
        start_color: { type: "string", description: "Start color" },
        max_particles: { type: "number", description: "Maximum particle count" },
        gravity: { type: "number", description: "Gravity modifier" },
        simulation_space: { type: "string", description: "Simulation space: Local, World, Custom" },
      },
      required: [],
    },
  },
  {
    name: "set_particle_emission",
    description: "Configure particle emission rate and bursts",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        enabled: { type: "boolean", description: "Enable/disable emission" },
        rate_over_time: { type: "number", description: "Particles emitted per second" },
        rate_over_distance: { type: "number", description: "Particles emitted per unit distance" },
        burst_count: { type: "number", description: "Number of particles in burst" },
        burst_time: { type: "number", description: "Time of burst", default: 0 },
      },
      required: ["target"],
    },
  },
  {
    name: "set_particle_shape",
    description: "Set the emission shape of a particle system",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        shape: { type: "string", enum: ["sphere", "hemisphere", "cone", "box", "circle", "edge", "donut", "rectangle"], description: "Emission shape" },
        radius: { type: "number", description: "Shape radius" },
        angle: { type: "number", description: "Cone angle in degrees" },
        scale: { type: "string", description: "Shape scale as 'x,y,z'" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_particle_color",
    description: "Set particle start color or color over lifetime gradient",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        start_color: { type: "string", description: "Start color (hex, rgba, or named)" },
        color_over_lifetime: { type: "string", description: "Gradient as semicolon-separated colors (e.g. 'red;yellow;0,0,0,0')" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_particle_size",
    description: "Set particle start size or size over lifetime curve",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        start_size: { type: "number", description: "Starting particle size" },
        size_over_lifetime: { type: "string", description: "Size curve as semicolon-separated values (e.g. '1;0.5;0')" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_particle_lifetime",
    description: "Set particle lifetime as constant or random between two values",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        lifetime: { type: "number", description: "Constant lifetime in seconds" },
        min: { type: "number", description: "Minimum lifetime for random range" },
        max: { type: "number", description: "Maximum lifetime for random range" },
      },
      required: ["target"],
    },
  },
  {
    name: "set_particle_velocity",
    description: "Set particle speed, velocity over lifetime, and gravity",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Particle system GameObject name or ID" },
        start_speed: { type: "number", description: "Initial speed" },
        velocity: { type: "string", description: "Velocity over lifetime as 'x,y,z'" },
        gravity: { type: "number", description: "Gravity modifier" },
      },
      required: ["target"],
    },
  },
  {
    name: "add_post_processing",
    description: "Create a Post Processing / Volume GameObject for screen effects",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Volume name" },
        is_global: { type: "boolean", description: "Global volume affecting all cameras", default: true },
        priority: { type: "number", description: "Volume priority" },
      },
      required: [],
    },
  },
  {
    name: "set_bloom",
    description: "Configure bloom post-processing effect on a Volume (requires URP/HDRP)",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Volume GameObject name" },
        intensity: { type: "number", description: "Bloom intensity", default: 1 },
        threshold: { type: "number", description: "Brightness threshold for bloom", default: 0.9 },
      },
      required: [],
    },
  },
  {
    name: "set_depth_of_field",
    description: "Configure depth of field post-processing effect (requires URP/HDRP)",
    category: "vfx",
    target: "unity",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "Volume GameObject name" },
        focus_distance: { type: "number", description: "Focus distance in meters", default: 10 },
        aperture: { type: "number", description: "Lens aperture (f-stop)" },
      },
      required: [],
    },
  },
];

export default vfxTools;

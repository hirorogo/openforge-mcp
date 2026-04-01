import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MeshProvider = "rodin" | "meshy" | "tripo";
export type TextureProvider = "stable-diffusion" | "dall-e";
export type AudioProvider = "suno" | "elevenlabs";
export type SkyboxProvider = "blockade";

export type TextureType = "albedo" | "normal" | "roughness" | "pbr";
export type AudioType = "music" | "sfx";

export interface MeshOptions {
  provider?: MeshProvider;
  format?: string;
  polycount?: number;
}

export interface TextureOptions {
  provider?: TextureProvider;
  type?: TextureType;
  width?: number;
  height?: number;
}

export interface AudioOptions {
  provider?: AudioProvider;
  type?: AudioType;
  duration?: number;
}

export interface SkyboxOptions {
  provider?: SkyboxProvider;
  style?: string;
}

export interface GenerationResult {
  success: boolean;
  filePath?: string;
  provider: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderStatus {
  mesh: { rodin: boolean; meshy: boolean; tripo: boolean };
  texture: { "stable-diffusion": boolean; "dall-e": boolean };
  audio: { suno: boolean; elevenlabs: boolean };
  skybox: { blockade: boolean };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function hasKey(key: string): boolean {
  const val = getEnv(key);
  return val !== undefined && val !== "";
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function outputDir(): string {
  return path.join(os.tmpdir(), "openforge-pipeline", "generated");
}

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
}

function timestamp(): string {
  return Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Provider implementations — Mesh
// ---------------------------------------------------------------------------

async function generateMeshRodin(
  prompt: string,
  options: MeshOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("RODIN_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "rodin", error: "RODIN_API_KEY is not configured." };
  }

  const baseUrl = getEnv("RODIN_API_URL") || "https://hyperhuman.deemos.com/api/v2";

  // Step 1: Submit generation task
  const submitRes = await fetch(`${baseUrl}/rodin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      output_format: options.format || "glb",
      poly_count: options.polycount || undefined,
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    return { success: false, provider: "rodin", error: `Rodin API error (${submitRes.status}): ${text}` };
  }

  const submitData = (await submitRes.json()) as { uuid: string; [k: string]: unknown };
  const taskId = submitData.uuid;

  // Step 2: Poll until complete
  const maxAttempts = 120;
  const pollInterval = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ uuid: taskId }),
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      output_url?: string;
      [k: string]: unknown;
    };

    if (pollData.status === "failed") {
      return { success: false, provider: "rodin", error: "Rodin generation task failed." };
    }

    if (pollData.status === "completed" && pollData.output_url) {
      const ext = options.format || "glb";
      const dir = outputDir();
      await ensureDir(dir);
      const filePath = path.join(dir, `mesh_rodin_${timestamp()}.${ext}`);
      await downloadToFile(pollData.output_url, filePath);
      return {
        success: true,
        provider: "rodin",
        filePath,
        metadata: { taskId, format: ext },
      };
    }
  }

  return { success: false, provider: "rodin", error: "Rodin generation timed out." };
}

async function generateMeshMeshy(
  prompt: string,
  options: MeshOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("MESHY_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "meshy", error: "MESHY_API_KEY is not configured." };
  }

  const baseUrl = getEnv("MESHY_API_URL") || "https://api.meshy.ai/v2";

  // Step 1: Create task
  const createRes = await fetch(`${baseUrl}/text-to-3d`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mode: "preview",
      prompt,
      output_format: options.format || "glb",
      topology: options.polycount ? "quad" : undefined,
      target_polycount: options.polycount || undefined,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return { success: false, provider: "meshy", error: `Meshy API error (${createRes.status}): ${text}` };
  }

  const createData = (await createRes.json()) as { result: string; [k: string]: unknown };
  const taskId = createData.result;

  // Step 2: Poll
  const maxAttempts = 120;
  const pollInterval = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/text-to-3d/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollData = (await pollRes.json()) as {
      status: string;
      model_urls?: { glb?: string; fbx?: string; obj?: string };
      [k: string]: unknown;
    };

    if (pollData.status === "FAILED") {
      return { success: false, provider: "meshy", error: "Meshy generation task failed." };
    }

    if (pollData.status === "SUCCEEDED" && pollData.model_urls) {
      const ext = options.format || "glb";
      const modelUrl =
        pollData.model_urls[ext as keyof typeof pollData.model_urls] ||
        pollData.model_urls.glb;
      if (!modelUrl) {
        return { success: false, provider: "meshy", error: "Meshy returned no download URL." };
      }
      const dir = outputDir();
      await ensureDir(dir);
      const filePath = path.join(dir, `mesh_meshy_${timestamp()}.${ext}`);
      await downloadToFile(modelUrl, filePath);
      return {
        success: true,
        provider: "meshy",
        filePath,
        metadata: { taskId, format: ext },
      };
    }
  }

  return { success: false, provider: "meshy", error: "Meshy generation timed out." };
}

async function generateMeshTripo(
  prompt: string,
  options: MeshOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("TRIPO_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "tripo", error: "TRIPO_API_KEY is not configured." };
  }

  const baseUrl = getEnv("TRIPO_API_URL") || "https://api.tripo3d.ai/v2/openapi";

  // Step 1: Create task
  const createRes = await fetch(`${baseUrl}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: "text_to_model",
      prompt,
      output_format: options.format || "glb",
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return { success: false, provider: "tripo", error: `Tripo API error (${createRes.status}): ${text}` };
  }

  const createData = (await createRes.json()) as {
    data: { task_id: string };
    [k: string]: unknown;
  };
  const taskId = createData.data.task_id;

  // Step 2: Poll
  const maxAttempts = 120;
  const pollInterval = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/task/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollData = (await pollRes.json()) as {
      data: {
        status: string;
        output?: { model?: string };
      };
      [k: string]: unknown;
    };

    if (pollData.data.status === "failed") {
      return { success: false, provider: "tripo", error: "Tripo generation task failed." };
    }

    if (pollData.data.status === "success" && pollData.data.output?.model) {
      const ext = options.format || "glb";
      const dir = outputDir();
      await ensureDir(dir);
      const filePath = path.join(dir, `mesh_tripo_${timestamp()}.${ext}`);
      await downloadToFile(pollData.data.output.model, filePath);
      return {
        success: true,
        provider: "tripo",
        filePath,
        metadata: { taskId, format: ext },
      };
    }
  }

  return { success: false, provider: "tripo", error: "Tripo generation timed out." };
}

// ---------------------------------------------------------------------------
// Provider implementations — Texture
// ---------------------------------------------------------------------------

async function generateTextureStableDiffusion(
  prompt: string,
  options: TextureOptions,
): Promise<GenerationResult> {
  const baseUrl = getEnv("SD_API_URL") || "http://localhost:7860";

  // Build prompt suffix for texture types
  let fullPrompt = prompt;
  switch (options.type) {
    case "normal":
      fullPrompt = `${prompt}, normal map, seamless texture, blue-purple tones`;
      break;
    case "roughness":
      fullPrompt = `${prompt}, roughness map, seamless texture, grayscale`;
      break;
    case "pbr":
      fullPrompt = `${prompt}, PBR texture set, seamless, physically based`;
      break;
    case "albedo":
    default:
      fullPrompt = `${prompt}, albedo texture, seamless, diffuse map`;
      break;
  }

  const width = options.width || 512;
  const height = options.height || 512;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: fullPrompt,
        width,
        height,
        steps: 30,
        cfg_scale: 7,
        sampler_name: "DPM++ 2M Karras",
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      provider: "stable-diffusion",
      error: `Could not reach Stable Diffusion API at ${baseUrl}: ${msg}`,
    };
  }

  if (!res.ok) {
    const text = await res.text();
    return {
      success: false,
      provider: "stable-diffusion",
      error: `Stable Diffusion API error (${res.status}): ${text}`,
    };
  }

  const data = (await res.json()) as { images: string[] };
  if (!data.images || data.images.length === 0) {
    return { success: false, provider: "stable-diffusion", error: "Stable Diffusion returned no images." };
  }

  const dir = outputDir();
  await ensureDir(dir);
  const texType = options.type || "albedo";
  const filePath = path.join(dir, `texture_sd_${texType}_${timestamp()}.png`);
  const buffer = Buffer.from(data.images[0], "base64");
  await fs.writeFile(filePath, buffer);

  return {
    success: true,
    provider: "stable-diffusion",
    filePath,
    metadata: { type: texType, width, height },
  };
}

async function generateTextureDallE(
  prompt: string,
  options: TextureOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "dall-e", error: "OPENAI_API_KEY is not configured." };
  }

  const baseUrl = getEnv("OPENAI_API_URL") || "https://api.openai.com/v1";

  let fullPrompt = prompt;
  switch (options.type) {
    case "normal":
      fullPrompt = `${prompt}, normal map texture, seamless, blue-purple tones`;
      break;
    case "roughness":
      fullPrompt = `${prompt}, roughness map texture, seamless, grayscale`;
      break;
    case "pbr":
      fullPrompt = `${prompt}, PBR texture set, seamless, physically based rendering`;
      break;
    case "albedo":
    default:
      fullPrompt = `${prompt}, albedo texture, seamless, diffuse map`;
      break;
  }

  // Map dimensions to DALL-E supported sizes
  const w = options.width || 1024;
  const h = options.height || 1024;
  let size: string;
  if (w <= 256 && h <= 256) {
    size = "256x256";
  } else if (w <= 512 && h <= 512) {
    size = "512x512";
  } else {
    size = "1024x1024";
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, provider: "dall-e", error: `DALL-E API error (${res.status}): ${text}` };
  }

  const data = (await res.json()) as { data: Array<{ b64_json: string }> };
  if (!data.data || data.data.length === 0) {
    return { success: false, provider: "dall-e", error: "DALL-E returned no images." };
  }

  const dir = outputDir();
  await ensureDir(dir);
  const texType = options.type || "albedo";
  const filePath = path.join(dir, `texture_dalle_${texType}_${timestamp()}.png`);
  const buffer = Buffer.from(data.data[0].b64_json, "base64");
  await fs.writeFile(filePath, buffer);

  return {
    success: true,
    provider: "dall-e",
    filePath,
    metadata: { type: texType, size },
  };
}

// ---------------------------------------------------------------------------
// Provider implementations — Audio
// ---------------------------------------------------------------------------

async function generateAudioSuno(
  prompt: string,
  options: AudioOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("SUNO_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "suno", error: "SUNO_API_KEY is not configured." };
  }

  const baseUrl = getEnv("SUNO_API_URL") || "https://studio-api.suno.ai/api";

  const createRes = await fetch(`${baseUrl}/generate/v2/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      gpt_description_prompt: prompt,
      make_instrumental: false,
      duration: options.duration || undefined,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return { success: false, provider: "suno", error: `Suno API error (${createRes.status}): ${text}` };
  }

  const createData = (await createRes.json()) as {
    clips?: Array<{ id: string; audio_url?: string; status: string }>;
    [k: string]: unknown;
  };

  if (!createData.clips || createData.clips.length === 0) {
    return { success: false, provider: "suno", error: "Suno returned no clips." };
  }

  const clipId = createData.clips[0].id;

  // Poll for completion
  const maxAttempts = 120;
  const pollInterval = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/feed/${clipId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollData = (await pollRes.json()) as Array<{
      id: string;
      status: string;
      audio_url?: string;
    }>;

    const clip = Array.isArray(pollData) ? pollData[0] : undefined;
    if (!clip) continue;

    if (clip.status === "error") {
      return { success: false, provider: "suno", error: "Suno generation failed." };
    }

    if (clip.status === "complete" && clip.audio_url) {
      const dir = outputDir();
      await ensureDir(dir);
      const filePath = path.join(dir, `audio_suno_${timestamp()}.mp3`);
      await downloadToFile(clip.audio_url, filePath);
      return {
        success: true,
        provider: "suno",
        filePath,
        metadata: { clipId },
      };
    }
  }

  return { success: false, provider: "suno", error: "Suno generation timed out." };
}

async function generateAudioElevenLabs(
  prompt: string,
  options: AudioOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("ELEVENLABS_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "elevenlabs", error: "ELEVENLABS_API_KEY is not configured." };
  }

  const baseUrl = getEnv("ELEVENLABS_API_URL") || "https://api.elevenlabs.io/v1";

  const res = await fetch(`${baseUrl}/sound-generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: options.duration || undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, provider: "elevenlabs", error: `ElevenLabs API error (${res.status}): ${text}` };
  }

  const dir = outputDir();
  await ensureDir(dir);
  const filePath = path.join(dir, `audio_elevenlabs_${timestamp()}.mp3`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    success: true,
    provider: "elevenlabs",
    filePath,
    metadata: { type: "sfx" },
  };
}

// ---------------------------------------------------------------------------
// Provider implementations — Skybox
// ---------------------------------------------------------------------------

async function generateSkyboxBlockade(
  prompt: string,
  options: SkyboxOptions,
): Promise<GenerationResult> {
  const apiKey = getEnv("BLOCKADE_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "blockade", error: "BLOCKADE_API_KEY is not configured." };
  }

  const baseUrl = getEnv("BLOCKADE_API_URL") || "https://backend.blockadelabs.com/api/v1";

  const createRes = await fetch(`${baseUrl}/skybox`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      prompt,
      skybox_style_id: options.style || undefined,
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return { success: false, provider: "blockade", error: `Blockade Labs API error (${createRes.status}): ${text}` };
  }

  const createData = (await createRes.json()) as {
    id: number;
    status: string;
    file_url?: string;
    [k: string]: unknown;
  };
  const taskId = createData.id;

  // Poll
  const maxAttempts = 120;
  const pollInterval = 5000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${baseUrl}/imagine/requests/${taskId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!pollRes.ok) {
      continue;
    }

    const pollData = (await pollRes.json()) as {
      request: {
        id: number;
        status: string;
        file_url?: string;
      };
    };

    if (pollData.request.status === "error") {
      return { success: false, provider: "blockade", error: "Blockade Labs generation failed." };
    }

    if (pollData.request.status === "complete" && pollData.request.file_url) {
      const dir = outputDir();
      await ensureDir(dir);
      const filePath = path.join(dir, `skybox_blockade_${timestamp()}.jpg`);
      await downloadToFile(pollData.request.file_url, filePath);
      return {
        success: true,
        provider: "blockade",
        filePath,
        metadata: { taskId, style: options.style },
      };
    }
  }

  return { success: false, provider: "blockade", error: "Blockade Labs generation timed out." };
}

// ---------------------------------------------------------------------------
// Provider selection maps
// ---------------------------------------------------------------------------

const MESH_PROVIDERS: Record<
  MeshProvider,
  (prompt: string, options: MeshOptions) => Promise<GenerationResult>
> = {
  rodin: generateMeshRodin,
  meshy: generateMeshMeshy,
  tripo: generateMeshTripo,
};

const TEXTURE_PROVIDERS: Record<
  TextureProvider,
  (prompt: string, options: TextureOptions) => Promise<GenerationResult>
> = {
  "stable-diffusion": generateTextureStableDiffusion,
  "dall-e": generateTextureDallE,
};

const AUDIO_PROVIDERS: Record<
  AudioProvider,
  (prompt: string, options: AudioOptions) => Promise<GenerationResult>
> = {
  suno: generateAudioSuno,
  elevenlabs: generateAudioElevenLabs,
};

const SKYBOX_PROVIDERS: Record<
  SkyboxProvider,
  (prompt: string, options: SkyboxOptions) => Promise<GenerationResult>
> = {
  blockade: generateSkyboxBlockade,
};

// ---------------------------------------------------------------------------
// Key requirements for each provider
// ---------------------------------------------------------------------------

const MESH_PROVIDER_KEYS: Record<MeshProvider, string> = {
  rodin: "RODIN_API_KEY",
  meshy: "MESHY_API_KEY",
  tripo: "TRIPO_API_KEY",
};

const TEXTURE_PROVIDER_KEYS: Record<TextureProvider, string> = {
  "stable-diffusion": "SD_API_URL",
  "dall-e": "OPENAI_API_KEY",
};

const AUDIO_PROVIDER_KEYS: Record<AudioProvider, string> = {
  suno: "SUNO_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
};

const SKYBOX_PROVIDER_KEYS: Record<SkyboxProvider, string> = {
  blockade: "BLOCKADE_API_KEY",
};

// ---------------------------------------------------------------------------
// AssetGeneration class
// ---------------------------------------------------------------------------

export class AssetGeneration {
  private resolveMeshProvider(requested?: MeshProvider): MeshProvider {
    if (requested) return requested;
    const envProvider = getEnv("OPENFORGE_MESH_PROVIDER") as MeshProvider | undefined;
    if (envProvider && envProvider in MESH_PROVIDERS) return envProvider;
    // Pick first configured provider
    for (const [name, key] of Object.entries(MESH_PROVIDER_KEYS)) {
      if (hasKey(key)) return name as MeshProvider;
    }
    return "rodin"; // default
  }

  private resolveTextureProvider(requested?: TextureProvider): TextureProvider {
    if (requested) return requested;
    const envProvider = getEnv("OPENFORGE_TEXTURE_PROVIDER") as TextureProvider | undefined;
    if (envProvider && envProvider in TEXTURE_PROVIDERS) return envProvider;
    for (const [name, key] of Object.entries(TEXTURE_PROVIDER_KEYS)) {
      if (hasKey(key)) return name as TextureProvider;
    }
    return "stable-diffusion"; // default (local, no key needed)
  }

  private resolveAudioProvider(requested?: AudioProvider): AudioProvider {
    if (requested) return requested;
    const envProvider = getEnv("OPENFORGE_AUDIO_PROVIDER") as AudioProvider | undefined;
    if (envProvider && envProvider in AUDIO_PROVIDERS) return envProvider;
    for (const [name, key] of Object.entries(AUDIO_PROVIDER_KEYS)) {
      if (hasKey(key)) return name as AudioProvider;
    }
    return "suno"; // default
  }

  private resolveSkyboxProvider(requested?: SkyboxProvider): SkyboxProvider {
    if (requested) return requested;
    return "blockade";
  }

  async generateMesh(prompt: string, options: MeshOptions = {}): Promise<GenerationResult> {
    const provider = this.resolveMeshProvider(options.provider);
    const fn = MESH_PROVIDERS[provider];
    if (!fn) {
      return { success: false, provider, error: `Unknown mesh provider: ${provider}` };
    }
    try {
      return await fn(prompt, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, provider, error: msg };
    }
  }

  async generateTexture(prompt: string, options: TextureOptions = {}): Promise<GenerationResult> {
    const provider = this.resolveTextureProvider(options.provider);
    const fn = TEXTURE_PROVIDERS[provider];
    if (!fn) {
      return { success: false, provider, error: `Unknown texture provider: ${provider}` };
    }
    try {
      return await fn(prompt, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, provider, error: msg };
    }
  }

  async generateAudio(prompt: string, options: AudioOptions = {}): Promise<GenerationResult> {
    const provider = this.resolveAudioProvider(options.provider);
    const fn = AUDIO_PROVIDERS[provider];
    if (!fn) {
      return { success: false, provider, error: `Unknown audio provider: ${provider}` };
    }
    try {
      return await fn(prompt, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, provider, error: msg };
    }
  }

  async generateSkybox(prompt: string, options: SkyboxOptions = {}): Promise<GenerationResult> {
    const provider = this.resolveSkyboxProvider(options.provider);
    const fn = SKYBOX_PROVIDERS[provider];
    if (!fn) {
      return { success: false, provider, error: `Unknown skybox provider: ${provider}` };
    }
    try {
      return await fn(prompt, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, provider, error: msg };
    }
  }

  getProviderStatus(): ProviderStatus {
    return {
      mesh: {
        rodin: hasKey("RODIN_API_KEY"),
        meshy: hasKey("MESHY_API_KEY"),
        tripo: hasKey("TRIPO_API_KEY"),
      },
      texture: {
        "stable-diffusion": hasKey("SD_API_URL"),
        "dall-e": hasKey("OPENAI_API_KEY"),
      },
      audio: {
        suno: hasKey("SUNO_API_KEY"),
        elevenlabs: hasKey("ELEVENLABS_API_KEY"),
      },
      skybox: {
        blockade: hasKey("BLOCKADE_API_KEY"),
      },
    };
  }
}

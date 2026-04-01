import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AssetGeneration } from "../asset-generation.js";

// Save original env so we can restore it
const originalEnv = { ...process.env };

function clearAllApiKeys() {
  delete process.env.RODIN_API_KEY;
  delete process.env.MESHY_API_KEY;
  delete process.env.TRIPO_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.SD_API_URL;
  delete process.env.SUNO_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.BLOCKADE_API_KEY;
  delete process.env.OPENFORGE_MESH_PROVIDER;
  delete process.env.OPENFORGE_TEXTURE_PROVIDER;
  delete process.env.OPENFORGE_AUDIO_PROVIDER;
}

describe("AssetGeneration", () => {
  let assetGen: AssetGeneration;

  beforeEach(() => {
    clearAllApiKeys();
    assetGen = new AssetGeneration();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("getProviderStatus", () => {
    it("should report no providers configured when no API keys are set", () => {
      const status = assetGen.getProviderStatus();

      expect(status.mesh.rodin).toBe(false);
      expect(status.mesh.meshy).toBe(false);
      expect(status.mesh.tripo).toBe(false);
      expect(status.texture["stable-diffusion"]).toBe(false);
      expect(status.texture["dall-e"]).toBe(false);
      expect(status.audio.suno).toBe(false);
      expect(status.audio.elevenlabs).toBe(false);
      expect(status.skybox.blockade).toBe(false);
    });

    it("should report rodin as configured when RODIN_API_KEY is set", () => {
      process.env.RODIN_API_KEY = "test-key";

      const status = assetGen.getProviderStatus();

      expect(status.mesh.rodin).toBe(true);
      expect(status.mesh.meshy).toBe(false);
      expect(status.mesh.tripo).toBe(false);
    });

    it("should report multiple providers configured when multiple keys are set", () => {
      process.env.RODIN_API_KEY = "test-key";
      process.env.OPENAI_API_KEY = "test-key";
      process.env.BLOCKADE_API_KEY = "test-key";

      const status = assetGen.getProviderStatus();

      expect(status.mesh.rodin).toBe(true);
      expect(status.texture["dall-e"]).toBe(true);
      expect(status.skybox.blockade).toBe(true);
    });

    it("should report stable-diffusion as configured when SD_API_URL is set", () => {
      process.env.SD_API_URL = "http://localhost:7860";

      const status = assetGen.getProviderStatus();

      expect(status.texture["stable-diffusion"]).toBe(true);
    });

    it("should not treat empty string keys as configured", () => {
      process.env.RODIN_API_KEY = "";

      const status = assetGen.getProviderStatus();

      expect(status.mesh.rodin).toBe(false);
    });
  });

  describe("provider selection", () => {
    it("should use explicitly requested mesh provider", async () => {
      // No key set, so the provider function will return an error about missing key
      const result = await assetGen.generateMesh("a sword", { provider: "meshy" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("meshy");
      expect(result.error).toContain("MESHY_API_KEY");
    });

    it("should use explicitly requested texture provider", async () => {
      const result = await assetGen.generateTexture("wood grain", { provider: "dall-e" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("dall-e");
      expect(result.error).toContain("OPENAI_API_KEY");
    });

    it("should use explicitly requested audio provider", async () => {
      const result = await assetGen.generateAudio("epic battle music", { provider: "elevenlabs" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("elevenlabs");
      expect(result.error).toContain("ELEVENLABS_API_KEY");
    });

    it("should use explicitly requested skybox provider", async () => {
      const result = await assetGen.generateSkybox("sunset desert", { provider: "blockade" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("blockade");
      expect(result.error).toContain("BLOCKADE_API_KEY");
    });

    it("should use OPENFORGE_MESH_PROVIDER env var when no provider specified", async () => {
      process.env.OPENFORGE_MESH_PROVIDER = "tripo";

      const result = await assetGen.generateMesh("a dragon");

      expect(result.provider).toBe("tripo");
      expect(result.error).toContain("TRIPO_API_KEY");
    });

    it("should pick first configured provider when no preference given", async () => {
      process.env.MESHY_API_KEY = "test-key";
      // rodin is first in the map but has no key, meshy does

      // We need to mock fetch to avoid actual API calls
      const mockFetch = vi.fn().mockRejectedValue(new Error("network error"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateMesh("a tree");

      expect(result.provider).toBe("meshy");
    });

    it("should fall back to default provider when no keys set and no preference", async () => {
      const result = await assetGen.generateMesh("a rock");

      // Default is rodin
      expect(result.provider).toBe("rodin");
      expect(result.error).toContain("RODIN_API_KEY");
    });
  });

  describe("error handling", () => {
    it("should return error when mesh provider is not configured", async () => {
      const result = await assetGen.generateMesh("a house", { provider: "rodin" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("RODIN_API_KEY is not configured");
    });

    it("should return error when texture provider dall-e is not configured", async () => {
      const result = await assetGen.generateTexture("brick wall", { provider: "dall-e" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("OPENAI_API_KEY is not configured");
    });

    it("should return error when audio provider suno is not configured", async () => {
      const result = await assetGen.generateAudio("calm piano", { provider: "suno" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SUNO_API_KEY is not configured");
    });

    it("should return error when audio provider elevenlabs is not configured", async () => {
      const result = await assetGen.generateAudio("explosion", { provider: "elevenlabs" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("ELEVENLABS_API_KEY is not configured");
    });

    it("should return error when skybox provider is not configured", async () => {
      const result = await assetGen.generateSkybox("mountain landscape");

      expect(result.success).toBe(false);
      expect(result.error).toContain("BLOCKADE_API_KEY is not configured");
    });

    it("should handle fetch errors gracefully for mesh generation", async () => {
      process.env.RODIN_API_KEY = "test-key";
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateMesh("a car", { provider: "rodin" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("rodin");
      expect(result.error).toContain("Network failure");
    });

    it("should handle fetch errors gracefully for texture generation", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateTexture("metal plate", { provider: "dall-e" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("dall-e");
      expect(result.error).toContain("Connection refused");
    });

    it("should handle fetch errors gracefully for audio generation", async () => {
      process.env.SUNO_API_KEY = "test-key";
      const mockFetch = vi.fn().mockRejectedValue(new Error("Timeout"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateAudio("jazz tune", { provider: "suno" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("suno");
      expect(result.error).toContain("Timeout");
    });

    it("should handle fetch errors gracefully for skybox generation", async () => {
      process.env.BLOCKADE_API_KEY = "test-key";
      const mockFetch = vi.fn().mockRejectedValue(new Error("Server error"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateSkybox("space nebula", { provider: "blockade" });

      expect(result.success).toBe(false);
      expect(result.provider).toBe("blockade");
      expect(result.error).toContain("Server error");
    });
  });

  describe("URL construction", () => {
    it("should use default Rodin API URL", async () => {
      process.env.RODIN_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateMesh("test", { provider: "rodin" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://hyperhuman.deemos.com/api/v2/rodin",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use custom Rodin API URL from env", async () => {
      process.env.RODIN_API_KEY = "test-key";
      process.env.RODIN_API_URL = "https://custom.rodin.api/v1";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateMesh("test", { provider: "rodin" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.rodin.api/v1/rodin",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default Meshy API URL", async () => {
      process.env.MESHY_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateMesh("test", { provider: "meshy" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.meshy.ai/v2/text-to-3d",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default Tripo API URL", async () => {
      process.env.TRIPO_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateMesh("test", { provider: "tripo" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tripo3d.ai/v2/openapi/task",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default Stable Diffusion URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("test", { provider: "stable-diffusion" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:7860/sdapi/v1/txt2img",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use custom SD_API_URL", async () => {
      process.env.SD_API_URL = "http://myserver:8080";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Error",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("test", { provider: "stable-diffusion" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://myserver:8080/sdapi/v1/txt2img",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default DALL-E API URL", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("test", { provider: "dall-e" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/images/generations",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default Suno API URL", async () => {
      process.env.SUNO_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateAudio("test", { provider: "suno" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://studio-api.suno.ai/api/generate/v2/",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default ElevenLabs API URL", async () => {
      process.env.ELEVENLABS_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateAudio("test", { provider: "elevenlabs" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.elevenlabs.io/v1/sound-generation",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should use default Blockade Labs API URL", async () => {
      process.env.BLOCKADE_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateSkybox("test", { provider: "blockade" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://backend.blockadelabs.com/api/v1/skybox",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("API call construction", () => {
    it("should send correct body for Rodin mesh generation", async () => {
      process.env.RODIN_API_KEY = "my-rodin-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateMesh("a medieval sword", { provider: "rodin", format: "fbx", polycount: 5000 });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.prompt).toBe("a medieval sword");
      expect(body.output_format).toBe("fbx");
      expect(body.poly_count).toBe(5000);

      const headers = callArgs[1].headers;
      expect(headers.Authorization).toBe("Bearer my-rodin-key");
    });

    it("should send correct body for DALL-E texture generation", async () => {
      process.env.OPENAI_API_KEY = "my-openai-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("rusty metal", { provider: "dall-e", type: "normal", width: 512, height: 512 });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.prompt).toContain("rusty metal");
      expect(body.prompt).toContain("normal map");
      expect(body.model).toBe("dall-e-3");
      expect(body.size).toBe("512x512");
      expect(body.response_format).toBe("b64_json");

      const headers = callArgs[1].headers;
      expect(headers.Authorization).toBe("Bearer my-openai-key");
    });

    it("should send correct body for ElevenLabs audio generation", async () => {
      process.env.ELEVENLABS_API_KEY = "my-el-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateAudio("sword clash", { provider: "elevenlabs", duration: 3 });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.text).toBe("sword clash");
      expect(body.duration_seconds).toBe(3);

      const headers = callArgs[1].headers;
      expect(headers["xi-api-key"]).toBe("my-el-key");
    });

    it("should send correct body for Blockade skybox generation", async () => {
      process.env.BLOCKADE_API_KEY = "my-blockade-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateSkybox("alien planet with two suns", { style: "fantasy" });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.prompt).toBe("alien planet with two suns");
      expect(body.skybox_style_id).toBe("fantasy");

      const headers = callArgs[1].headers;
      expect(headers["x-api-key"]).toBe("my-blockade-key");
    });

    it("should handle non-OK response from Meshy API", async () => {
      process.env.MESHY_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateMesh("test", { provider: "meshy" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("429");
      expect(result.error).toContain("Rate limit exceeded");
    });

    it("should handle non-OK response from Tripo API", async () => {
      process.env.TRIPO_API_KEY = "test-key";
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await assetGen.generateMesh("test", { provider: "tripo" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("500");
    });
  });

  describe("texture type prompt augmentation", () => {
    it("should augment prompt for normal map type via Stable Diffusion", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "error",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("stone wall", { provider: "stable-diffusion", type: "normal" });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain("stone wall");
      expect(body.prompt).toContain("normal map");
    });

    it("should augment prompt for roughness map type", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "error",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("polished marble", { provider: "stable-diffusion", type: "roughness" });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain("polished marble");
      expect(body.prompt).toContain("roughness map");
    });

    it("should augment prompt for PBR texture set", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "error",
      });
      vi.stubGlobal("fetch", mockFetch);

      await assetGen.generateTexture("wooden floor", { provider: "stable-diffusion", type: "pbr" });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.prompt).toContain("wooden floor");
      expect(body.prompt).toContain("PBR");
    });
  });
});

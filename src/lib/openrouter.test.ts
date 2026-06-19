import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkOpenRouterKeyAvailability } from "./openrouter";
import { clearErrorLog, loadErrorLog } from "./error-log";

describe("OpenRouter key validation", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("throws when no API key is configured", async () => {
    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: [],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as any),
    ).rejects.toThrow("No OpenRouter API key configured");
  });

  it("validates a single valid key and logs the result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => "",
    })) as any);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["valid-key-1"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as any),
    ).resolves.toBe(true);

    const logs = loadErrorLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].source).toBe("openrouter.key-check");
    expect(logs[0].message).toContain("succeeded");
    expect(logs[0].message).toContain("1/1");
  });

  it("allows one valid key among multiple keys and records key validation details", async () => {
    const fetchStub = vi.fn(async (_url, options) => {
      const auth = options?.headers?.Authorization;
      if (auth === "Bearer bad-key") {
        return {
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () => "",
      };
    });

    vi.stubGlobal("fetch", fetchStub as any);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["bad-key", "valid-key-2"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as any),
    ).resolves.toBe(true);

    const logs = loadErrorLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].source).toBe("openrouter.key-check");
    expect(logs[0].message).toContain("succeeded");
    expect(logs[0].message).toContain("1/2");
    expect(logs[0].message).toContain("key[1]=Unauthorized");
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });

  it("fails when all configured keys are invalid and logs the failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    })) as any);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["bad-key-1", "bad-key-2"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as any),
    ).rejects.toThrow("OpenRouter key validation failed for 2 key(s)");

    const logs = loadErrorLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].source).toBe("openrouter.key-check");
    expect(logs[0].message).toContain("failed");
    expect(logs[0].message).toContain("2 key(s)");
  });
});

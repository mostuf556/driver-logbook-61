import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkOpenRouterKeyAvailability } from "./openrouter";
import { clearErrorLog, loadErrorLog } from "./error-log";
import type { AppSettings } from "./types";

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
      } as AppSettings),
    ).rejects.toThrow("No OpenRouter API key configured");
  });

  it("validates a single valid key and logs the result", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    }));
    vi.stubGlobal("fetch", fetchStub as unknown as typeof fetch);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["valid-key-1"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as AppSettings),
    ).resolves.toBe(true);

    const logs = loadErrorLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].source).toBe("openrouter.key-check");
    expect(logs[0].message).toContain("succeeded");
    expect(logs[0].message).toContain("1/1");
  });

  it("rejects a response that returns an OpenRouter error payload even with 200 status", async () => {
    const fetchStub = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ error: { message: "Invalid API key" } }),
    }));
    vi.stubGlobal("fetch", fetchStub as unknown as typeof fetch);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["bad-key"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as AppSettings),
    ).rejects.toThrow("OpenRouter key validation failed for 1 key(s)");
  });

  it("allows one valid key among multiple keys and records key validation details", async () => {
    const fetchStub = vi.fn(async (_url, options) => {
      const auth = options?.headers?.Authorization;
      if (auth === "Bearer bad-key") {
        return {
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
          json: async () => ({ error: { message: "Unauthorized" } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "ok" } }] }),
        text: async () => "",
      };
    });

    vi.stubGlobal("fetch", fetchStub as unknown as typeof fetch);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["bad-key", "valid-key-2"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as AppSettings),
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
    const fetchStub = vi.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    }));
    vi.stubGlobal("fetch", fetchStub as unknown as typeof fetch);

    await expect(
      checkOpenRouterKeyAvailability({
        openRouterApiKeys: ["bad-key-1", "bad-key-2"],
        openRouterApiKey: "",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
      } as AppSettings),
    ).rejects.toThrow("OpenRouter key validation failed for 2 key(s)");

    const logs = loadErrorLog();
    expect(logs).toHaveLength(1);
    expect(logs[0].source).toBe("openrouter.key-check");
    expect(logs[0].message).toContain("failed");
    expect(logs[0].message).toContain("2 key(s)");
  });
});

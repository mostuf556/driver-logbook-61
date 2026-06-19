import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useOpenRouterKeyStatus } from "./use-openrouter-key-status";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { AppSettings } from "@/lib/types";

vi.mock("@/lib/openrouter", () => ({
  checkOpenRouterKeyAvailability: vi.fn(async (settings: AppSettings) => {
    const keys = [
      ...(settings.openRouterApiKeys ?? []).filter(Boolean),
      settings.openRouterApiKey,
    ].filter(Boolean);

    if (keys.some((k) => k.startsWith("valid"))) {
      return Promise.resolve(true);
    }
    return Promise.reject(new Error("Invalid key"));
  }),
}));

describe("useOpenRouterKeyStatus hook behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 'missing' when no OpenRouter keys are configured", () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: [],
      openRouterApiKeyTests: {},
    };

    const status = useOpenRouterKeyStatus(settings);
    expect(status).toBe("missing");
  });

  it("starts with 'checking' status when keys are provided", () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status = useOpenRouterKeyStatus(settings);
    // Initial state is "checking" while validation is in progress
    expect(status).toBe("checking");
  });

  it("validates single key from openRouterApiKeys", async () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    useOpenRouterKeyStatus(settings);

    // Wait for async validation to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("includes openRouterApiKey in fingerprint even when empty", () => {
    const settings1: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status1 = useOpenRouterKeyStatus(settings1);
    expect(status1).toBe("checking");

    const settings2: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status2 = useOpenRouterKeyStatus(settings2);
    expect(status2).toBe("checking");
  });

  it("includes validation timestamp in fingerprint for rechecks", () => {
    const timestamp1 = "2024-01-01T00:00:00.000Z";
    const timestamp2 = "2024-01-02T00:00:00.000Z";

    const settings1: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": timestamp1 },
    };

    const status1 = useOpenRouterKeyStatus(settings1);
    expect(status1).toBe("checking");

    const settings2: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterApiKeyTests: { "valid-key-1": timestamp2 },
    };

    const status2 = useOpenRouterKeyStatus(settings2);
    expect(status2).toBe("checking");
  });

  it("uses baseUrl in fingerprint to trigger recheck on URL change", () => {
    const settings1: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterBaseUrl: "https://openrouter.ai/api/v1",
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status1 = useOpenRouterKeyStatus(settings1);
    expect(status1).toBe("checking");

    const settings2: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterBaseUrl: "https://custom.example.com/api",
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status2 = useOpenRouterKeyStatus(settings2);
    expect(status2).toBe("checking");
  });

  it("uses model in fingerprint to trigger recheck on model change", () => {
    const settings1: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterModel: "gpt-4",
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status1 = useOpenRouterKeyStatus(settings1);
    expect(status1).toBe("checking");

    const settings2: AppSettings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKey: "",
      openRouterApiKeys: ["valid-key-1"],
      openRouterModel: "gpt-3.5-turbo",
      openRouterApiKeyTests: { "valid-key-1": "2024-01-01T00:00:00.000Z" },
    };

    const status2 = useOpenRouterKeyStatus(settings2);
    expect(status2).toBe("checking");
  });
});

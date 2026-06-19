import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { loadSettings, saveSettings, splitName, migrateReport, migrateContact, uid } from "./storage";

// Expose splitName, migrateReport, migrateContact by exporting them for tests.
// We'll update storage.ts to export these helpers if not already exported.

describe("storage migrations and helpers", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });
  it("splitName splits full name into first and last", () => {
    expect(splitName("John Doe")).toEqual({ firstName: "John", lastName: "Doe" });
    expect(splitName("Single")).toEqual({ firstName: "Single", lastName: "" });
    expect(splitName("")).toEqual({ firstName: "", lastName: "" });
  });

  it("migrateReport fills name from driverName", () => {
    const legacy: any = { driverName: "Maya Levi", date: "2024-01-01" };
    const migrated = migrateReport(legacy);
    expect(migrated.firstName).toBe("Maya");
    expect(migrated.lastName).toBe("Levi");
  });

  it("migrateContact fills carNumbers default and name", () => {
    const legacy: any = { driverName: "A B" };
    const migrated = migrateContact(legacy);
    expect(migrated.carNumbers).toEqual([]);
    expect(migrated.firstName).toBe("A");
  });

  it("uid returns a string of expected pattern", () => {
    const id = uid();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(5);
  });

  it("persists OpenRouter API key list through localStorage", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      openRouterApiKeys: ["test-key-1", "test-key-2"],
      openRouterApiKey: "",
      openRouterApiKeyTests: { "test-key-1": "2024-01-01T00:00:00.000Z" },
    };

    saveSettings(settings);
    const loaded = loadSettings();

    expect(loaded.openRouterApiKeys).toEqual(["test-key-1", "test-key-2"]);
    expect(loaded.openRouterApiKey).toBe("");
    expect(loaded.openRouterApiKeyTests).toEqual({ "test-key-1": "2024-01-01T00:00:00.000Z" });
  });
});

import { describe, it, expect } from "vitest";
import { splitName, migrateReport, migrateContact, uid } from "./storage";

// Expose splitName, migrateReport, migrateContact by exporting them for tests.
// We'll update storage.ts to export these helpers if not already exported.

describe("storage migrations and helpers", () => {
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
});

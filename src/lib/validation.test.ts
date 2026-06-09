import { describe, it, expect } from "vitest";
import { validatePhone, validateIdNumber, validateCarNumber, normalizePlate } from "./validation";
import { DEFAULT_SETTINGS } from "./defaults";

describe("validation helpers", () => {
  it("validatePhone accepts normal phone when optional", () => {
    const s = { ...DEFAULT_SETTINGS, requirePhone: false };
    expect(validatePhone("050-123-4567", s)).toBe(null);
    expect(validatePhone("+972501234567", s)).toBe(null);
  });

  it("validatePhone rejects short numbers", () => {
    const s = { ...DEFAULT_SETTINGS, phoneMinLength: 5 };
    expect(validatePhone("123", s)).toMatch(/קצר/);
  });

  it("validateIdNumber checks length and checksum", () => {
    const s = { ...DEFAULT_SETTINGS, requireIdNumber: true, idNumberLength: 9, validateIsraeliId: true };
    expect(validateIdNumber("", s)).toMatch(/חובה/);
    expect(validateIdNumber("12345678a", s)).toMatch(/ספרות/);
    expect(validateIdNumber("123456780", s)).toMatch(/לא תקינה/);
  });

  it("validateCarNumber accepts and rejects based on length and regex", () => {
    const s = { ...DEFAULT_SETTINGS, requireCarNumber: true, carNumberMinLength: 2, carNumberMaxLength: 10, carNumberAllowedChars: "^[A-Za-z0-9- ]+$" };
    expect(validateCarNumber("ABC-123", s)).toBeNull();
    expect(validateCarNumber("A", s)).toMatch(/קצר/);
    expect(validateCarNumber("THISISWAYTOOLONGPLATE", s)).toMatch(/ארוך/);
    expect(validateCarNumber("!@#", s)).toMatch(/לא חוקיים/);
  });

  it("normalizePlate strips punctuation and lowercases", () => {
    expect(normalizePlate("AB- 12.3")).toBe("ab123");
  });
});

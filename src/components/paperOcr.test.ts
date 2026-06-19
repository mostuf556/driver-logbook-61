import { describe, it, expect } from "vitest";
import { parseRecords, normalizeDate, normalizeTime, normalizeValue } from "./PaperOcrDialog";

describe("PaperOcr parsing", () => {
  it("normalizeValue collapses whitespace", () => {
    expect(normalizeValue("  a   b \t c ")).toBe("a b c");
  });

  it("normalizeDate handles YYYY-MM-DD", () => {
    expect(normalizeDate("2024-1-2")).toBe("2024-01-02");
  });

  it("normalizeDate handles DD-MM-YYYY", () => {
    expect(normalizeDate("02-01-2024")).toBe("2024-01-02");
  });

  it("normalizeTime converts dot to colon and pads hours", () => {
    expect(normalizeTime("9.05")).toBe("09:05");
    expect(normalizeTime("12:30")).toBe("12:30");
    expect(normalizeTime("invalid")).toBe("");
  });

  it("parseRecords returns empty for empty text", () => {
    expect(parseRecords("\n\n")).toEqual([]);
  });

  it("parseRecords parses single plate line", () => {
    const rows = parseRecords("ABC123");
    expect(rows).toHaveLength(1);
    expect(rows[0].carNumber).toBe("ABC123");
  });

  it("parseRecords parses tab-separated header+row with 11 columns", () => {
    const header =
      "date\tentryTime\texitTime\tfirstName\tlastName\tidNumber\tphone\tcarNumber\tcompany\tapproverName\tguardName";
    const row =
      "2024-01-02\t09:00\t10:00\tMaya\tLevi\t123456789\t0501234567\tABC123\tLogistics\tGadi\tNir";
    const parsed = parseRecords(`${header}\n${row}`);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].date).toBe("2024-01-02");
    expect(parsed[0].entryTime).toBe("09:00");
    expect(parsed[0].exitTime).toBe("10:00");
    expect(parsed[0].firstName).toBe("Maya");
    expect(parsed[0].carNumber).toBe("ABC123");
  });

  it("parseRecords parses comma-separated 6+ columns variant", () => {
    const line = "02/01/2024,9.00,10.00,Maya,Levi,ABC123,Logistics,123456789,0501234567";
    const parsed = parseRecords(line);
    expect(parsed[0].date).toBe("2024-01-02");
    expect(parsed[0].entryTime).toBe("09:00");
    expect(parsed[0].carNumber).toBe("ABC123");
  });
});

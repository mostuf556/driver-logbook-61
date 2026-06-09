import { describe, expect, it } from "vitest";
import { getSuggestions } from "./contacts";
import { DEFAULT_SETTINGS } from "./defaults";
import type { Contact } from "./types";

describe("autocomplete suggestions", () => {
  it("returns a contact with multiple car numbers when one matches", () => {
    const contacts: Contact[] = [
      {
        id: "1",
        firstName: "Maya",
        lastName: "Levi",
        idNumber: "123456789",
        phone: "0501234567",
        company: "Logistics",
        carNumbers: ["ABC123", "XYZ456"],
      },
    ];

    const settings = {
      ...DEFAULT_SETTINGS,
      autocompleteFields: ["carNumber"],
      matchMode: "prefix",
      caseSensitive: false,
    };

    const suggestions = getSuggestions("ABC", "carNumber", contacts, settings);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].carNumbers).toContain("ABC123");
  });

  it("allows the same car number to match multiple different contacts", () => {
    const contacts: Contact[] = [
      {
        id: "1",
        firstName: "Avi",
        lastName: "Cohen",
        idNumber: "111111111",
        phone: "0501111111",
        company: "Acme",
        carNumbers: ["SAME123"],
      },
      {
        id: "2",
        firstName: "Dana",
        lastName: "Mizrahi",
        idNumber: "222222222",
        phone: "0502222222",
        company: "Beta",
        carNumbers: ["SAME123"],
      },
    ];

    const settings = {
      ...DEFAULT_SETTINGS,
      autocompleteFields: ["carNumber"],
      matchMode: "substring",
      caseSensitive: false,
    };

    const suggestions = getSuggestions("SAME123", "carNumber", contacts, settings);

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((c) => c.firstName)).toEqual(["Avi", "Dana"]);
  });
});

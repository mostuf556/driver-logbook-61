import { describe, expect, it } from "vitest";
import { getSuggestions, upsertContactFromReport, contactFullName } from "./contacts";
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
      autocompleteFields: ["carNumber"] as const,
      matchMode: "prefix",
      caseSensitive: false,
    } as any;

    const suggestions = getSuggestions("carNumber", "ABC", contacts, settings);

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
      autocompleteFields: ["carNumber"] as const,
      matchMode: "substring",
      caseSensitive: false,
    } as any;

    const suggestions = getSuggestions("carNumber", "SAME123", contacts, settings);

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((c) => c.firstName)).toEqual(["Avi", "Dana"]);
  });
});

describe("upsertContactFromReport and utilities", () => {
  it("upserts a new contact when autoUpdate enabled and report has carNumber", () => {
    const contacts: any[] = [];
    const report: any = {
      firstName: "Yossi",
      lastName: "Katz",
      idNumber: "333333333",
      phone: "0503333333",
      company: "Gamma",
      carNumber: "NEW123",
    };
    const settings: any = {
      autoUpdateContactsOnSave: true,
      contactFields: ["firstName", "lastName", "idNumber", "phone", "company", "carNumbers"],
      contactUpsertKey: "idNumber",
    };
    const next = upsertContactFromReport(contacts, report, settings);
    expect(next.length).toBe(1);
    expect(next[0].carNumbers).toContain("NEW123");
  });

  it("merges carNumbers into existing contact by phone", () => {
    const contacts: any[] = [
      { id: "1", firstName: "Ana", lastName: "Lee", phone: "0509999999", carNumbers: ["OLD1"] },
    ];
    const report: any = { phone: "0509999999", carNumber: "NEW2" };
    const settings: any = {
      autoUpdateContactsOnSave: true,
      contactFields: ["phone", "carNumbers"],
      contactUpsertKey: "phone",
    };
    const next = upsertContactFromReport(contacts, report, settings);
    expect(next[0].carNumbers).toEqual(expect.arrayContaining(["OLD1", "NEW2"]));
  });

  it("contactFullName joins names correctly", () => {
    const fn = contactFullName({ firstName: "A", lastName: "B" });
    expect(fn).toBe("A B");
    expect(contactFullName({ firstName: "Solo", lastName: "" })).toBe("Solo");
  });
});

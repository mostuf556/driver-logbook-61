import { uid } from "./storage";
import type { AppSettings, AutocompleteField, Contact, DriverReport } from "./types";

export function upsertContactFromReport(
  contacts: Contact[],
  r: DriverReport,
  s: AppSettings,
): Contact[] {
  if (!s.autoUpdateContactsOnSave) return contacts;
  const fields = s.contactFields;
  const candidate: Contact = {
    id: uid(),
    firstName: fields.includes("firstName") ? r.firstName : "",
    lastName: fields.includes("lastName") ? r.lastName : "",
    idNumber: fields.includes("idNumber") ? r.idNumber : "",
    phone: fields.includes("phone") ? r.phone : "",
    company: fields.includes("company") ? r.company : "",
  };
  const findIdx = () => {
    switch (s.contactUpsertKey) {
      case "idNumber":
        return candidate.idNumber
          ? contacts.findIndex((c) => c.idNumber === candidate.idNumber)
          : -1;
      case "phone":
        return candidate.phone ? contacts.findIndex((c) => c.phone === candidate.phone) : -1;
      case "name+company":
        return contacts.findIndex(
          (c) =>
            c.firstName === candidate.firstName &&
            c.lastName === candidate.lastName &&
            c.company === candidate.company,
        );
    }
  };
  const idx = findIdx();
  if (idx >= 0) {
    const merged = { ...contacts[idx] };
    (Object.keys(candidate) as (keyof Contact)[]).forEach((k) => {
      if (k === "id") return;
      const v = candidate[k];
      if (v) (merged as Record<string, string>)[k] = v;
    });
    const next = [...contacts];
    next[idx] = merged;
    return next;
  }
  if (
    !candidate.firstName &&
    !candidate.lastName &&
    !candidate.idNumber &&
    !candidate.phone &&
    !candidate.company
  ) {
    return contacts;
  }
  return [...contacts, candidate];
}

export function getSuggestions(
  field: AutocompleteField,
  query: string,
  contacts: Contact[],
  s: AppSettings,
): Contact[] {
  if (!s.autocompleteEnabled) return [];
  if (!s.autocompleteFields.includes(field)) return [];
  if (query.length < s.autocompleteMinChars) return [];

  // Map autocomplete field → contact key. Fields not in contacts return [].
  let sourceKey: keyof Contact;
  switch (field) {
    case "firstName": sourceKey = "firstName"; break;
    case "lastName": sourceKey = "lastName"; break;
    case "idNumber": sourceKey = "idNumber"; break;
    case "phone": sourceKey = "phone"; break;
    case "company": sourceKey = "company"; break;
    default: return [];
  }

  const q = s.caseSensitive ? query : query.toLowerCase();
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const c of contacts) {
    const val = (c[sourceKey] || "") as string;
    if (!val) continue;
    const cmp = s.caseSensitive ? val : val.toLowerCase();
    const match = s.matchMode === "prefix" ? cmp.startsWith(q) : cmp.includes(q);
    if (!match) continue;
    const dedupKey = val + "|" + c.company + "|" + c.idNumber + "|" + c.firstName + c.lastName;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    out.push(c);
    if (out.length >= s.autocompleteMaxSuggestions) break;
  }
  return out;
}

export function contactFullName(c: Pick<Contact, "firstName" | "lastName">): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}
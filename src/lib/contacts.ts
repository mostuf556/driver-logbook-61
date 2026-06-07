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
    driverName: fields.includes("driverName") ? r.driverName : "",
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
          (c) => c.driverName === candidate.driverName && c.company === candidate.company,
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
    !candidate.driverName &&
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

  const sourceKey: keyof Contact =
    field === "driverName"
      ? "driverName"
      : field === "idNumber"
        ? "idNumber"
        : field === "phone"
          ? "phone"
          : field === "company"
            ? "company"
            : field === "carNumber"
              ? "driverName" // no carNumber stored in contacts
              : field === "approverName"
                ? "driverName"
                : "driverName";

  // carNumber / approverName / guardName are NOT in contacts, return [].
  if (field === "carNumber" || field === "approverName" || field === "guardName") return [];

  const q = s.caseSensitive ? query : query.toLowerCase();
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const c of contacts) {
    const val = (c[sourceKey] || "") as string;
    if (!val) continue;
    const cmp = s.caseSensitive ? val : val.toLowerCase();
    const match = s.matchMode === "prefix" ? cmp.startsWith(q) : cmp.includes(q);
    if (!match) continue;
    const dedupKey = val + "|" + c.company + "|" + c.idNumber;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    out.push(c);
    if (out.length >= s.autocompleteMaxSuggestions) break;
  }
  return out;
}
import type { AppSettings } from "./types";

export function validatePhone(phone: string, s: AppSettings): string | null {
  if (!phone) return s.requirePhone ? "טלפון חובה" : null;
  const normalized = phone.replace(/-/g, "");
  if (!/^[\d+\-]+$/.test(phone)) return "טלפון חייב לכלול ספרות, + או -";
  if (normalized.length < s.phoneMinLength) return `טלפון קצר מדי (מינ׳ ${s.phoneMinLength})`;
  if (normalized.length > s.phoneMaxLength) return `טלפון ארוך מדי (מקס׳ ${s.phoneMaxLength})`;
  const prefixes = s.phoneAllowedPrefixes
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (prefixes.length && !prefixes.some((p) => phone.startsWith(p))) {
    return `טלפון חייב להתחיל ב-${prefixes.join(" / ")}`;
  }
  return null;
}

function israeliIdValid(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function validateIdNumber(id: string, s: AppSettings): string | null {
  if (!id) return s.requireIdNumber ? "ת.ז. חובה" : null;
  if (!/^\d+$/.test(id)) return "ת.ז. ספרות בלבד";
  if (id.length !== s.idNumberLength) return `ת.ז. חייבת להיות ${s.idNumberLength} ספרות`;
  if (s.validateIsraeliId && !israeliIdValid(id)) return "ת.ז. לא תקינה";
  return null;
}

export function validateCarNumber(car: string, s: AppSettings): string | null {
  if (!car) return s.requireCarNumber ? "מספר רכב חובה" : null;
  // Ignore hyphens & whitespace when counting plate length.
  const len = car.replace(/[-\s]/g, "").length;
  if (len < s.carNumberMinLength) return `מספר רכב קצר מדי`;
  if (len > s.carNumberMaxLength) return `מספר רכב ארוך מדי`;
  try {
    const re = new RegExp(s.carNumberAllowedChars);
    if (!re.test(car)) return "תווים לא חוקיים במספר הרכב";
  } catch {
    /* ignore bad regex */
  }
  return null;
}

/** Strip hyphens, spaces, and dots so plates can be searched by partial digits. */
export function normalizePlate(s: string): string {
  return (s || "").replace(/[-\s.]/g, "").toLowerCase();
}
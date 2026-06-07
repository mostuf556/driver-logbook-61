import { uid } from "./storage";
import { nowHHMM, todayISO } from "./time";
import type { AppSettings, Contact, DriverReport } from "./types";

const FIRST = ["דוד", "משה", "יוסי", "אבי", "רון", "שלומי", "אמיר", "דני", "ניר", "אורי", "איתי", "תומר"];
const LAST = ["כהן", "לוי", "מזרחי", "פרץ", "אזולאי", "ביטון", "דהן", "פנחס", "אוחיון", "חדד", "פרידמן"];
const COMPANIES = ["דליפה בעמ", "אלקטרה", "שופרסל", "אמזון", "פרטי", "DHL"];
const APPROVERS = ["מנהל שכבה", "אורי", "שירה", "דוד"];
const GUARDS = ["שומר ראשי", "ערן", "מאיר", "יוני"];

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
function digits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}
function israeliId(): string {
  const base = digits(8);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let v = Number(base[i]) * ((i % 2) + 1);
    if (v > 9) v -= 9;
    sum += v;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}
function plate(): string {
  // 3-2-3 or 2-3-2 patterns
  const a = digits(3), b = digits(2), c = digits(3);
  return `${a}-${b}-${c}`;
}
function phone(): string {
  return "05" + String(Math.floor(Math.random() * 9)) + "-" + digits(7).replace(/(.{3})/, "$1");
}

export function randomReport(s: AppSettings): DriverReport {
  return {
    id: uid(),
    date: todayISO(),
    firstName: pick(FIRST),
    lastName: pick(LAST),
    idNumber: israeliId(),
    phone: "05" + digits(8),
    carNumber: plate(),
    entryTime: nowHHMM(s.roundTimesToMinutes),
    exitTime: null,
    approverName: pick(APPROVERS),
    company: pick(COMPANIES),
    guardName: pick(GUARDS),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function randomContact(): Contact {
  return {
    id: uid(),
    firstName: pick(FIRST),
    lastName: pick(LAST),
    idNumber: israeliId(),
    phone: phone(),
    company: pick(COMPANIES),
  };
}
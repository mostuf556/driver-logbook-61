import type { AppSettings } from "./types";

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowHHMM(roundMinutes: number = 1): string {
  const d = new Date();
  let h = d.getHours();
  let m = d.getMinutes();
  if (roundMinutes > 1) {
    m = Math.round(m / roundMinutes) * roundMinutes;
    if (m === 60) {
      m = 0;
      h = (h + 1) % 24;
    }
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseHM(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm || "");
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

export function computeTotalMinutes(
  entry: string,
  exit: string | null,
  allowOvernight: boolean,
): number | null {
  if (!exit) return null;
  const e = parseHM(entry);
  const x = parseHM(exit);
  if (e == null || x == null) return null;
  let delta = x - e;
  if (delta < 0) {
    if (allowOvernight) delta += 24 * 60;
    else return null;
  }
  return delta;
}

export function formatTotal(mins: number | null): string {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function liveOnSiteMinutes(date: string, entry: string): number {
  const e = parseHM(entry);
  if (e == null) return 0;
  const now = new Date();
  const [y, mo, d] = date.split("-").map(Number);
  const start = new Date(y, (mo || 1) - 1, d || 1, Math.floor(e / 60), e % 60).getTime();
  return Math.max(0, Math.floor((now.getTime() - start) / 60000));
}

export function formatDate(iso: string, fmt: AppSettings["dateFormat"]): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  switch (fmt) {
    case "dd/mm/yyyy":
      return `${d}/${m}/${y}`;
    case "dd.mm.yyyy":
      return `${d}.${m}.${y}`;
    case "yyyy-mm-dd":
    default:
      return iso;
  }
}

export function filenameDate(pattern: string, iso: string): string {
  const [y, m, d] = iso.split("-");
  return pattern.replace(/dd/g, d).replace(/mm/g, m).replace(/yyyy/g, y);
}

import { logEvent } from "./error-log";
import type { PendingRequest } from "./types";

const KEY = "pending_requests";
const NS_KEY = "driver-report:namespace";
const COOLDOWN_KEY = "driver-report:guest-last-submit";

function ns(): string {
  if (typeof window === "undefined") return "driver-report";
  return window.localStorage.getItem(NS_KEY) || "driver-report";
}

function k(): string {
  return `${ns()}:${KEY}`;
}

export function loadPendingRequests(): PendingRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(k());
    return raw ? (JSON.parse(raw) as PendingRequest[]) : [];
  } catch {
    return [];
  }
}

export function savePendingRequests(list: PendingRequest[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k(), JSON.stringify(list));
  window.dispatchEvent(new Event("pending-requests-change"));
}

export function addPendingRequest(req: PendingRequest): void {
  const list = loadPendingRequests();
  savePendingRequests([req, ...list]);
  window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  const name = [req.firstName, req.lastName].filter(Boolean).join(" ") || "—";
  logEvent(
    "guest-request",
    `New entrance request: ${name}${req.carNumber ? ` · ${req.carNumber}` : ""}${req.company ? ` (${req.company})` : ""}`,
    "/guest",
  );
}

export function removePendingRequest(id: string): void {
  savePendingRequests(loadPendingRequests().filter((r) => r.id !== id));
}

export function guestCooldownRemaining(cooldownSeconds: number): number {
  if (typeof window === "undefined") return 0;
  const last = Number(window.localStorage.getItem(COOLDOWN_KEY) || 0);
  if (!last) return 0;
  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
}
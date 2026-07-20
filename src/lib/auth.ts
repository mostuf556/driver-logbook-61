// Client-side password gate (localStorage-only app; not a security guarantee).
// Stores a SHA-256 hash of the password. Unlock lives in sessionStorage so
// refresh keeps you unlocked but closing the tab locks again.

const PW_HASH_KEY = "driver-report:pw-hash";
const UNLOCK_KEY = "driver-report:unlocked";

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hasPassword(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(PW_HASH_KEY);
}

export async function setPassword(pw: string): Promise<void> {
  const hash = await hashPassword(pw);
  window.localStorage.setItem(PW_HASH_KEY, hash);
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
  window.dispatchEvent(new Event("auth-change"));
}

/** Store the hash without granting a session unlock (used for seeding defaults). */
export async function seedPassword(pw: string): Promise<void> {
  const hash = await hashPassword(pw);
  window.localStorage.setItem(PW_HASH_KEY, hash);
  // intentionally does NOT set UNLOCK_KEY
}

export function clearPassword(): void {
  window.localStorage.removeItem(PW_HASH_KEY);
  window.sessionStorage.removeItem(UNLOCK_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export async function unlock(pw: string): Promise<boolean> {
  const stored = window.localStorage.getItem(PW_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPassword(pw);
  if (hash !== stored) return false;
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
  window.dispatchEvent(new Event("auth-change"));
  return true;
}

export function lock(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UNLOCK_KEY);
  window.dispatchEvent(new Event("auth-change"));
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
}
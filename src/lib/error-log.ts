const KEY = "driver-report:error-log";
const MAX = 200;

export interface LoggedError {
  id: string;
  at: string;
  source: string;
  message: string;
  stack?: string;
  url?: string;
}

export function loadErrorLog(): LoggedError[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(list: LoggedError[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function logError(source: string, err: unknown, url?: string) {
  if (typeof window === "undefined") return;
  const e = err as Error;
  const entry: LoggedError = {
    id: Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
    source,
    message: e?.message || String(err),
    stack: e?.stack,
    url: url || window.location.href,
  };
  save([entry, ...loadErrorLog()]);
}

export function logEvent(source: string, message: string, url?: string) {
  if (typeof window === "undefined") return;
  const entry: LoggedError = {
    id: Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
    source,
    message,
    url: url || window.location.href,
  };
  save([entry, ...loadErrorLog()]);
}

export function clearErrorLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

let installed = false;
export function installErrorListeners() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => {
    logError("window.error", e.error ?? new Error(e.message));
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError("unhandledrejection", e.reason);
  });
}

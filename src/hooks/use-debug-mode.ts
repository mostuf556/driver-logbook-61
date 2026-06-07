import { useEffect, useState } from "react";

const STORAGE_KEY = "driver-report:debug-on";

function readDebugState(): boolean {
  if (typeof window === "undefined") return true;
  // Hash takes priority when present
  if (window.location.hash.toLowerCase().includes("debug=false")) return false;
  if (window.location.hash.toLowerCase().includes("debug")) return true;
  // Otherwise fall back to localStorage; default is ON (null → true)
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "1";
}

export function useDebugMode(): boolean {
  const [on, setOn] = useState(true); // default on for SSR

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => setOn(readDebugState());
    sync();

    window.addEventListener("hashchange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return on;
}

export function setDebugFlag(on: boolean) {
  if (typeof window === "undefined") return;

  // Persist to localStorage
  window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");

  // Sync URL hash: set #debug or remove it
  if (on) {
    if (!window.location.hash.toLowerCase().includes("debug")) {
      history.replaceState(null, "", window.location.pathname + window.location.search + "#debug");
      window.dispatchEvent(new Event("hashchange"));
    }
  } else {
    if (window.location.hash.toLowerCase().includes("debug")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.dispatchEvent(new Event("hashchange"));
    }
  }

  window.dispatchEvent(new StorageEvent("storage"));
}

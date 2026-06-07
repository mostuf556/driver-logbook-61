import { useEffect, useState } from "react";

export function useDebugMode(): boolean {
  const [hashOn, setHashOn] = useState(false);
  const [toggleOn, setToggleOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkHash = () => setHashOn(window.location.hash.toLowerCase().includes("debug"));
    checkHash();
    window.addEventListener("hashchange", checkHash);

    const checkStorage = () => {
      try {
        setToggleOn(window.localStorage.getItem("driver-report:debug-on") === "1");
      } catch { /* ignore */ }
    };
    checkStorage();
    window.addEventListener("storage", checkStorage);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("storage", checkStorage);
    };
  }, []);

  return hashOn || toggleOn;
}

export function setDebugFlag(on: boolean) {
  if (typeof window === "undefined") return;

  // Sync localStorage
  if (on) window.localStorage.setItem("driver-report:debug-on", "1");
  else window.localStorage.removeItem("driver-report:debug-on");

  // Sync URL hash
  if (on) {
    if (!window.location.hash.toLowerCase().includes("debug")) {
      window.location.hash = "debug";
    }
  } else {
    if (window.location.hash.toLowerCase().includes("debug")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      window.dispatchEvent(new Event("hashchange"));
    }
  }

  window.dispatchEvent(new StorageEvent("storage"));
}

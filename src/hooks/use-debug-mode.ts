import { useEffect, useState } from "react";
import { useAppData } from "./use-app-data";

export function useDebugMode(): boolean {
  const { settings } = useAppData();
  const [hashOn, setHashOn] = useState(false);
  const [toggleOn, setToggleOn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setHashOn(window.location.hash.toLowerCase().includes("debug"));
    check();
    window.addEventListener("hashchange", check);
    try {
      setToggleOn(window.localStorage.getItem("driver-report:debug-on") === "1");
    } catch {
      /* ignore */
    }
    const onStorage = () => {
      setToggleOn(window.localStorage.getItem("driver-report:debug-on") === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return hashOn || (settings.showDebugToggle && toggleOn);
}

export function setDebugFlag(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem("driver-report:debug-on", "1");
  else window.localStorage.removeItem("driver-report:debug-on");
  window.dispatchEvent(new StorageEvent("storage"));
}
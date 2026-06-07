import { useEffect } from "react";
import type { AppSettings } from "@/lib/types";

export function useTheme(theme: AppSettings["theme"]) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark", "theme-blue");
    let resolved = theme;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "dark") root.classList.add("dark");
    if (resolved === "blue") root.classList.add("theme-blue");
  }, [theme]);
}
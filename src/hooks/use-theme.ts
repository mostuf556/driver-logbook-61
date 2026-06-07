import { useEffect } from "react";
import type { AppSettings } from "@/lib/types";

const THEME_CLASSES = ["dark", "theme-blue", "theme-green", "theme-warm"] as const;

export function useTheme(theme: AppSettings["theme"]) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    THEME_CLASSES.forEach((c) => root.classList.remove(c));

    let resolved = theme;
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "dark") root.classList.add("dark");
    else if (resolved === "blue") root.classList.add("theme-blue");
    else if (resolved === "green") root.classList.add("theme-green");
    else if (resolved === "warm") root.classList.add("theme-warm");
  }, [theme]);
}

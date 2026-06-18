import { useEffect, useState } from "react";
import { checkOpenRouterKeyAvailability } from "@/lib/openrouter";
import type { AppSettings } from "@/lib/types";

export type KeyStatus = "unknown" | "checking" | "valid" | "invalid" | "missing";

/** Validates OpenRouter key(s) when settings change. Result is cached per key. */
export function useOpenRouterKeyStatus(settings: AppSettings): KeyStatus {
  const [status, setStatus] = useState<KeyStatus>("unknown");

  const keys = [
    ...(settings.openRouterApiKeys ?? []).filter(Boolean),
    settings.openRouterApiKey,
  ].filter(Boolean);
  const fingerprint = keys.join("|") + "::" + settings.openRouterBaseUrl;

  useEffect(() => {
    if (!keys.length) {
      setStatus("missing");
      return;
    }
    let cancelled = false;
    setStatus("checking");
    checkOpenRouterKeyAvailability(settings)
      .then(() => {
        if (!cancelled) setStatus("valid");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  return status;
}
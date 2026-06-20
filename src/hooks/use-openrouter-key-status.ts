import { useEffect, useState } from "react";
import { countValidOpenRouterKeys } from "@/lib/openrouter";
import type { AppSettings } from "@/lib/types";

export type KeyStatus = "unknown" | "checking" | "valid" | "invalid" | "missing";

export interface KeyStatusInfo {
  status: KeyStatus;
  validCount: number;
  totalCount: number;
}

/** Validates OpenRouter key(s) when settings change. Returns per-key counts. */
export function useOpenRouterKeyStatus(settings: AppSettings): KeyStatusInfo {
  const [info, setInfo] = useState<KeyStatusInfo>({
    status: "unknown",
    validCount: 0,
    totalCount: 0,
  });

  const keys = [
    ...(settings.openRouterApiKeys ?? []).filter(Boolean),
    settings.openRouterApiKey,
  ].filter(Boolean);
  const lastTested = Object.values(settings.openRouterApiKeyTests ?? {}).join("|");
  const fingerprint = `${keys.join("|")}::${settings.openRouterBaseUrl}::${settings.openRouterModel}::${lastTested}`;

  useEffect(() => {
    if (!keys.length) {
      setInfo({ status: "missing", validCount: 0, totalCount: 0 });
      return;
    }
    let cancelled = false;
    setInfo((prev) => ({ ...prev, status: "checking", totalCount: keys.length }));
    countValidOpenRouterKeys(settings)
      .then(({ valid, total }) => {
        if (cancelled) return;
        setInfo({
          status: valid > 0 ? "valid" : "invalid",
          validCount: valid,
          totalCount: total,
        });
      })
      .catch(() => {
        if (!cancelled)
          setInfo({ status: "invalid", validCount: 0, totalCount: keys.length });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  return info;
}

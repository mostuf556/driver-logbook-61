import type { AppSettings } from "./types";
import { logEvent } from "./error-log";

const TOKEN_LOG_KEY = "driver-report:openrouter-tokens";
const RR_INDEX_KEY = "driver-report:openrouter-rr-index";

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TokenLogEntry {
  at: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export function loadTokenLog(): TokenLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TOKEN_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function appendTokenLog(entry: TokenLogEntry) {
  if (typeof window === "undefined") return;
  const log = loadTokenLog();
  log.unshift(entry);
  window.localStorage.setItem(TOKEN_LOG_KEY, JSON.stringify(log.slice(0, 500)));
}

export function clearTokenLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_LOG_KEY);
}

export function totalTokensUsed(): number {
  return loadTokenLog().reduce((s, e) => s + e.total_tokens, 0);
}

/** Returns all configured API keys (multi-key list takes priority over single key). */
function allApiKeys(s: AppSettings): string[] {
  const multi = (s.openRouterApiKeys ?? []).filter(Boolean);
  if (multi.length) return multi;
  if (s.openRouterApiKey) return [s.openRouterApiKey];
  return [];
}

/** Picks the next key using round-robin and advances the index. */
function nextApiKey(keys: string[]): string {
  if (keys.length === 1) return keys[0];
  let idx = 0;
  try {
    idx = parseInt(window.localStorage.getItem(RR_INDEX_KEY) || "0", 10) || 0;
  } catch {
    /* ignore */
  }
  const key = keys[idx % keys.length];
  try {
    window.localStorage.setItem(RR_INDEX_KEY, String((idx + 1) % keys.length));
  } catch {
    /* ignore */
  }
  return key;
}

export async function extractPlateNumber(
  imageDataUrl: string,
  s: AppSettings,
): Promise<{ plate: string; usage: TokenUsage | null }> {
  const result = await extractImageText(imageDataUrl, s.ocrPrompt, s);
  return { plate: result.text.trim().replace(/[^\w\d-]/g, ""), usage: result.usage };
}

export async function extractImageText(
  imageDataUrl: string,
  prompt: string,
  s: AppSettings,
): Promise<{ text: string; usage: TokenUsage | null }> {
  const keys = allApiKeys(s);
  if (!keys.length) throw new Error("חסר מפתח OpenRouter בהגדרות");
  const apiKey = nextApiKey(keys);
  const res = await fetch(`${s.openRouterBaseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: s.openRouterModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const txt: string = data?.choices?.[0]?.message?.content ?? "";
  const usage: TokenUsage | null = data?.usage ?? null;

  if (usage) {
    appendTokenLog({
      at: new Date().toISOString(),
      model: s.openRouterModel,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    });
  }

  return { text: txt.trim(), usage };
}

export async function validateOpenRouterApiKey(url: string, apiKey: string, model: string) {
  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: "validate key" }],
      },
    ],
    max_tokens: 1,
  };

  const endpoint = `${url.replace(/\/+$/, "")}/chat/completions`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = typeof res.json === "function" ? await res.json() : null;
  } catch {
    data = null;
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${String(text).slice(0, 200)}`);
  }

  if (data && typeof data === "object" && "error" in data) {
    const error = (data as Record<string, unknown>).error;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as Record<string, unknown>).message)
        : JSON.stringify(error);
    throw new Error(message || "OpenRouter key validation failed");
  }

  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as Record<string, unknown>).choices)
  ) {
    throw new Error("Invalid OpenRouter response");
  }

  return true;
}

export async function checkOpenRouterKeyAvailability(s: AppSettings): Promise<boolean> {
  const keys = allApiKeys(s);
  if (!keys.length) throw new Error("No OpenRouter API key configured");
  const url = `${s.openRouterBaseUrl.replace(/\/+$/, "")}/models`;

  const results = await Promise.allSettled(
    keys.map((apiKey) => validateOpenRouterApiKey(url, apiKey, s.openRouterModel)),
  );
  const validCount = results.filter((r) => r.status === "fulfilled").length;
  const invalidDetails = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return `key[${index + 1}]=ok`;
    }
    const reason = result.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    return `key[${index + 1}]=${message}`;
  });

  if (validCount === 0) {
    const message = `OpenRouter key validation failed for ${keys.length} key(s)`;
    logEvent("openrouter.key-check", `${message}: ${invalidDetails.join("; ")}`);
    throw new Error(message);
  }

  logEvent(
    "openrouter.key-check",
    `OpenRouter key validation succeeded for ${validCount}/${keys.length} key(s): ${invalidDetails.join("; ")}`,
  );
  return true;
}

/**
 * Validates each configured OpenRouter key in parallel and returns counts.
 * Never throws — failures are simply not counted as valid.
 */
export async function countValidOpenRouterKeys(
  s: AppSettings,
): Promise<{ valid: number; total: number }> {
  const keys = allApiKeys(s);
  if (!keys.length) return { valid: 0, total: 0 };
  const results = await Promise.allSettled(
    keys.map((apiKey) =>
      validateOpenRouterApiKey(s.openRouterBaseUrl, apiKey, s.openRouterModel),
    ),
  );
  const valid = results.filter((r) => r.status === "fulfilled").length;
  return { valid, total: keys.length };
}

export async function fileToDownscaledDataUrl(file: File, maxMB: number): Promise<string> {
  const limit = maxMB * 1024 * 1024;
  const readAsDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  if (file.size <= limit) return readAsDataUrl(file);
  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.sqrt(limit / file.size);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

import type { AppSettings } from "./types";

const TOKEN_LOG_KEY = "driver-report:openrouter-tokens";

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

export async function extractPlateNumber(
  imageDataUrl: string,
  s: AppSettings,
): Promise<{ plate: string; usage: TokenUsage | null }> {
  if (!s.openRouterApiKey) throw new Error("חסר מפתח OpenRouter בהגדרות");
  const res = await fetch(`${s.openRouterBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${s.openRouterApiKey}`,
    },
    body: JSON.stringify({
      model: s.openRouterModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: s.ocrPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 50,
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

  return { plate: txt.trim().replace(/[^\w\d-]/g, ""), usage };
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

import { storage } from './storage';
import type { AppSettings, TokenLogEntry } from './types';

function allApiKeys(s: AppSettings): string[] {
  const multi = (s.openRouterApiKeys ?? []).filter(Boolean);
  if (multi.length) return multi;
  if (s.openRouterApiKey) return [s.openRouterApiKey];
  return [];
}

async function nextApiKey(keys: string[]): Promise<string> {
  if (keys.length === 1) return keys[0];
  const idx = await storage.getRRIndex();
  const key = keys[idx % keys.length];
  await storage.setRRIndex((idx + 1) % keys.length);
  return key;
}

export async function extractPlateNumber(
  imageDataUrl: string,
  s: AppSettings,
): Promise<{ plate: string }> {
  const keys = allApiKeys(s);
  if (!keys.length) throw new Error('חסר מפתח OpenRouter בהגדרות');
  const apiKey = await nextApiKey(keys);

  const res = await fetch(`${s.openRouterBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: s.openRouterModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: s.ocrPrompt },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: 50,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const txt: string = data?.choices?.[0]?.message?.content ?? '';
  const usage = data?.usage;

  if (usage) {
    const entry: TokenLogEntry = {
      at: new Date().toISOString(),
      model: s.openRouterModel,
      prompt_tokens: usage.prompt_tokens ?? 0,
      completion_tokens: usage.completion_tokens ?? 0,
      total_tokens: usage.total_tokens ?? 0,
    };
    await storage.appendTokenLog(entry);
  }

  const plate = txt.trim().replace(/[^\w\d-]/g, '');
  return { plate };
}

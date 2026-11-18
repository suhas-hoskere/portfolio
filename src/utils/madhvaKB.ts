/**
 * Live Google Sheets Knowledge Base loader for Madhva.
 * Silently fetches read-only Q&A rows from the `MadhvaKB` tab via the existing
 * VITE_SHEETS_WEBHOOK_URL (?action=kb), allowing Suhas to teach Madhva new answers
 * directly inside Google Sheets with zero code edits and zero redeploys.
 */

export interface CustomKBEntry {
  keywords: string[];
  answer: string;
  headline?: string;
  suggestions?: string[];
}

const MAX_KB_ITEMS = 200;

let cachedEntries: CustomKBEntry[] = [];
let fetchPromise: Promise<void> | null = null;

function getWebhookUrl(): string {
  const raw = ((import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined) || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? raw : '';
  } catch {
    return '';
  }
}

export function getCustomKBEntries(): readonly CustomKBEntry[] {
  return cachedEntries;
}

export function preloadMadhvaKB(): void {
  if (typeof window === 'undefined' || fetchPromise) return;
  const baseUrl = getWebhookUrl();
  if (!baseUrl) return;

  const sep = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${sep}action=kb`;

  fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      window.clearTimeout(timer);
      if (!res.ok) return;

      const data = (await res.json()) as {
        ok?: boolean;
        items?: Array<{
          keywords?: unknown;
          answer?: unknown;
          headline?: unknown;
          suggestions?: unknown;
        }>;
      };

      if (!data.ok || !Array.isArray(data.items)) return;

      const parsed: CustomKBEntry[] = [];
      for (const rawItem of data.items.slice(0, MAX_KB_ITEMS)) {
        const kwRaw = typeof rawItem.keywords === 'string' ? rawItem.keywords : '';
        const ansRaw = typeof rawItem.answer === 'string' ? rawItem.answer.trim() : '';
        if (!kwRaw.trim() || !ansRaw) continue;

        const keywords = kwRaw
          .split(/[,|\n]/)
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length > 0);
        if (keywords.length === 0) continue;

        const headline =
          typeof rawItem.headline === 'string' && rawItem.headline.trim()
            ? rawItem.headline.trim().slice(0, 120)
            : undefined;

        const suggestions =
          typeof rawItem.suggestions === 'string' && rawItem.suggestions.trim()
            ? rawItem.suggestions
                .split(/[,|]/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .slice(0, 4)
            : undefined;

        parsed.push({
          keywords,
          answer: ansRaw.slice(0, 1200),
          headline,
          suggestions,
        });
      }

      cachedEntries = parsed;
    } catch {
      // Offline / Sheets unavailable — built-in Madhva knowledge continues seamlessly
    }
  })();
}

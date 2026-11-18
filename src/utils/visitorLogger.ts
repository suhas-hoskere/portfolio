/**
 * Strictly Anonymous, Non-PII Visitor, Engagement & Madhva Analytics Logger.
 * - Zero cookies, zero localStorage, zero raw IP, zero ISP, zero raw User-Agent, zero GPS.
 * - Sends coarse locale/device/display telemetry + engagement summary + Madhva Q&A logs
 *   to a Google Apps Script Web App URL configured via VITE_SHEETS_WEBHOOK_URL.
 * - Automatically redacts accidental emails/phone numbers inside Madhva queries before logging.
 */

interface CoarseGeo {
  city: string;
  region: string;
  country: string;
}

type PortfolioAction =
  | 'resume'
  | 'explore_journey'
  | 'audio'
  | 'madhva_open'
  | 'writing_browse';

const STAGE_NAMES = [
  '00 Home',
  '01 Education',
  '02 Writing',
  '03 Stack',
  '04 Projects',
  '05 Contact',
] as const;

// Purely ephemeral per-tab random tag kept in memory only (never stored in cookies/localStorage)
const sessionTag = Math.random().toString(36).slice(2, 10);

let initialized = false;
let visitStartMs = Date.now();
let cachedGeo: CoarseGeo = { city: '', region: '', country: '' };
let cachedDeviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';

// In-memory engagement state flushed on page exit
let maxScrollPct = 0;
let deepestStageIndex = 0;
let resumeDownloaded = false;
let exploreJourneyUsed = false;
let audioToggled = false;
let writingsBrowsed = 0;
let madhvaOpens = 0;
let madhvaQueriesCount = 0;
const projectsViewed = new Set<string>();
const linksClicked = new Set<string>();

let lastFlushSignature = '';

function getWebhookUrl(): string {
  return ((import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined) || '').trim();
}

function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\/|Opera/i.test(ua)) return 'Opera';
  if (/Brave/i.test(ua)) return 'Brave';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  return 'Other';
}

function detectDeviceType(ua: string): 'Mobile' | 'Tablet' | 'Desktop' {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    return 'Tablet';
  }
  if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

function extractReferrerDomain(ref: string): string {
  if (!ref) return 'Direct';
  try {
    return new URL(ref).hostname.replace(/^www\./, '') || 'Direct';
  } catch {
    return 'Direct';
  }
}

function getPageLoadMs(): number | '' {
  try {
    const navEntries = performance.getEntriesByType('navigation');
    const first = navEntries[0] as PerformanceNavigationTiming | undefined;
    if (first && first.loadEventEnd > 0) {
      return Math.round(first.loadEventEnd - first.startTime);
    }
    if (first && first.domContentLoadedEventEnd > 0) {
      return Math.round(first.domContentLoadedEventEnd - first.startTime);
    }
  } catch {
    // Performance API unavailable
  }
  return '';
}

/** Transiently look up coarse city/region/country without ever storing the IP address */
async function fetchCoarseGeo(): Promise<CoarseGeo> {
  const tryEndpoint = async (url: string): Promise<CoarseGeo | null> => {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, { signal: controller.signal });
      window.clearTimeout(timer);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        success?: boolean;
        error?: boolean;
        city?: string;
        region?: string;
        country?: string;
        country_name?: string;
      };
      if (data.success === false || data.error === true) return null;
      const country = data.country_name || data.country || '';
      if (!country && !data.city) return null;
      return {
        city: data.city || '',
        region: data.region || '',
        country,
      };
    } catch {
      return null;
    }
  };

  return (
    (await tryEndpoint('https://ipwho.is/')) ||
    (await tryEndpoint('https://ipapi.co/json/')) || {
      city: '',
      region: '',
      country: '',
    }
  );
}

/** Redact accidental emails or 10+ digit phone numbers so Madhva logs stay strictly non-PII */
function sanitizeQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, 300)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?\d[\s\-().]*){10,}/g, '[redacted-number]');
}

function postToSheets(payload: Record<string, unknown>, preferBeacon = false): void {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return;

  const body = JSON.stringify(payload);
  if (preferBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      if (navigator.sendBeacon(webhookUrl, blob)) return;
    } catch {
      // Fallback to keepalive fetch
    }
  }

  try {
    void fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
  } catch {
    // Silent failure — never affect visitor experience
  }
}

function buildEngagementFields() {
  const timeSpentSec = Math.max(1, Math.round((Date.now() - visitStartMs) / 1000));
  return {
    timeSpentSec,
    maxScrollPct,
    deepestSection: STAGE_NAMES[deepestStageIndex] || '00 Home',
    resumeDownloaded: resumeDownloaded ? 'Yes' : 'No',
    exploreJourneyUsed: exploreJourneyUsed ? 'Yes' : 'No',
    audioToggled: audioToggled ? 'Yes' : 'No',
    writingsBrowsed,
    projectsViewed: Array.from(projectsViewed).join(', '),
    linksClicked: Array.from(linksClicked).join(', '),
    madhvaOpens,
    madhvaQueriesCount,
  };
}

function flushEngagementUpdate(): void {
  if (!initialized || !getWebhookUrl()) return;
  const engagement = buildEngagementFields();
  const sig = JSON.stringify(engagement);
  if (sig === lastFlushSignature) return;
  lastFlushSignature = sig;

  postToSheets(
    {
      type: 'visit_update',
      sessionTag,
      ...engagement,
    },
    true
  );
}

export async function initVisitorAnalytics(): Promise<void> {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;
  visitStartMs = Date.now();

  const ua = navigator.userAgent || '';
  cachedDeviceType = detectDeviceType(ua);

  // Flush final engagement summary cleanly when leaving or backgrounding the tab
  window.addEventListener('pagehide', flushEngagementUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushEngagementUpdate();
    }
  });

  if (!getWebhookUrl()) return;

  const navExt = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  const now = new Date();
  const params = new URLSearchParams(window.location.search);
  cachedGeo = await fetchCoarseGeo();

  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  postToSheets({
    type: 'visit',
    sessionTag,
    istTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    timestampISO: now.toISOString(),
    city: cachedGeo.city,
    region: cachedGeo.region,
    country: cachedGeo.country,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    deviceType: cachedDeviceType,
    os: detectOS(ua),
    browser: detectBrowser(ua),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait',
    touchCapable: (navigator.maxTouchPoints || 0) > 0 ? 'Yes' : 'No',
    network: navExt.connection?.effectiveType || '',
    colorScheme: prefersDark ? 'dark' : 'light',
    reducedMotion: prefersReducedMotion ? 'Yes' : 'No',
    pageLoadMs: getPageLoadMs(),
    referrerDomain: extractReferrerDomain(document.referrer || ''),
    path: window.location.pathname + window.location.hash,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    ...buildEngagementFields(),
  });
}

export function trackScrollAndSection(scrollProgress: number, stageIndex: number): void {
  const pct = Math.min(100, Math.max(0, Math.round(scrollProgress * 100)));
  if (pct > maxScrollPct) maxScrollPct = pct;
  if (stageIndex > deepestStageIndex && stageIndex < STAGE_NAMES.length) {
    deepestStageIndex = stageIndex;
  }
}

export function trackPortfolioAction(action: PortfolioAction): void {
  switch (action) {
    case 'resume':
      resumeDownloaded = true;
      break;
    case 'explore_journey':
      exploreJourneyUsed = true;
      break;
    case 'audio':
      audioToggled = true;
      break;
    case 'madhva_open':
      madhvaOpens += 1;
      break;
    case 'writing_browse':
      writingsBrowsed += 1;
      break;
  }
}

export function trackProjectViewed(projectName: string): void {
  if (projectName) projectsViewed.add(projectName);
}

export function trackLinkClicked(label: string): void {
  if (label) linksClicked.add(label);
}

export function trackMadhvaInteraction(
  rawQuery: string,
  replyKind: string,
  replyHeadline: string
): void {
  const query = sanitizeQuery(rawQuery);
  if (!query) return;

  madhvaQueriesCount += 1;
  const now = new Date();

  postToSheets({
    type: 'madhva',
    istTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    timestampISO: now.toISOString(),
    sessionTag,
    query,
    replyKind,
    replyHeadline,
    status: replyKind === 'fallback' ? 'FALLBACK' : 'MATCHED',
    city: cachedGeo.city,
    country: cachedGeo.country,
    deviceType: cachedDeviceType,
  });
}

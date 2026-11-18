/**
 * Strictly Anonymous, Zero-Third-Party Visitor, Engagement & Madhva Analytics Logger.
 * - Zero cookies, zero localStorage, zero IP lookup, zero ISP, zero raw User-Agent, zero GPS.
 * - Uses only local browser metadata (Timezone, Language, Device, OS, Browser, Screen, Referrer)
 *   + engagement summary + Madhva Q&A logs sent to VITE_SHEETS_WEBHOOK_URL.
 * - Neutralizes Google Sheets formula injection and redacts accidental emails/phone numbers.
 */

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

const MAX_MADHVA_LOGS_PER_SESSION = 40;

// Ephemeral per-tab cryptographic key used only by Apps Script CacheService to update the same row
const sessionTag =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let initialized = false;
let visitStartMs = Date.now();
let cachedDeviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
let cachedTimezone = 'Unknown';

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
  const raw = ((import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined) || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? raw : '';
  } catch {
    return '';
  }
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

function formatIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/** Prevent Google Sheets formula/CSV injection and redact accidental emails/phone numbers */
function neutralizeFormula(val: string): string {
  return /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
}

function sanitizeQuery(raw: string): string {
  const cleaned = raw
    .trim()
    .slice(0, 300)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?\d[\s\-().]*){10,}/g, '[redacted-number]');
  return neutralizeFormula(cleaned);
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
    projectsViewed: projectsViewed.size > 0 ? Array.from(projectsViewed).join(', ') : 'None',
    linksClicked: linksClicked.size > 0 ? Array.from(linksClicked).join(', ') : 'None',
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

export function initVisitorAnalytics(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;
  visitStartMs = Date.now();

  const ua = navigator.userAgent || '';
  cachedDeviceType = detectDeviceType(ua);
  cachedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

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
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  postToSheets({
    type: 'visit',
    sessionTag,
    istTime: formatIST(now),
    timezone: cachedTimezone,
    language: navigator.language || 'Unknown',
    deviceType: cachedDeviceType,
    os: detectOS(ua),
    browser: detectBrowser(ua),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    orientation: window.innerWidth >= window.innerHeight ? 'Landscape' : 'Portrait',
    touchCapable: (navigator.maxTouchPoints || 0) > 0 ? 'Yes' : 'No',
    network: navExt.connection?.effectiveType ? navExt.connection.effectiveType.toUpperCase() : 'Unknown',
    colorScheme: prefersDark ? 'Dark' : 'Light',
    referrerDomain: extractReferrerDomain(document.referrer || ''),
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
  if (madhvaQueriesCount > MAX_MADHVA_LOGS_PER_SESSION) return;
  const now = new Date();

  postToSheets({
    type: 'madhva',
    istTime: formatIST(now),
    query,
    status: replyKind === 'fallback' ? 'FALLBACK' : 'MATCHED',
    replyKind: replyKind || 'general',
    replyHeadline: neutralizeFormula(replyHeadline || '—'),
    timezone: cachedTimezone,
    deviceType: cachedDeviceType,
  });
}

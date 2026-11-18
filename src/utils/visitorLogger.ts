/**
 * Lightweight, privacy-safe Google Sheets visitor logger.
 * Sends passive browser/system info + approximate IP location once per session
 * to a Google Apps Script Web App URL configured via VITE_SHEETS_WEBHOOK_URL.
 * Does nothing when the env var is not set.
 */

const SESSION_FLAG = 'sh_visitor_logged_v1';

interface GeoSnapshot {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
}

function detectOS(ua: string): string {
  if (/Windows NT 10\.0/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
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

async function fetchApproximateGeo(): Promise<GeoSnapshot> {
  const fallback: GeoSnapshot = {
    ip: '',
    city: '',
    region: '',
    country: '',
    isp: '',
  };
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      success?: boolean;
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
      connection?: { isp?: string; org?: string };
    };
    if (data.success === false) return fallback;
    return {
      ip: data.ip || '',
      city: data.city || '',
      region: data.region || '',
      country: data.country || '',
      isp: data.connection?.isp || data.connection?.org || '',
    };
  } catch {
    return fallback;
  }
}

export async function logVisitorToSheets(): Promise<void> {
  if (typeof window === 'undefined') return;

  const webhookUrl = (import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined)?.trim();
  if (!webhookUrl) return;

  try {
    if (window.sessionStorage.getItem(SESSION_FLAG)) return;
    window.sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    // sessionStorage unavailable (private mode) — continue gracefully
  }

  const ua = navigator.userAgent || '';
  const navExt = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number };
  };

  const now = new Date();
  const params = new URLSearchParams(window.location.search);
  const geo = await fetchApproximateGeo();

  const payload = {
    timestampISO: now.toISOString(),
    istTime: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    path: window.location.pathname + window.location.hash,
    referrer: document.referrer || 'Direct',
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    city: geo.city,
    region: geo.region,
    country: geo.country,
    isp: geo.isp,
    ip: geo.ip,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    language: navigator.language || '',
    deviceType: detectDeviceType(ua),
    os: detectOS(ua),
    browser: detectBrowser(ua),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    cpuCores: navigator.hardwareConcurrency || '',
    memoryGB: navExt.deviceMemory || '',
    network: navExt.connection?.effectiveType || '',
    touchPoints: navigator.maxTouchPoints || 0,
    userAgent: ua,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Never disturb visitor UX if network/webhook fails
  }
}

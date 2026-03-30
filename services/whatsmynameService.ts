/**
 * KAVACH — WhatsMyName Integration Service
 * Fetches the WMN database (~500+ sites) and checks each via CORS proxy.
 * Compatible with the PlatformResult type from osintService.ts
 */

import { PlatformResult, ScanStatus } from './osintService';

const WMN_JSON_URL = 'https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json';
const PROXY = 'https://corsproxy.io/?url=';

export interface WMNSite {
  name: string;
  uri_check: string;
  e_code: number;       // HTTP code when user IS found
  e_string: string;     // body string when user IS found
  m_string: string;     // body string when user is NOT found
  m_code: number;       // HTTP code when user is NOT found
  category: string;
  valid: boolean;
  known_accounts?: string[];
  valid_http?: boolean;
}

interface WMNData {
  sites: WMNSite[];
}

let wmnCache: WMNData | null = null;

export async function fetchWMNData(): Promise<WMNData> {
  if (wmnCache) return wmnCache;
  const r = await fetch(WMN_JSON_URL);
  if (!r.ok) throw new Error(`WhatsMyName DB fetch failed: ${r.status}`);
  wmnCache = await r.json() as WMNData;
  return wmnCache;
}

async function checkWMNSite(
  site: WMNSite,
  username: string,
  now: string
): Promise<PlatformResult> {
  const url = site.uri_check.replace(/{account}/g, username);
  const base: Omit<PlatformResult, 'status'> = {
    platform: site.name,
    category: site.category || 'Misc',
    url,
    source: 'proxy',
    checkedAt: now,
    checkMethod: 'WhatsMyName DB · CORS Proxy',
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const proxyUrl = `${PROXY}${encodeURIComponent(url)}`;
    const r = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timer);

    const text = await r.text().catch(() => '');
    const lc = text.toLowerCase();

    let status: ScanStatus;

    // 1. Definitive not-found by HTTP code
    if (site.m_code && r.status === site.m_code) {
      status = 'not_found';
    }
    // 2. Not-found by body marker
    else if (site.m_string && lc.includes(site.m_string.toLowerCase())) {
      status = 'not_found';
    }
    // 3. Found by HTTP code match
    else if (r.status === site.e_code) {
      // also verify e_string if provided
      if (site.e_string) {
        const needle = site.e_string.replace(/{account}/g, username).toLowerCase();
        status = lc.includes(needle) ? 'found' : 'unverified';
      } else {
        status = 'found';
      }
    }
    // 4. Otherwise unverified
    else {
      status = 'unverified';
    }

    return { ...base, status };
  } catch {
    // Timeout or network error
    return { ...base, status: 'unverified' };
  }
}

/** Run the full WMN scan, skipping platforms already covered by the primary scan. */
export async function runWMNScan(
  username: string,
  existingPlatforms: Set<string>,
  onProgress?: (done: number, total: number, latest: string) => void
): Promise<PlatformResult[]> {
  const data = await fetchWMNData();

  // Only valid sites not already covered
  const sites = data.sites.filter(
    s => s.valid !== false &&
    !existingPlatforms.has(s.name.toLowerCase())
  );

  const now = new Date().toISOString();
  const results: PlatformResult[] = [];
  let done = 0;

  // Batch in groups of 6 to avoid hammering the proxy
  const BATCH = 6;
  for (let i = 0; i < sites.length; i += BATCH) {
    const batch = sites.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map(site => checkWMNSite(site, username, now))
    );
    for (const r of batchResults) {
      results.push(r);
      done++;
      onProgress?.(done, sites.length, r.platform);
    }
  }

  return results;
}

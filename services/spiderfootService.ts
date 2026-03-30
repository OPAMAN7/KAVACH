/**
 * KAVACH — SpiderFoot Non-API Modules
 * Implements every Internal (no API key) SpiderFoot module browser-side.
 */

const PROXY = 'https://corsproxy.io/?';
const px = (url: string) => PROXY + encodeURIComponent(url);

async function safeFetch(url: string, opts?: RequestInit): Promise<Response | null> {
  try {
    const r = await fetch(px(url), { signal: AbortSignal.timeout(12000), ...opts });
    return r;
  } catch { return null; }
}
async function safeText(url: string): Promise<string> {
  const r = await safeFetch(url);
  if (!r || !r.ok) return '';
  try { return await r.text(); } catch { return ''; }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type ModuleId =
  | 'dns_records' | 'dns_brute' | 'dns_srv' | 'whois' | 'ssl_cert'
  | 'web_spider' | 'web_headers' | 'email_extractor' | 'phone_extractor'
  | 'hash_extractor' | 'base64_decoder' | 'credit_card_extractor'
  | 'iban_extractor' | 'bitcoin_finder' | 'ethereum_finder'
  | 'error_string_extractor' | 'web_analytics' | 'web_framework'
  | 'page_info' | 'interesting_files' | 'junk_files'
  | 'social_network_id' | 'human_name_extractor' | 'country_extractor'
  | 'company_extractor' | 'subdomain_takeover' | 'hosting_provider'
  | 'pgp_key' | 'similar_domains' | 'cookie_extractor' | 'tld_searcher';

export interface SFResult {
  module: ModuleId;
  label: string;
  data: SFItem[];
  error?: string;
  durationMs: number;
}

export interface SFItem {
  type: string;
  value: string;
  detail?: string;
  risk?: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

// ─── Regex patterns ───────────────────────────────────────────────────────────
const RE = {
  email: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g,
  md5:   /\b[a-fA-F0-9]{32}\b/g,
  sha1:  /\b[a-fA-F0-9]{40}\b/g,
  sha256:/\b[a-fA-F0-9]{64}\b/g,
  btc:   /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
  eth:   /\b0x[a-fA-F0-9]{40}\b/g,
  iban:  /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g,
  cc:    /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  base64:/\b(?:[A-Za-z0-9+\/]{4}){3,}(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?\b/g,
  sqlErr:/(SQL syntax|mysql_fetch|ORA-\d{5}|pg_query|sqlite_|SQLSTATE|Uncaught Exception|Stack trace|Warning: include|Fatal error)/gi,
  analyticsGA:/(?:UA|G|GT|AW)-[A-Z0-9\-]+/g,
  analyticsGTM:/GTM-[A-Z0-9]+/g,
  fbPixel:/\d{15,16}/,
};

const COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Bolivia','Bosnia','Brazil','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Croatia','Cuba','Cyprus','Czech','Denmark','Ecuador','Egypt','Estonia','Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Mexico','Moldova','Mongolia','Morocco','Myanmar','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Palestine','Panama','Peru','Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Tunisia','Turkey','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zimbabwe'];

const FRAMEWORKS = ['jQuery','React','Angular','Vue','Bootstrap','Tailwind','Laravel','Django','Rails','Next.js','Nuxt','WordPress','Drupal','Magento','Shopify','Express','Spring','ASP.NET','Flask','Symfony'];

const HOSTING = [
  { cidr: '3.',   name: 'Amazon AWS' },
  { cidr: '13.',  name: 'Amazon AWS' },
  { cidr: '18.',  name: 'Amazon AWS' },
  { cidr: '34.',  name: 'Google Cloud' },
  { cidr: '35.',  name: 'Google Cloud' },
  { cidr: '52.',  name: 'Microsoft Azure' },
  { cidr: '40.',  name: 'Microsoft Azure' },
  { cidr: '104.', name: 'Cloudflare' },
  { cidr: '172.', name: 'DigitalOcean' },
  { cidr: '167.', name: 'DigitalOcean' },
];

const INTERESTING_EXTS = ['.pdf','.docx','.xlsx','.pptx','.zip','.rar','.tar','.gz','.bak','.sql','.env','.config','.xml','.json','.csv','.log','.key','.pem','.crt'];
const JUNK_EXTS = ['.tmp','.temp','.bak','.old','.orig','.backup','.swp','~','.DS_Store','Thumbs.db','.cache'];
const SOCIAL_NETS = ['twitter.com','x.com','facebook.com','instagram.com','linkedin.com','github.com','gitlab.com','reddit.com','youtube.com','tiktok.com','pinterest.com','snapchat.com','telegram.me','t.me','discord.gg','mastodon.social'];
const TAKEOVER_CUES = ['There is no app configured at that hostname','No such app','404 Not Found','Repository not found','Project not found','The site you were looking for couldn\'t be found'];
const SRV_RECORDS = ['_http._tcp','_https._tcp','_ftp._tcp','_smtp._tcp','_imap._tcp','_pop3._tcp','_xmpp._server','_xmpp._client','_sip._tcp','_sip._udp','_ldap._tcp','_kerberos._tcp','_rdp._tcp','_sftp._tcp','_ssh._tcp'];

function dedup(items: SFItem[]): SFItem[] {
  const seen = new Set<string>();
  return items.filter(i => { const k = i.type + i.value; if (seen.has(k)) return false; seen.add(k); return true; });
}

async function timed(fn: () => Promise<SFItem[]>): Promise<{ data: SFItem[]; durationMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const data = await fn();
    return { data: dedup(data), durationMs: Date.now() - t0 };
  } catch (e: any) {
    return { data: [], durationMs: Date.now() - t0, error: e.message };
  }
}

// ─── DNS Records ─────────────────────────────────────────────────────────────
async function runDnsRecords(target: string): Promise<SFItem[]> {
  const types = ['A','AAAA','MX','TXT','NS','CNAME','SOA','CAA','SRV'];
  const items: SFItem[] = [];
  await Promise.all(types.map(async (t) => {
    try {
      const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target)}&type=${t}`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) return;
      const j = await r.json();
      (j.Answer || j.Authority || []).forEach((a: any) => {
        items.push({ type: `DNS ${t}`, value: String(a.data).trim(), detail: `TTL: ${a.TTL}` });
      });
    } catch {}
  }));
  return items;
}

// ─── DNS Brute-force ──────────────────────────────────────────────────────────
async function runDnsBrute(target: string): Promise<SFItem[]> {
  const subs = ['www','mail','ftp','smtp','pop','imap','webmail','admin','api','dev','staging','test','vpn','remote','secure','login','portal','shop','blog','m','mobile','app','cdn','ns1','ns2','mx','autodiscover'];
  const items: SFItem[] = [];
  await Promise.all(subs.map(async (sub) => {
    const host = `${sub}.${target}`;
    try {
      const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return;
      const j = await r.json();
      if (j.Answer?.length) {
        j.Answer.forEach((a: any) => items.push({ type: 'Subdomain', value: host, detail: `→ ${a.data}`, risk: 'info' }));
      }
    } catch {}
  }));
  return items;
}

// ─── DNS SRV ─────────────────────────────────────────────────────────────────
async function runDnsSrv(target: string): Promise<SFItem[]> {
  const items: SFItem[] = [];
  await Promise.all(SRV_RECORDS.map(async (srv) => {
    const host = `${srv}.${target}`;
    try {
      const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=SRV`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return;
      const j = await r.json();
      if (j.Answer?.length) {
        j.Answer.forEach((a: any) => items.push({ type: 'SRV Record', value: `${srv}.${target}`, detail: a.data, risk: 'info' }));
      }
    } catch {}
  }));
  return items;
}

// ─── WHOIS (via hackertarget) ─────────────────────────────────────────────────
async function runWhois(target: string): Promise<SFItem[]> {
  const txt = await safeText(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(target)}`);
  if (!txt) return [];
  const items: SFItem[] = [];
  const lines = txt.split('\n');
  const fields = ['Registrar','Registrant','Admin Email','Tech Email','Name Server','Creation Date','Updated Date','Expiry Date','Registry Domain ID','Domain Status'];
  for (const line of lines) {
    for (const f of fields) {
      if (line.toLowerCase().startsWith(f.toLowerCase() + ':')) {
        const val = line.split(':').slice(1).join(':').trim();
        if (val) items.push({ type: `WHOIS ${f}`, value: val, risk: 'info' });
      }
    }
  }
  if (!items.length) items.push({ type: 'WHOIS Raw', value: txt.slice(0, 1000) });
  return items;
}

// ─── SSL Certificate ─────────────────────────────────────────────────────────
async function runSslCert(target: string): Promise<SFItem[]> {
  const items: SFItem[] = [];
  try {
    const r = await fetch(`https://crt.sh/?q=${encodeURIComponent(target)}&output=json`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    const j: any[] = await r.json();
    const seen = new Set<string>();
    j.slice(0, 30).forEach((cert) => {
      const cn = cert.common_name || cert.name_value || '';
      cn.split('\n').forEach((n: string) => {
        n = n.trim().replace(/^\*\./, '');
        if (n && !seen.has(n)) { seen.add(n); items.push({ type: 'SSL SAN / CN', value: n, detail: `Issuer: ${cert.issuer_name?.split(',')[0] || '?'} | Valid: ${cert.not_after?.slice(0,10)}` }); }
      });
    });
  } catch {}
  return items;
}

// ─── Web Spider (1-level) ─────────────────────────────────────────────────────
async function runWebSpider(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  if (!html) return [];
  const items: SFItem[] = [];
  const links = [...html.matchAll(/href=["']([^"'#?]+)["']/gi)].map(m => m[1]);
  const srcs  = [...html.matchAll(/src=["']([^"']+)["']/gi)].map(m => m[1]);
  const allLinks = [...new Set([...links, ...srcs])].slice(0, 50);
  allLinks.forEach(l => {
    const fullUrl = l.startsWith('http') ? l : (l.startsWith('/') ? url.replace(/\/$/, '') + l : '');
    if (fullUrl) items.push({ type: 'Linked URL', value: fullUrl });
  });
  items.push({ type: 'Page Size', value: `${(html.length / 1024).toFixed(1)} KB`, detail: `${html.split('\n').length} lines` });
  return items;
}

// ─── Web Headers ─────────────────────────────────────────────────────────────
async function runWebHeaders(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const r = await safeFetch(url, { method: 'HEAD' }) || await safeFetch(url);
  if (!r) return [];
  const items: SFItem[] = [];
  r.headers.forEach((v, k) => {
    const risk: SFItem['risk'] = ['server','x-powered-by','x-aspnet-version','x-generator'].includes(k.toLowerCase()) ? 'medium' : 'info';
    items.push({ type: `Header: ${k}`, value: v, risk });
  });
  // Strange headers
  const stdHeaders = new Set(['content-type','content-length','connection','cache-control','date','expires','pragma','set-cookie','transfer-encoding','vary','via','x-cache','etag','last-modified','location','server','x-powered-by','access-control-allow-origin','strict-transport-security','content-security-policy','x-content-type-options','x-frame-options','x-xss-protection']);
  r.headers.forEach((v, k) => { if (!stdHeaders.has(k.toLowerCase())) items.push({ type: 'Strange Header', value: `${k}: ${v}`, risk: 'low' }); });
  return dedup(items);
}

// ─── Page Info ────────────────────────────────────────────────────────────────
async function runPageInfo(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  if (!html) return [];
  const items: SFItem[] = [];
  const hasPassword = /<input[^>]+type=["']?password["']?/i.test(html);
  const hasForms = /<form/i.test(html);
  const hasLogin = /login|signin|log.in|sign.in/i.test(html);
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1];
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)?.[1];
  if (title) items.push({ type: 'Page Title', value: title });
  if (desc) items.push({ type: 'Meta Description', value: desc });
  if (robots) items.push({ type: 'Robots Meta', value: robots, risk: 'info' });
  items.push({ type: 'Has Password Field', value: hasPassword ? 'Yes' : 'No', risk: hasPassword ? 'medium' : 'info' });
  items.push({ type: 'Has Forms', value: hasForms ? 'Yes' : 'No' });
  items.push({ type: 'Has Login References', value: hasLogin ? 'Yes' : 'No', risk: hasLogin ? 'low' : 'info' });
  const iframes = (html.match(/<iframe/gi) || []).length;
  if (iframes) items.push({ type: 'IFrames Count', value: String(iframes), risk: 'low' });
  return items;
}

// ─── Email Extractor ──────────────────────────────────────────────────────────
async function runEmailExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const emails = [...new Set(html.match(RE.email) || [])];
  return emails.map(e => ({ type: 'Email Address', value: e, risk: 'medium' as SFItem['risk'] }));
}

// ─── Phone Extractor ──────────────────────────────────────────────────────────
async function runPhoneExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const phones = [...new Set((html.match(RE.phone) || []).map(p => p.trim()))];
  return phones.map(p => ({ type: 'Phone Number', value: p, risk: 'low' as SFItem['risk'] }));
}

// ─── Hash Extractor ───────────────────────────────────────────────────────────
async function runHashExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const items: SFItem[] = [];
  [...new Set(html.match(RE.md5) || [])].forEach(h => items.push({ type: 'MD5 Hash', value: h, risk: 'low' }));
  [...new Set(html.match(RE.sha1) || [])].forEach(h => items.push({ type: 'SHA1 Hash', value: h, risk: 'low' }));
  [...new Set(html.match(RE.sha256) || [])].forEach(h => items.push({ type: 'SHA256 Hash', value: h, risk: 'low' }));
  return items;
}

// ─── Base64 Decoder ───────────────────────────────────────────────────────────
async function runBase64Decoder(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const items: SFItem[] = [];
  const matches = [...new Set(html.match(RE.base64) || [])].slice(0, 20);
  matches.forEach(b => {
    try {
      const dec = atob(b);
      if (/[\x20-\x7E]{6,}/.test(dec)) items.push({ type: 'Base64 Decoded', value: dec.slice(0, 200), detail: `Encoded: ${b.slice(0, 40)}…`, risk: 'medium' });
    } catch {}
  });
  return items;
}

// ─── Credit Card Extractor ────────────────────────────────────────────────────
async function runCreditCardExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const ccs = [...new Set(html.replace(/[\s\-]/g, '').match(RE.cc) || [])];
  return ccs.map(c => ({ type: 'Credit Card Number', value: c, risk: 'critical' as SFItem['risk'] }));
}

// ─── IBAN Extractor ───────────────────────────────────────────────────────────
async function runIbanExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const ibans = [...new Set(html.replace(/\s/g,'').match(RE.iban) || [])];
  return ibans.map(i => ({ type: 'IBAN', value: i, risk: 'high' as SFItem['risk'] }));
}

// ─── Bitcoin Finder ───────────────────────────────────────────────────────────
async function runBitcoinFinder(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const addrs = [...new Set(html.match(RE.btc) || [])];
  return addrs.map(a => ({ type: 'Bitcoin Address', value: a, risk: 'medium' as SFItem['risk'] }));
}

// ─── Ethereum Finder ──────────────────────────────────────────────────────────
async function runEthereumFinder(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const addrs = [...new Set(html.match(RE.eth) || [])];
  return addrs.map(a => ({ type: 'Ethereum Address', value: a, risk: 'medium' as SFItem['risk'] }));
}

// ─── Error String Extractor ───────────────────────────────────────────────────
async function runErrorStrings(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const errs = [...new Set(html.match(RE.sqlErr) || [])];
  return errs.map(e => ({ type: 'Error String', value: e, risk: 'high' as SFItem['risk'], detail: 'Potential info disclosure error message' }));
}

// ─── Web Analytics ────────────────────────────────────────────────────────────
async function runWebAnalytics(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const items: SFItem[] = [];
  [...new Set(html.match(RE.analyticsGA) || [])].forEach(id => items.push({ type: 'Google Analytics ID', value: id, risk: 'low' }));
  [...new Set(html.match(RE.analyticsGTM) || [])].forEach(id => items.push({ type: 'Google Tag Manager ID', value: id, risk: 'low' }));
  if (/fbq\(|facebook\.net\/en_US\/fbevents/i.test(html)) {
    const m = html.match(/fbq\('init',\s*['"](\d+)['"]/);
    items.push({ type: 'Facebook Pixel', value: m?.[1] || 'Detected', risk: 'low' });
  }
  if (/hotjar|hj\(/i.test(html)) items.push({ type: 'Hotjar', value: 'Detected', risk: 'info' });
  if (/intercomSettings|window\.Intercom/i.test(html)) items.push({ type: 'Intercom', value: 'Detected', risk: 'info' });
  if (/crisp\.chat|window\.\$crisp/i.test(html)) items.push({ type: 'Crisp Chat', value: 'Detected', risk: 'info' });
  return items;
}

// ─── Web Framework Identifier ─────────────────────────────────────────────────
async function runWebFramework(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const items: SFItem[] = [];
  FRAMEWORKS.forEach(fw => {
    if (html.toLowerCase().includes(fw.toLowerCase())) items.push({ type: 'Framework Detected', value: fw, risk: 'info' });
  });
  if (/wp-content|wp-includes|wordpress/i.test(html)) items.push({ type: 'CMS', value: 'WordPress', risk: 'info' });
  if (/Drupal\.settings|drupal\//i.test(html)) items.push({ type: 'CMS', value: 'Drupal', risk: 'info' });
  if (/Joomla!/i.test(html)) items.push({ type: 'CMS', value: 'Joomla', risk: 'info' });
  if (/Shopify\.theme|cdn\.shopify\.com/i.test(html)) items.push({ type: 'E-Commerce', value: 'Shopify', risk: 'info' });
  if (/Magento|mage\//i.test(html)) items.push({ type: 'E-Commerce', value: 'Magento', risk: 'info' });
  return dedup(items);
}

// ─── Cookie Extractor ─────────────────────────────────────────────────────────
async function runCookieExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const r = await safeFetch(url);
  if (!r) return [];
  const items: SFItem[] = [];
  const setCookie = r.headers.get('set-cookie') || '';
  if (!setCookie) return [{ type: 'Cookies', value: 'None set by server', risk: 'info' }];
  setCookie.split(',').forEach(c => {
    const name = c.trim().split('=')[0];
    const httpOnly = /HttpOnly/i.test(c);
    const secure = /Secure/i.test(c);
    const sameSite = c.match(/SameSite=(\w+)/i)?.[1];
    const risk: SFItem['risk'] = !httpOnly || !secure ? 'medium' : 'info';
    items.push({ type: 'Cookie', value: name.trim(), detail: `HttpOnly:${httpOnly} Secure:${secure} SameSite:${sameSite||'None'}`, risk });
  });
  return items;
}

// ─── Interesting Files ────────────────────────────────────────────────────────
async function runInterestingFiles(target: string): Promise<SFItem[]> {
  const base = target.startsWith('http') ? target : `https://${target}`;
  const paths = [
    '/robots.txt','/sitemap.xml','/.well-known/security.txt','/.git/HEAD',
    '/crossdomain.xml','/.env','/.htaccess','/web.config','/phpinfo.php',
    '/wp-config.php','/config.php','/database.yml','/credentials.json',
    '/backup.zip','/dump.sql','/error_log','/access.log',
  ];
  const items: SFItem[] = [];
  await Promise.all(paths.map(async (p) => {
    const r = await safeFetch(base.replace(/\/$/, '') + p, { method: 'HEAD' });
    if (r && r.ok) {
      const ext = p.split('.').pop() || '';
      const risk: SFItem['risk'] = ['.env','web.config','.git','dump.sql','phpinfo'].some(s => p.includes(s)) ? 'critical' : INTERESTING_EXTS.includes('.' + ext) ? 'high' : 'medium';
      items.push({ type: 'Interesting File', value: p, detail: `HTTP ${r.status}`, risk });
    }
  }));
  return items;
}

// ─── Junk Files ───────────────────────────────────────────────────────────────
async function runJunkFiles(target: string): Promise<SFItem[]> {
  const base = target.startsWith('http') ? target : `https://${target}`;
  const paths = [
    '/index.php~','/index.bak','/index.php.bak','/wp-config.php.bak',
    '/.DS_Store','/Thumbs.db','/.swp','/#index.php#','/index.old',
    '/site.tar.gz','/backup.tar','/www.zip',
  ];
  const items: SFItem[] = [];
  await Promise.all(paths.map(async (p) => {
    const r = await safeFetch(base.replace(/\/$/, '') + p, { method: 'HEAD' });
    if (r && r.ok) items.push({ type: 'Junk/Temp File', value: p, detail: `HTTP ${r.status}`, risk: 'high' });
  }));
  return items;
}

// ─── Social Network Identifier ────────────────────────────────────────────────
async function runSocialNetworkId(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const items: SFItem[] = [];
  SOCIAL_NETS.forEach(net => {
    const re = new RegExp(`https?://(?:www\\.)?${net.replace('.', '\\.')}([/\\w\\-\\.@?=%]+)`, 'gi');
    const matches = [...new Set(html.match(re) || [])];
    matches.slice(0, 5).forEach(m => items.push({ type: 'Social Profile Link', value: m, detail: net, risk: 'info' }));
  });
  return items;
}

// ─── Human Name Extractor ────────────────────────────────────────────────────
async function runHumanNameExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const clean = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const nameRe = /\b([A-Z][a-z]{2,15})\s+([A-Z][a-z]{2,15})(?:\s+([A-Z][a-z]{2,15}))?\b/g;
  const names = [...new Set((clean.match(nameRe) || []))].slice(0, 20);
  return names.map(n => ({ type: 'Possible Human Name', value: n, risk: 'low' as SFItem['risk'] }));
}

// ─── Country Extractor ────────────────────────────────────────────────────────
async function runCountryExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const found = COUNTRIES.filter(c => new RegExp(`\\b${c}\\b`, 'i').test(html));
  return found.map(c => ({ type: 'Country Mention', value: c, risk: 'info' as SFItem['risk'] }));
}

// ─── Company Extractor ────────────────────────────────────────────────────────
async function runCompanyExtractor(target: string): Promise<SFItem[]> {
  const url = target.startsWith('http') ? target : `https://${target}`;
  const html = await safeText(url);
  const clean = html.replace(/<[^>]+>/g, ' ');
  const re = /\b([A-Z][A-Za-z0-9&\s]{2,30}(?:Inc\.|LLC|Ltd|Corp\.|Co\.|GmbH|SAS|AG|PLC|Pvt\.|Technologies|Solutions|Services|Group))\b/g;
  const companies = [...new Set((clean.match(re) || []))].slice(0, 15);
  return companies.map(c => ({ type: 'Company Name', value: c.trim(), risk: 'info' as SFItem['risk'] }));
}

// ─── Subdomain Takeover ───────────────────────────────────────────────────────
async function runSubdomainTakeover(target: string): Promise<SFItem[]> {
  const items: SFItem[] = [];
  const cnameR = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target)}&type=CNAME`).catch(() => null);
  if (cnameR?.ok) {
    const j = await cnameR.json();
    const cnames: string[] = (j.Answer || []).map((a: any) => a.data);
    for (const cname of cnames) {
      const txt = await safeText(`https://${cname.replace(/\.$/, '')}`);
      const taken = TAKEOVER_CUES.some(c => txt.toLowerCase().includes(c.toLowerCase()));
      if (taken) items.push({ type: 'Subdomain Takeover', value: cname, risk: 'critical', detail: 'CNAME points to unclaimed service' });
      else items.push({ type: 'CNAME Resolved', value: cname, risk: 'info' });
    }
  }
  return items;
}

// ─── Hosting Provider ─────────────────────────────────────────────────────────
async function runHostingProvider(target: string): Promise<SFItem[]> {
  const items: SFItem[] = [];
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target)}&type=A`, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    (j.Answer || []).forEach((a: any) => {
      const ip: string = a.data;
      const provider = HOSTING.find(h => ip.startsWith(h.cidr));
      items.push({ type: 'IP Address', value: ip, risk: 'info' });
      if (provider) items.push({ type: 'Hosting Provider', value: provider.name, detail: `IP: ${ip}`, risk: 'info' });
    });
  } catch {}
  return items;
}

// ─── PGP Key Servers ─────────────────────────────────────────────────────────
async function runPgpKey(target: string): Promise<SFItem[]> {
  const txt = await safeText(`https://keys.openpgp.org/vks/v1/search?q=${encodeURIComponent(target)}`);
  if (!txt || txt.includes('No results')) return [{ type: 'PGP Keys', value: 'No keys found', risk: 'info' }];
  const fingerprints = [...txt.matchAll(/[A-F0-9]{40}/g)].map(m => m[0]);
  return [...new Set(fingerprints)].map(fp => ({ type: 'PGP Fingerprint', value: fp, risk: 'info' as SFItem['risk'] }));
}

// ─── Similar Domains ─────────────────────────────────────────────────────────
async function runSimilarDomains(target: string): Promise<SFItem[]> {
  const base = target.replace(/^www\./, '').split('.')[0];
  const tlds = ['.com','.net','.org','.io','.co','.info','.biz','.us','.uk','.de','.fr','.in'];
  const items: SFItem[] = [];
  await Promise.all(tlds.map(async (tld) => {
    const domain = base + tld;
    if (domain === target) return;
    try {
      const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j.Answer?.length) items.push({ type: 'Similar Domain (Registered)', value: domain, detail: `→ ${j.Answer[0].data}`, risk: 'medium' });
    } catch {}
  }));
  return items;
}

// ─── TLD Searcher ────────────────────────────────────────────────────────────
async function runTldSearcher(target: string): Promise<SFItem[]> {
  const tlds = ['.com','.net','.org','.io','.co','.info','.biz','.us','.uk','.de','.fr','.in','.au','.ca','.jp','.cn','.ru','.br','.mx','.es','.nl','.pl','.se','.no','.fi','.dk','.ch','.at','.be','.pt','.cz','.hu','.ro','.gr','.tr','.za','.ae','.sg','.nz','.my','.ph','.id','.th','.vn'];
  const base = target.replace(/^www\./, '').replace(/\.[^.]+$/, '');
  const items: SFItem[] = [];
  await Promise.all(tlds.map(async (tld) => {
    const domain = base + tld;
    try {
      const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j.Answer?.length) items.push({ type: 'TLD Registration', value: domain, detail: `→ ${j.Answer[0].data}`, risk: 'info' });
    } catch {}
  }));
  return items;
}

// ─── Module registry ─────────────────────────────────────────────────────────
export const SF_MODULES: { id: ModuleId; label: string; desc: string; category: string }[] = [
  { id: 'dns_records',          label: 'DNS Raw Records',             desc: 'Retrieves A, AAAA, MX, TXT, NS, CNAME, SOA records via Google DNS',                 category: 'DNS' },
  { id: 'dns_brute',            label: 'DNS Brute-forcer',            desc: 'Attempts to identify subdomains via brute-forcing ~30 common names',                 category: 'DNS' },
  { id: 'dns_srv',              label: 'DNS Common SRV',              desc: 'Brute-forces common SRV records (smtp, imap, ftp, ldap, etc.)',                      category: 'DNS' },
  { id: 'ssl_cert',             label: 'SSL Certificate Analyzer',    desc: 'Gathers SSL/TLS certificate SANs and history from crt.sh',                          category: 'SSL' },
  { id: 'whois',                label: 'WHOIS',                       desc: 'Performs WHOIS lookup via HackerTarget API',                                         category: 'Domain' },
  { id: 'web_spider',           label: 'Web Spider',                  desc: 'Spiders the target web page and extracts linked URLs and resources',                  category: 'Web' },
  { id: 'web_headers',          label: 'Web Server / Strange Headers',desc: 'Extracts HTTP response headers and identifies unusual/leaky ones',                   category: 'Web' },
  { id: 'page_info',            label: 'Page Information',            desc: 'Extracts page title, meta, forms, login hints, IFrames from the target',             category: 'Web' },
  { id: 'cookie_extractor',     label: 'Cookie Extractor',            desc: 'Extracts server-set cookies and checks HttpOnly/Secure flags',                       category: 'Web' },
  { id: 'email_extractor',      label: 'E-Mail Address Extractor',    desc: 'Identifies email addresses in page content',                                         category: 'Extractor' },
  { id: 'phone_extractor',      label: 'Phone Number Extractor',      desc: 'Identifies phone numbers in scraped page content',                                    category: 'Extractor' },
  { id: 'hash_extractor',       label: 'Hash Extractor',              desc: 'Identifies MD5, SHA1, SHA256 hashes in web content',                                 category: 'Extractor' },
  { id: 'base64_decoder',       label: 'Base64 Decoder',              desc: 'Finds and decodes Base64-encoded strings in URLs and content',                       category: 'Extractor' },
  { id: 'credit_card_extractor',label: 'Credit Card Extractor',       desc: 'Scans for exposed credit card number patterns',                                      category: 'Extractor' },
  { id: 'iban_extractor',       label: 'IBAN Number Extractor',       desc: 'Identifies International Bank Account Numbers in content',                           category: 'Extractor' },
  { id: 'bitcoin_finder',       label: 'Bitcoin Address Finder',      desc: 'Identifies Bitcoin wallet addresses in scraped content',                              category: 'Extractor' },
  { id: 'ethereum_finder',      label: 'Ethereum Address Finder',     desc: 'Identifies Ethereum wallet addresses in scraped content',                             category: 'Extractor' },
  { id: 'error_string_extractor',label:'Error String Extractor',      desc: 'Detects SQL errors, PHP warnings, stack traces that leak info',                     category: 'Extractor' },
  { id: 'web_analytics',        label: 'Web Analytics Extractor',     desc: 'Identifies GA, GTM, Facebook Pixel, Hotjar IDs',                                    category: 'Intelligence' },
  { id: 'web_framework',        label: 'Web Framework Identifier',    desc: 'Detects CMS, JS frameworks, e-commerce platforms from page content',                category: 'Intelligence' },
  { id: 'interesting_files',    label: 'Interesting File Finder',     desc: 'Probes for .env, .git, robots.txt, phpinfo, backup files, etc.',                    category: 'Intelligence' },
  { id: 'junk_files',           label: 'Junk File Finder',            desc: 'Probes for old/temp/backup files like .bak, .swp, .old',                            category: 'Intelligence' },
  { id: 'social_network_id',    label: 'Social Network Identifier',   desc: 'Finds links to social media profiles in page HTML',                                  category: 'Intelligence' },
  { id: 'human_name_extractor', label: 'Human Name Extractor',        desc: 'Attempts to identify human names from page content using regex heuristics',         category: 'Intelligence' },
  { id: 'country_extractor',    label: 'Country Name Extractor',      desc: 'Identifies country names mentioned in page content',                                 category: 'Intelligence' },
  { id: 'company_extractor',    label: 'Company Name Extractor',      desc: 'Identifies company names (Inc., LLC, Ltd, etc.) in content',                        category: 'Intelligence' },
  { id: 'hosting_provider',     label: 'Hosting Provider Identifier', desc: 'Identifies if IP falls within AWS, Azure, GCP, Cloudflare, DigitalOcean ranges',   category: 'Network' },
  { id: 'subdomain_takeover',   label: 'Subdomain Takeover Checker',  desc: 'Checks if CNAME-pointed subdomains are vulnerable to takeover',                    category: 'Network' },
  { id: 'pgp_key',              label: 'PGP Key Server Lookup',       desc: 'Looks up domain/email in PGP public key servers (keys.openpgp.org)',               category: 'Network' },
  { id: 'similar_domains',      label: 'Similar Domain Finder',       desc: 'Searches common TLDs for registered domains with the same base name',              category: 'Network' },
  { id: 'tld_searcher',         label: 'TLD Searcher',                desc: 'Searches 40+ TLDs for domains matching the target base name (squatting detection)', category: 'Network' },
];

const RUNNERS: Record<ModuleId, (target: string) => Promise<SFItem[]>> = {
  dns_records:           runDnsRecords,
  dns_brute:             runDnsBrute,
  dns_srv:               runDnsSrv,
  ssl_cert:              runSslCert,
  whois:                 runWhois,
  web_spider:            runWebSpider,
  web_headers:           runWebHeaders,
  page_info:             runPageInfo,
  cookie_extractor:      runCookieExtractor,
  email_extractor:       runEmailExtractor,
  phone_extractor:       runPhoneExtractor,
  hash_extractor:        runHashExtractor,
  base64_decoder:        runBase64Decoder,
  credit_card_extractor: runCreditCardExtractor,
  iban_extractor:        runIbanExtractor,
  bitcoin_finder:        runBitcoinFinder,
  ethereum_finder:       runEthereumFinder,
  error_string_extractor:runErrorStrings,
  web_analytics:         runWebAnalytics,
  web_framework:         runWebFramework,
  interesting_files:     runInterestingFiles,
  junk_files:            runJunkFiles,
  social_network_id:     runSocialNetworkId,
  human_name_extractor:  runHumanNameExtractor,
  country_extractor:     runCountryExtractor,
  company_extractor:     runCompanyExtractor,
  hosting_provider:      runHostingProvider,
  subdomain_takeover:    runSubdomainTakeover,
  pgp_key:               runPgpKey,
  similar_domains:       runSimilarDomains,
  tld_searcher:          runTldSearcher,
};

export async function runModule(id: ModuleId, target: string): Promise<SFResult> {
  const mod = SF_MODULES.find(m => m.id === id)!;
  const { data, durationMs, error } = await timed(() => RUNNERS[id](target));
  return { module: id, label: mod.label, data, error, durationMs };
}

export async function runAllModules(
  target: string,
  selectedIds: ModuleId[],
  onProgress: (id: ModuleId, result: SFResult) => void
): Promise<SFResult[]> {
  const results: SFResult[] = [];
  await Promise.all(selectedIds.map(async (id) => {
    const result = await runModule(id, target);
    results.push(result);
    onProgress(id, result);
  }));
  return results;
}

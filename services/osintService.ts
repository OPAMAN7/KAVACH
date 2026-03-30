/**
 * KAVACH OSINT Service — Digital Footprint Scanner
 * Tier 1: Public APIs  (verified  — full profile data)
 * Tier 2: CORS Proxy HTTP status  (found / not_found)
 * Tier 3: CORS Proxy + content markers  (found / not_found)
 * Tier 4: URL only  (unverified — click to check)
 * Tier 5: WhatsMyName DB  (500+ platforms via CORS proxy)
 */
import { runWMNScan } from './whatsmynameService';
import { runEmailScan, EmailResult } from './emailOsintService';
export type { EmailResult } from './emailOsintService';

export type ScanStatus = 'verified' | 'found' | 'not_found' | 'unverified';

export interface ProfileData {
  name?: string; bio?: string; location?: string; avatarUrl?: string;
  followers?: number; following?: number; publicRepos?: number;
  email?: string; website?: string; joinedDate?: string;
  extraInfo?: Record<string, string | number | boolean>;
}

export interface PlatformResult {
  platform: string; category: string; url: string;
  status: ScanStatus; profileData?: ProfileData;
  checkedAt: string; source: 'api' | 'proxy' | 'generated';
  checkMethod: string;
}

export interface ScanReport {
  username: string; email: string; scannedAt: string;
  totalPlatforms: number;
  verified: number; found: number; notFound: number; unverified: number;
  results: PlatformResult[]; usernameVariations: string[];
  emailResults?: EmailResult[];
}

// ─── MD5 (for Gravatar) ───────────────────────────────────────────────────────
function md5(str: string): string {
  function safeAdd(x: number, y: number) { const lsw=(x&0xffff)+(y&0xffff); const msw=(x>>16)+(y>>16)+(lsw>>16); return(msw<<16)|(lsw&0xffff); }
  function rol(n:number,c:number){return(n<<c)|(n>>>(32-c));}
  function cmn(q:number,a:number,b:number,x:number,s:number,t:number){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(c^(b|~d),a,b,x,s,t);}
  function blk(s:string,i:number){return s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);}
  function cycle(x:number[],k:number[]){
    let [a,b,c,d]=x;
    a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
    a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
    a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
    a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
    a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
    a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
    a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
    a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
    a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
    a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
    a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
    a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
    a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416396081);b=ii(b,c,d,a,k[5],21,-57434055);
    a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
    a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
    a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
    x[0]=safeAdd(a,x[0]);x[1]=safeAdd(b,x[1]);x[2]=safeAdd(c,x[2]);x[3]=safeAdd(d,x[3]);
  }
  const s=str; const n=s.length; const st=[1732584193,-271733879,-1732584194,271733878]; let i:number;
  const blks:number[][]=[];
  for(i=0;i<Math.ceil((n+8)/64);i++){blks[i]=new Array(16).fill(0);}
  for(i=0;i<n;i++){blks[i>>6][(i%64)>>2]|=s.charCodeAt(i)<<((i%4)<<3);}
  blks[n>>6][(n%64)>>2]|=0x80<<((n%4)<<3);
  blks[Math.ceil((n+8)/64)-1][14]=n*8;
  for(let b=0;b<blks.length;b++){const k=blks[b];cycle(st,k);}
  function rh(n:number){let s='';for(let j=0;j<4;j++)s+='0123456789abcdef'.charAt((n>>(j*8+4))&0xf)+'0123456789abcdef'.charAt((n>>(j*8))&0xf);return s;}
  return st.map(rh).join('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateUsernameVariations(u: string): string[] {
  const v = new Set<string>([u]);
  if (u.includes(' ')) { v.add(u.replace(/ /g,'.')); v.add(u.replace(/ /g,'_')); v.add(u.replace(/ /g,'-')); v.add(u.replace(/ /g,'')); }
  if (u.includes('.')) { v.add(u.replace(/\./g,'')); v.add(u.replace(/\./g,'_')); v.add(u.replace(/\./g,'-')); }
  Array.from(v).forEach(x => v.add(x.toLowerCase()));
  return Array.from(v).filter(x => x.length > 0);
}

async function fetchWithTimeout(url: string, ms = 9000, opts?: RequestInit): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { ...opts, signal: c.signal }); clearTimeout(t); return r; }
  catch(e) { clearTimeout(t); throw e; }
}

const PROXY = 'https://corsproxy.io/?url=';

async function proxyGet(targetUrl: string, ms = 9000): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const r = await fetchWithTimeout(`${PROXY}${encodeURIComponent(targetUrl)}`, ms);
    const text = await r.text();
    return { ok: true, status: r.status, text };
  } catch { return { ok: false, status: 0, text: '' }; }
}

function mk(p: string, c: string, u: string, s: ScanStatus, src: 'api'|'proxy'|'generated', now: string, method: string, pd?: ProfileData): PlatformResult {
  return { platform: p, category: c, url: u, status: s, source: src, checkedAt: now, checkMethod: method, profileData: pd };
}

// ─── Tier 1: Public APIs ──────────────────────────────────────────────────────
async function checkGitHub(u: string, now: string): Promise<PlatformResult> {
  const url = `https://github.com/${u}`;
  try {
    const r = await fetchWithTimeout(`https://api.github.com/users/${u}`, 8000, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (r.status === 200) {
      const d = await r.json();
      return mk('GitHub','Tech',url,'verified','api',now,'GitHub REST API',{ name:d.name, bio:d.bio, location:d.location, avatarUrl:d.avatar_url, followers:d.followers, following:d.following, publicRepos:d.public_repos, email:d.email, website:d.blog, joinedDate:d.created_at?.split('T')[0] });
    }
    return mk('GitHub','Tech',url, r.status===404?'not_found':'unverified','api',now,'GitHub REST API');
  } catch { return mk('GitHub','Tech',url,'unverified','generated',now,'GitHub REST API'); }
}

async function checkGitLab(u: string, now: string): Promise<PlatformResult> {
  const url = `https://gitlab.com/${u}`;
  try {
    const r = await fetchWithTimeout(`https://gitlab.com/api/v4/users?username=${u}`, 8000);
    if (r.status === 200) {
      const d = await r.json();
      if (Array.isArray(d) && d.length > 0) return mk('GitLab','Tech',url,'verified','api',now,'GitLab REST API',{ name:d[0].name, bio:d[0].bio, location:d[0].location, avatarUrl:d[0].avatar_url, website:d[0].website_url });
      return mk('GitLab','Tech',url,'not_found','api',now,'GitLab REST API');
    }
    return mk('GitLab','Tech',url,'unverified','generated',now,'GitLab REST API');
  } catch { return mk('GitLab','Tech',url,'unverified','generated',now,'GitLab REST API'); }
}

async function checkReddit(u: string, now: string): Promise<PlatformResult> {
  const url = `https://reddit.com/user/${u}`;
  try {
    const r = await fetchWithTimeout(`https://www.reddit.com/user/${u}/about.json`, 8000, { headers: { Accept: 'application/json' } });
    if (r.status === 200) {
      const d = await r.json();
      const data = d?.data;
      return mk('Reddit','Forums',url,'verified','api',now,'Reddit JSON API',{ name:data?.name, bio:data?.subreddit?.public_description, avatarUrl:data?.icon_img?.split('?')[0], extraInfo:{ karma:(data?.link_karma||0)+(data?.comment_karma||0), created:new Date((data?.created_utc||0)*1000).toLocaleDateString() } });
    }
    return mk('Reddit','Forums',url, r.status===404?'not_found':'unverified','api',now,'Reddit JSON API');
  } catch { return mk('Reddit','Forums',url,'unverified','generated',now,'Reddit JSON API'); }
}

async function checkHackerNews(u: string, now: string): Promise<PlatformResult> {
  const url = `https://news.ycombinator.com/user?id=${u}`;
  try {
    const r = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/user/${u}.json`, 8000);
    if (r.status === 200) {
      const d = await r.json();
      if (d?.id) return mk('HackerNews','Tech',url,'verified','api',now,'Firebase HN API',{ bio:d.about?.replace(/<[^>]*>/g,''), extraInfo:{ karma:d.karma, submitted:d.submitted?.length||0 } });
      return mk('HackerNews','Tech',url,'not_found','api',now,'Firebase HN API');
    }
    return mk('HackerNews','Tech',url,'unverified','generated',now,'Firebase HN API');
  } catch { return mk('HackerNews','Tech',url,'unverified','generated',now,'Firebase HN API'); }
}

async function checkDevTo(u: string, now: string): Promise<PlatformResult> {
  const url = `https://dev.to/${u}`;
  try {
    const r = await fetchWithTimeout(`https://dev.to/api/users/by_username?url=${u}`, 8000);
    if (r.status === 200) {
      const d = await r.json();
      if (d?.username) return mk('Dev.to','Tech',url,'verified','api',now,'Dev.to REST API',{ name:d.name, bio:d.summary, location:d.location, avatarUrl:d.profile_image, website:d.website_url, extraInfo:{ articles:d.articles_count, comments:d.comments_count } });
      return mk('Dev.to','Tech',url,'not_found','api',now,'Dev.to REST API');
    }
    return mk('Dev.to','Tech',url,'unverified','generated',now,'Dev.to REST API');
  } catch { return mk('Dev.to','Tech',url,'unverified','generated',now,'Dev.to REST API'); }
}

async function checkKeybase(u: string, now: string): Promise<PlatformResult> {
  const url = `https://keybase.io/${u}`;
  try {
    const r = await fetchWithTimeout(`https://keybase.io/_/api/1.0/user/lookup.json?username=${u}`, 8000);
    if (r.status === 200) {
      const d = await r.json();
      if (d?.them?.length > 0) return mk('Keybase','Tech',url,'verified','api',now,'Keybase API',{ name:d.them[0].profile?.full_name, bio:d.them[0].profile?.bio, location:d.them[0].profile?.location, avatarUrl:`https://keybase.io/${u}/picture` });
      return mk('Keybase','Tech',url,'not_found','api',now,'Keybase API');
    }
    return mk('Keybase','Tech',url,'unverified','generated',now,'Keybase API');
  } catch { return mk('Keybase','Tech',url,'unverified','generated',now,'Keybase API'); }
}

async function checkGravatar(email: string, now: string): Promise<PlatformResult> {
  if (!email) return mk('Gravatar','Identity','https://gravatar.com','unverified','generated',now,'Gravatar JSON API');
  const hash = md5(email.trim().toLowerCase());
  const url = `https://gravatar.com/${hash}`;
  try {
    const r = await fetchWithTimeout(`https://www.gravatar.com/${hash}.json`, 8000);
    if (r.status === 200) {
      const d = await r.json(); const e = d?.entry?.[0];
      return mk('Gravatar','Identity',url,'verified','api',now,'Gravatar JSON API',{ name:e?.displayName, bio:e?.aboutMe, avatarUrl:e?.thumbnailUrl, website:e?.profileUrl });
    }
    return mk('Gravatar','Identity',url,'not_found','api',now,'Gravatar JSON API');
  } catch { return mk('Gravatar','Identity',url,'unverified','generated',now,'Gravatar JSON API'); }
}

async function checkNpm(u: string, now: string): Promise<PlatformResult> {
  const url = `https://www.npmjs.com/~${u}`;
  try {
    const r = await fetchWithTimeout(`https://registry.npmjs.org/-/v1/search?text=maintainer:${u}&size=1`, 8000);
    if (r.status === 200) {
      const d = await r.json();
      if (d?.total > 0) return mk('npm','Tech',url,'verified','api',now,'npm Registry API',{ extraInfo:{ packages:d.total } });
      return mk('npm','Tech',url,'not_found','api',now,'npm Registry API');
    }
    return mk('npm','Tech',url,'unverified','generated',now,'npm Registry API');
  } catch { return mk('npm','Tech',url,'unverified','generated',now,'npm Registry API'); }
}

// ─── Tier 2 & 3: CORS Proxy checks ───────────────────────────────────────────

interface ProxyPlatform {
  name: string; category: string;
  profileUrl: (u: string) => string;
  checkUrl?: (u: string) => string;
  method: 'status' | 'content';
  notFoundMarkers?: string[];
  foundMarkers?: string[];
}

const PROXY_PLATFORMS: ProxyPlatform[] = [
  // Tier 2 — status check (returns proper 404 for missing users)
  { name:'Instagram',   category:'Social',       profileUrl:u=>`https://www.instagram.com/${u}/`,       method:'content', notFoundMarkers:["page isn't available","this account is private","sorry, this page"], foundMarkers:['instagram.com/'+'{u}'] },
  { name:'Medium',      category:'Media',        profileUrl:u=>`https://medium.com/@${u}`,              method:'status' },
  { name:'Pinterest',   category:'Social',       profileUrl:u=>`https://pinterest.com/${u}/`,            method:'status' },
  { name:'Vimeo',       category:'Media',        profileUrl:u=>`https://vimeo.com/${u}`,                method:'status' },
  { name:'SoundCloud',  category:'Media',        profileUrl:u=>`https://soundcloud.com/${u}`,           method:'status' },
  { name:'Behance',     category:'Creative',     profileUrl:u=>`https://www.behance.net/${u}`,          method:'status' },
  { name:'DeviantArt',  category:'Creative',     profileUrl:u=>`https://www.deviantart.com/${u}`,      method:'status' },
  { name:'Spotify',     category:'Media',        profileUrl:u=>`https://open.spotify.com/user/${u}`,   method:'status' },
  { name:'YouTube',     category:'Media',        profileUrl:u=>`https://www.youtube.com/@${u}`,        method:'status' },
  { name:'Twitch',      category:'Media',        profileUrl:u=>`https://www.twitch.tv/${u}`,           method:'status' },
  { name:'Wattpad',     category:'Misc',         profileUrl:u=>`https://www.wattpad.com/user/${u}`,    method:'status' },
  { name:'Patreon',     category:'Misc',         profileUrl:u=>`https://www.patreon.com/${u}`,         method:'status' },
  // Tier 3 — content check (these always return 200, need content scan)
  { name:'Twitter / X', category:'Social',      profileUrl:u=>`https://twitter.com/${u}`,              method:'content', notFoundMarkers:["this account doesn't exist","account suspended"], foundMarkers:['@'+'{u}'] },
  { name:'TikTok',      category:'Social',       profileUrl:u=>`https://www.tiktok.com/@${u}`,         method:'content', notFoundMarkers:["couldn't find this account","page not found"] },
  { name:'Steam',       category:'Gaming',       profileUrl:u=>`https://steamcommunity.com/id/${u}`,   method:'content', notFoundMarkers:['the specified profile could not be found','error 404'] },
  { name:'Telegram',    category:'Messaging',    profileUrl:u=>`https://t.me/${u}`,                    method:'content', notFoundMarkers:['if you have telegram, you can contact'] },
  { name:'Facebook',    category:'Social',       profileUrl:u=>`https://www.facebook.com/${u}`,        method:'content', notFoundMarkers:['page not found','this content isn\'t available','the link you followed may be broken'] },
];

async function runProxyCheck(p: ProxyPlatform, u: string, now: string): Promise<PlatformResult> {
  const url = p.profileUrl(u);
  const checkUrl = p.checkUrl ? p.checkUrl(u) : url;
  const methodLabel = p.method === 'status' ? 'CORS Proxy (HTTP Status)' : 'CORS Proxy (Content Scan)';
  const res = await proxyGet(checkUrl);
  if (!res.ok) return mk(p.name, p.category, url, 'unverified', 'proxy', now, methodLabel);
  if (res.status === 404 || res.status === 410) return mk(p.name, p.category, url, 'not_found', 'proxy', now, methodLabel);
  if (res.status === 200) {
    if (p.method === 'status') return mk(p.name, p.category, url, 'found', 'proxy', now, methodLabel);
    // content scan
    const lc = res.text.toLowerCase();
    const noFoundMarker = p.notFoundMarkers?.some(m => lc.includes(m.replace('{u}', u).toLowerCase()));
    if (noFoundMarker) return mk(p.name, p.category, url, 'not_found', 'proxy', now, methodLabel);
    const foundMarker = p.foundMarkers?.length
      ? p.foundMarkers.some(m => lc.includes(m.replace('{u}', u).toLowerCase()))
      : true;
    return mk(p.name, p.category, url, foundMarker ? 'found' : 'unverified', 'proxy', now, methodLabel);
  }
  return mk(p.name, p.category, url, 'unverified', 'proxy', now, methodLabel);
}

// ─── Tier 4: URL-only platforms ───────────────────────────────────────────────
const URL_ONLY: { name: string; category: string; url: (u: string) => string; reason: string }[] = [
  { name:'LinkedIn',     category:'Professional', url:u=>`https://linkedin.com/in/${u}`,         reason:'Auth wall' },
  { name:'Snapchat',     category:'Social',       url:u=>`https://snapchat.com/add/${u}`,        reason:'Auth wall' },
  { name:'Discord',      category:'Messaging',    url:u=>`https://discord.com/users/${u}`,       reason:'Numeric IDs only' },
  { name:'Tumblr',       category:'Social',       url:u=>`https://${u}.tumblr.com`,              reason:'JS-rendered' },
  { name:'VKontakte',    category:'Social',       url:u=>`https://vk.com/${u}`,                  reason:'Auth wall' },
  { name:'AngelList',    category:'Professional', url:u=>`https://wellfound.com/u/${u}`,         reason:'Auth wall' },
  { name:'Product Hunt', category:'Professional', url:u=>`https://producthunt.com/@${u}`,        reason:'JS-rendered' },
  { name:'About.me',     category:'Professional', url:u=>`https://about.me/${u}`,                reason:'JS-rendered' },
  { name:'Dribbble',     category:'Creative',     url:u=>`https://dribbble.com/${u}`,            reason:'Auth required' },
  { name:'500px',        category:'Creative',     url:u=>`https://500px.com/p/${u}`,             reason:'Auth required' },
  { name:'CodePen',      category:'Creative',     url:u=>`https://codepen.io/${u}`,              reason:'JS-rendered' },
  { name:'Quora',        category:'Forums',       url:u=>`https://quora.com/profile/${u}`,       reason:'Auth wall' },
  { name:'Stack Overflow',category:'Tech',        url:u=>`https://stackoverflow.com/users/?search=${u}`, reason:'Search only' },
  { name:'Replit',       category:'Tech',         url:u=>`https://replit.com/@${u}`,             reason:'JS-rendered' },
  { name:'Ko-fi',        category:'Misc',         url:u=>`https://ko-fi.com/${u}`,               reason:'JS-rendered' },
  { name:'Xbox',         category:'Gaming',       url:u=>`https://xboxgamertag.com/search/${u}`, reason:'JS-rendered' },
  { name:'Roblox',       category:'Gaming',       url:u=>`https://roblox.com/user.aspx?username=${u}`, reason:'Auth required' },
  { name:'Substack',     category:'Media',        url:u=>`https://${u}.substack.com`,            reason:'JS-rendered' },
];

// ─── Batch runner ─────────────────────────────────────────────────────────────
async function runBatched<T>(tasks: (() => Promise<T>)[], size = 5): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += size) {
    const batch = await Promise.all(tasks.slice(i, i + size).map(t => t()));
    results.push(...batch);
  }
  return results;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function runOSINTScan(
  username: string,
  email: string,
  onProgress?: (done: number, total: number, latest: string) => void
): Promise<ScanReport> {
  const now = new Date().toISOString();
  const pUser = username.trim();
  const variations = generateUsernameVariations(pUser);

  // ── Phase 1 totals (WMN count unknown until JSON fetched — we use a large estimate)
  // We'll track done/total across all phases using a shared counter
  const totalApi = 8;
  const totalProxy = PROXY_PLATFORMS.length;
  const totalUrl = URL_ONLY.length;
  // WMN has ~600 sites; we'll update total once fetched
  let totalWMN = 600;
  let total = totalApi + totalProxy + totalUrl + totalWMN;
  let done = 0;
  const progress = (name: string) => { done++; onProgress?.(done, total, name); };

  // ── Tier 1: APIs in parallel
  const [github, gitlab, reddit, hn, devto, keybase, gravatar, npm] = await Promise.all([
    checkGitHub(pUser, now).then(r => { progress('GitHub'); return r; }),
    checkGitLab(pUser, now).then(r => { progress('GitLab'); return r; }),
    checkReddit(pUser, now).then(r => { progress('Reddit'); return r; }),
    checkHackerNews(pUser, now).then(r => { progress('HackerNews'); return r; }),
    checkDevTo(pUser, now).then(r => { progress('Dev.to'); return r; }),
    checkKeybase(pUser, now).then(r => { progress('Keybase'); return r; }),
    checkGravatar(email, now).then(r => { progress('Gravatar'); return r; }),
    checkNpm(pUser, now).then(r => { progress('npm'); return r; }),
  ]);
  const apiResults = [github, gitlab, reddit, hn, devto, keybase, gravatar, npm];

  // ── Tier 2 & 3: Proxy checks in batches of 5
  const proxyTasks = PROXY_PLATFORMS.map(p => async () => {
    const r = await runProxyCheck(p, pUser, now);
    progress(p.name);
    return r;
  });
  const proxyResults = await runBatched(proxyTasks, 5);

  // ── Tier 4: URL-only (instant)
  const urlResults: PlatformResult[] = URL_ONLY.map(p => {
    progress(p.name);
    return mk(p.name, p.category, p.url(pUser || 'unknown'), 'unverified', 'generated', now, `URL only (${p.reason})`);
  });

  // ── Build the set of already-covered platforms (lowercase) for dedup
  const tier1to4 = [...apiResults, ...proxyResults, ...urlResults];
  const coveredNames = new Set(tier1to4.map(r => r.platform.toLowerCase()));

  // ── Tier 5 & Email: Run WMN + email scan concurrently ─────────────────────
  const EMAIL_CHECKS = 18; // pre-estimate for progress total
  if (email) total += EMAIL_CHECKS;

  let wmnResults: PlatformResult[] = [];
  let emailResults: EmailResult[] = [];

  await Promise.all([
    // WMN scan
    runWMNScan(pUser, coveredNames, (wDone, wTotal, wLatest) => {
      if (wDone === 1) { totalWMN = wTotal; total = totalApi + totalProxy + totalUrl + totalWMN + (email ? EMAIL_CHECKS : 0); }
      done++; onProgress?.(done, total, wLatest);
    }).then(r => { wmnResults = r; }).catch(() => {}),

    // Email scan (only if email provided)
    email
      ? runEmailScan(email, (_eDone, _eTotal, eLatest) => {
          done++; onProgress?.(done, total, `Email: ${eLatest}`);
        }).then(r => { emailResults = r; }).catch(() => {})
      : Promise.resolve(),
  ]);

  const allResults = [...tier1to4, ...wmnResults];

  return {
    username: pUser, email, scannedAt: now,
    totalPlatforms: allResults.length,
    verified: allResults.filter(r => r.status === 'verified').length,
    found: allResults.filter(r => r.status === 'found').length,
    notFound: allResults.filter(r => r.status === 'not_found').length,
    unverified: allResults.filter(r => r.status === 'unverified').length,
    results: allResults, usernameVariations: variations,
    emailResults: emailResults.length > 0 ? emailResults : undefined,
  };
}

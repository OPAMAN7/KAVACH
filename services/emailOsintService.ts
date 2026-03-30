/**
 * KAVACH Email OSINT Service — Rewritten for reliability
 * Only checks that confidently return 'found' or 'not_found' are included.
 * GHunt-inspired: identity & Google intelligence
 * Holehe-inspired: registration detection via JSON APIs + 2-step CSRF
 */

const PROXY = 'https://corsproxy.io/?url=';

export type EmailScanStatus = 'found' | 'not_found' | 'unverified';

export interface EmailResult {
  platform: string;
  category: string;
  status: EmailScanStatus;
  url?: string;
  data?: Record<string, any>;
  checkMethod: string;
  checkedAt: string;
  tool: 'ghunt' | 'holehe' | 'api';
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 13000);
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(t); return r;
  } catch { return null; }
}
async function pFetch(url: string, init?: RequestInit): Promise<Response | null> {
  return safeFetch(`${PROXY}${encodeURIComponent(url)}`, init);
}

/** Two-step CSRF helper: GET page → extract token → POST with token */
async function csrf2step(
  pageUrl: string,
  tokenRegex: RegExp,
  actionUrl: string,
  bodyFn: (token: string) => string,
  extraHeaders?: Record<string, string>
): Promise<{ text: string; status: number } | null> {
  const pageR = await pFetch(pageUrl);
  if (!pageR) return null;
  const pageText = await pageR.text().catch(() => '');
  const match = pageText.match(tokenRegex);
  const token = match?.[1] ?? '';
  const r = await pFetch(actionUrl, {
    method: 'POST',
    body: bodyFn(token),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: pageUrl, ...extraHeaders },
  });
  if (!r) return null;
  const text = await r.text().catch(() => '');
  return { text, status: r.status };
}

// ── Result builder ────────────────────────────────────────────────────────────
function er(
  platform: string, category: string, status: EmailScanStatus,
  tool: EmailResult['tool'], checkMethod: string, now: string,
  url?: string, data?: Record<string, any>
): EmailResult {
  return { platform, category, status, url, data, checkMethod, checkedAt: now, tool };
}

// ── Minimal MD5 (for Gravatar) ─────────────────────────────────────────────
function md5(str: string): string {
  function safeAdd(x:number,y:number){const l=(x&0xffff)+(y&0xffff);const m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xffff);}
  function rol(n:number,c:number){return(n<<c)|(n>>>(32-c));}
  function cmn(q:number,a:number,b:number,x:number,s:number,t:number){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(c^(b|~d),a,b,x,s,t);}
  const s=str,n=s.length,st=[1732584193,-271733879,-1732584194,271733878];const blks:number[][]=[];let i:number;
  for(i=0;i<Math.ceil((n+8)/64);i++)blks[i]=new Array(16).fill(0);
  for(i=0;i<n;i++)blks[i>>6][(i%64)>>2]|=s.charCodeAt(i)<<((i%4)<<3);
  blks[n>>6][(n%64)>>2]|=0x80<<((n%4)<<3);blks[Math.ceil((n+8)/64)-1][14]=n*8;
  function cycle(x:number[],k:number[]){
    let[a,b,c,d]=x;
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
  for(let b=0;b<blks.length;b++)cycle(st,blks[b]);
  function rh(n:number){let s='';for(let j=0;j<4;j++)s+='0123456789abcdef'.charAt((n>>(j*8+4))&0xf)+'0123456789abcdef'.charAt((n>>(j*8))&0xf);return s;}
  return st.map(rh).join('');
}

// ════════════════════════════════════════════════════════════════════════════════
// GHunt-inspired — Google Account & Identity Intelligence
// ════════════════════════════════════════════════════════════════════════════════

async function checkGravatar(email: string, now: string): Promise<EmailResult> {
  const hash = md5(email.trim().toLowerCase());
  const url = `https://gravatar.com/${hash}`;
  const r = await safeFetch(`https://www.gravatar.com/${hash}.json`);
  if (r?.status === 200) {
    const d = await r.json().catch(() => null);
    const e = d?.entry?.[0];
    return er('Gravatar', 'Google Intelligence', 'found', 'ghunt', 'Gravatar JSON API', now, url, {
      name: e?.displayName, bio: e?.aboutMe, avatarUrl: e?.thumbnailUrl,
      website: e?.profileUrl, linkedAccounts: e?.accounts?.map((a: any) => a.shortname),
    });
  }
  return er('Gravatar', 'Google Intelligence', r?.status === 404 ? 'not_found' : 'unverified', 'ghunt', 'Gravatar JSON API', now, url);
}

async function checkKeybase(email: string, now: string): Promise<EmailResult> {
  const r = await safeFetch(`https://keybase.io/_/api/1.0/user/lookup.json?email=${encodeURIComponent(email)}`);
  if (r?.status === 200) {
    const d = await r.json().catch(() => null);
    if (d?.them?.length > 0) {
      const u = d.them[0];
      return er('Keybase', 'Identity Intelligence', 'found', 'ghunt', 'Keybase Email Lookup', now,
        `https://keybase.io/${u.basics?.username}`, {
          username: u.basics?.username, name: u.profile?.full_name,
          bio: u.profile?.bio, location: u.profile?.location,
        });
    }
    return er('Keybase', 'Identity Intelligence', 'not_found', 'ghunt', 'Keybase Email Lookup', now);
  }
  return er('Keybase', 'Identity Intelligence', 'unverified', 'ghunt', 'Keybase Email Lookup', now);
}

async function checkGitHubCommits(email: string, now: string): Promise<EmailResult> {
  const r = await safeFetch(
    `https://api.github.com/search/commits?q=author-email:${encodeURIComponent(email)}&per_page=5`,
    { headers: { Accept: 'application/vnd.github.cloak-preview+json' } }
  );
  if (r?.status === 200) {
    const d = await r.json().catch(() => null);
    if (d?.total_count > 0) {
      return er('GitHub Commits', 'Developer Intelligence', 'found', 'ghunt', 'GitHub Commit Search API', now,
        `https://github.com/search?q=author-email%3A${encodeURIComponent(email)}&type=commits`, {
          commitCount: d.total_count,
          repos: (d.items || []).map((i: any) => i.repository?.full_name).filter(Boolean),
          authorName: d.items?.[0]?.commit?.author?.name,
        });
    }
    return er('GitHub Commits', 'Developer Intelligence', 'not_found', 'ghunt', 'GitHub Commit Search API', now);
  }
  return er('GitHub Commits', 'Developer Intelligence', 'unverified', 'ghunt', 'GitHub Commit Search API', now);
}

async function checkEmailRep(email: string, now: string): Promise<EmailResult> {
  const r = await pFetch(`https://emailrep.io/${encodeURIComponent(email)}`);
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    if (d) {
      const status = d.reputation !== 'none' ? 'found' : 'not_found';
      return er('EmailRep.io', 'Breach Intelligence', status, 'api', 'EmailRep.io Reputation API', now,
        `https://emailrep.io/${email}`, {
          reputation: d.reputation, suspicious: d.suspicious, references: d.references,
          credentials_leaked: d.details?.credentials_leaked, data_breach: d.details?.data_breach,
          malicious_activity: d.details?.malicious_activity,
          profiles: d.details?.profiles || [], last_seen: d.details?.last_seen,
        });
    }
  }
  return er('EmailRep.io', 'Breach Intelligence', 'unverified', 'api', 'EmailRep.io API', now);
}

// ════════════════════════════════════════════════════════════════════════════════
// Holehe-inspired — Registration Detection (JSON API endpoints, no CSRF)
// ════════════════════════════════════════════════════════════════════════════════

async function checkSpotify(email: string, now: string): Promise<EmailResult> {
  const r = await pFetch(
    `https://spclient.wg.spotify.com/signup/public/v1/account?validate=1&email=${encodeURIComponent(email)}`
  );
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    if (d?.status === 20) return er('Spotify', 'Registration Detection', 'found', 'holehe', 'Holehe — Signup Validation API', now, 'https://spotify.com');
    if (d?.status === 1)  return er('Spotify', 'Registration Detection', 'not_found', 'holehe', 'Holehe — Signup Validation API', now, 'https://spotify.com');
  }
  return er('Spotify', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Signup Validation API', now, 'https://spotify.com');
}

async function checkDuolingo(email: string, now: string): Promise<EmailResult> {
  const r = await pFetch(`https://www.duolingo.com/2017-06-30/users?email=${encodeURIComponent(email)}`);
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    const users = d?.users ?? [];
    if (users.length > 0) {
      const u = users[0];
      return er('Duolingo', 'Registration Detection', 'found', 'holehe', 'Holehe — User Email Search API', now,
        `https://www.duolingo.com/profile/${u.username}`, {
          username: u.username, name: u.name, streak: u.streak, learningLanguage: u.learningLanguage,
        });
    }
    return er('Duolingo', 'Registration Detection', 'not_found', 'holehe', 'Holehe — User Email Search API', now, 'https://duolingo.com');
  }
  return er('Duolingo', 'Registration Detection', 'unverified', 'holehe', 'Holehe — User Email Search API', now, 'https://duolingo.com');
}

async function checkDiscord(email: string, now: string): Promise<EmailResult> {
  // Discord forgot-password endpoint: 200 = email exists, 400 = not found
  const r = await pFetch('https://discord.com/api/v9/auth/forgot', {
    method: 'POST',
    body: JSON.stringify({ login: email }),
    headers: { 'Content-Type': 'application/json' },
  });
  if (r) {
    if (r.status === 200) return er('Discord', 'Registration Detection', 'found', 'holehe', 'Holehe — Forgot Password API', now, 'https://discord.com');
    if (r.status === 400) {
      const d = await r.json().catch(() => null);
      // 400 with "Unknown User" or login error = not found
      const msg = JSON.stringify(d || '').toLowerCase();
      if (msg.includes('unknown user') || msg.includes('invalid') || msg.includes('login')) {
        return er('Discord', 'Registration Detection', 'not_found', 'holehe', 'Holehe — Forgot Password API', now, 'https://discord.com');
      }
    }
    if (r.status === 429) return er('Discord', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Forgot Password API (rate limited)', now, 'https://discord.com');
  }
  return er('Discord', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Forgot Password API', now, 'https://discord.com');
}

async function checkTwitter(email: string, now: string): Promise<EmailResult> {
  const r = await pFetch(`https://api.twitter.com/i/users/email_available.json?email=${encodeURIComponent(email)}`);
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    if (d?.valid === false && d?.reason === 'error.email_duplicate') {
      return er('Twitter / X', 'Registration Detection', 'found', 'holehe', 'Holehe — Email Availability API', now, 'https://x.com');
    }
    if (d?.valid === true) {
      return er('Twitter / X', 'Registration Detection', 'not_found', 'holehe', 'Holehe — Email Availability API', now, 'https://x.com');
    }
  }
  return er('Twitter / X', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Email Availability API', now, 'https://x.com');
}

async function checkPinterest(email: string, now: string): Promise<EmailResult> {
  const data = JSON.stringify({ options: { email }, context: {} });
  const r = await pFetch(
    `https://www.pinterest.com/resource/EmailsResource/get/?source_url=/&data=${encodeURIComponent(data)}`
  );
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    const isTaken = d?.resource_response?.data?.is_taken;
    if (isTaken === true)  return er('Pinterest', 'Registration Detection', 'found', 'holehe', 'Holehe — Email Check API', now, 'https://pinterest.com');
    if (isTaken === false) return er('Pinterest', 'Registration Detection', 'not_found', 'holehe', 'Holehe — Email Check API', now, 'https://pinterest.com');
  }
  return er('Pinterest', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Email Check API', now, 'https://pinterest.com');
}

async function checkAirbnb(email: string, now: string): Promise<EmailResult> {
  const r = await pFetch(
    `https://www.airbnb.com/api/v2/email_lookup?email=${encodeURIComponent(email)}&key=d306zoyjsgj3pnz`
  );
  if (r?.ok) {
    const d = await r.json().catch(() => null);
    const active = d?.email_lookup?.is_account_active;
    if (active === true)  return er('Airbnb', 'Registration Detection', 'found', 'holehe', 'Holehe — Email Lookup API', now, 'https://airbnb.com');
    if (active === false) return er('Airbnb', 'Registration Detection', 'not_found', 'holehe', 'Holehe — Email Lookup API', now, 'https://airbnb.com');
  }
  return er('Airbnb', 'Registration Detection', 'unverified', 'holehe', 'Holehe — Email Lookup API', now, 'https://airbnb.com');
}

// ════════════════════════════════════════════════════════════════════════════════
// Holehe — 2-Step CSRF (GET form → extract token → POST with token)
// ════════════════════════════════════════════════════════════════════════════════

async function checkWordPress(email: string, now: string): Promise<EmailResult> {
  const res = await csrf2step(
    'https://wordpress.com/wp-login.php?action=lostpassword',
    /name="_wpnonce"\s+value="([^"]+)"/,
    'https://wordpress.com/wp-login.php?action=lostpassword',
    (token) => new URLSearchParams({ user_login: email, redirect_to: '', action: 'lostpassword', _wpnonce: token }).toString()
  );
  if (res) {
    const lc = res.text.toLowerCase();
    if (lc.includes('check your email') || lc.includes('we have sent') || lc.includes('mail sent')) {
      return er('WordPress.com', 'Registration Detection', 'found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://wordpress.com');
    }
    if (lc.includes('no account') || lc.includes('invalid username') || lc.includes('no user found')) {
      return er('WordPress.com', 'Registration Detection', 'not_found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://wordpress.com');
    }
  }
  return er('WordPress.com', 'Registration Detection', 'unverified', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://wordpress.com');
}

async function checkDropbox(email: string, now: string): Promise<EmailResult> {
  // Step 1: GET forgot page to extract CSRF token (Dropbox uses 't' field)
  const res = await csrf2step(
    'https://www.dropbox.com/forgot',
    /(?:name="t"|"csrf_token"[:\s]+")\s*(?:value=")?([a-zA-Z0-9_\-]{10,})/,
    'https://www.dropbox.com/forgot',
    (token) => new URLSearchParams({ email, t: token }).toString()
  );
  if (res) {
    const lc = res.text.toLowerCase();
    if (lc.includes('check your email') || lc.includes('reset your password') || lc.includes('email has been sent')) {
      return er('Dropbox', 'Registration Detection', 'found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://dropbox.com');
    }
    if (lc.includes("can't find") || lc.includes('not found') || lc.includes('no account')) {
      return er('Dropbox', 'Registration Detection', 'not_found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://dropbox.com');
    }
  }
  return er('Dropbox', 'Registration Detection', 'unverified', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://dropbox.com');
}

async function checkSnapchat(email: string, now: string): Promise<EmailResult> {
  // Step 1: GET Snapchat recovery form to extract xsrf_token
  const res = await csrf2step(
    'https://accounts.snapchat.com/accounts/password_reset_email_form',
    /(?:xsrf_token|_xsrf|csrfToken)['":\s]+['"]([^'"]+)['"]/,
    'https://accounts.snapchat.com/accounts/password_reset_email_form',
    (token) => new URLSearchParams({ email, xsrf_token: token }).toString(),
    { Origin: 'https://accounts.snapchat.com' }
  );
  if (res) {
    const lc = res.text.toLowerCase();
    if (lc.includes('check your email') || lc.includes('sent a link') || lc.includes('email sent')) {
      return er('Snapchat', 'Registration Detection', 'found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://snapchat.com');
    }
    if (lc.includes("can't find") || lc.includes('not associated') || lc.includes('no account')) {
      return er('Snapchat', 'Registration Detection', 'not_found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://snapchat.com');
    }
  }
  return er('Snapchat', 'Registration Detection', 'unverified', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://snapchat.com');
}

async function checkLastfm(email: string, now: string): Promise<EmailResult> {
  const res = await csrf2step(
    'https://www.last.fm/user/recover',
    /name="csrfmiddlewaretoken"\s+value="([^"]+)"/,
    'https://www.last.fm/user/recover',
    (token) => new URLSearchParams({ usernameOrEmail: email, csrfmiddlewaretoken: token }).toString(),
    { Origin: 'https://www.last.fm' }
  );
  if (res) {
    const lc = res.text.toLowerCase();
    if (lc.includes('email has been sent') || lc.includes('recovery email') || lc.includes('check your inbox')) {
      return er('Last.fm', 'Registration Detection', 'found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://last.fm');
    }
    if (lc.includes("couldn't find") || lc.includes('no account') || lc.includes('not found')) {
      return er('Last.fm', 'Registration Detection', 'not_found', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://last.fm');
    }
  }
  return er('Last.fm', 'Registration Detection', 'unverified', 'holehe', 'Holehe — 2-Step CSRF Password Reset', now, 'https://last.fm');
}

// ════════════════════════════════════════════════════════════════════════════════
// Main export
// ════════════════════════════════════════════════════════════════════════════════

const CHECKS: Array<(email: string, now: string) => Promise<EmailResult>> = [
  // GHunt-inspired
  checkGravatar, checkKeybase, checkGitHubCommits, checkEmailRep,
  // Holehe JSON APIs (no CSRF)
  checkSpotify, checkDuolingo, checkDiscord, checkTwitter,
  checkPinterest, checkAirbnb,
  // Holehe 2-step CSRF
  checkWordPress, checkDropbox, checkSnapchat, checkLastfm,
];

export async function runEmailScan(
  email: string,
  onProgress?: (done: number, total: number, latest: string) => void
): Promise<EmailResult[]> {
  if (!email?.trim()) return [];
  const now = new Date().toISOString();
  const results: EmailResult[] = [];
  let done = 0;

  // Run in batches of 4
  const BATCH = 4;
  for (let i = 0; i < CHECKS.length; i += BATCH) {
    const batch = CHECKS.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(fn => fn(email, now)));
    for (const r of batchResults) {
      results.push(r);
      done++;
      onProgress?.(done, CHECKS.length, r.platform);
    }
  }

  return results;
}

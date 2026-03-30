import { ForumPost, ThreatSeverity, ThreatSector, ThreatType } from '../types';
import { fetchParseHubData } from './parseHubService';

// Using corsproxy.io as it is generally more reliable for JSON APIs than allorigins
const PROXY_URL = 'https://corsproxy.io/?';

// GitHub Credentials
const GITHUB_TOKEN = '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';

// --- API ENDPOINTS ---
const HN_API = 'https://hn.algolia.com/api/v1/search_by_date?query=ransomware+OR+data+breach+OR+cyberattack+OR+vulnerability&tags=story&hitsPerPage=15';
const DEVTO_API = 'https://dev.to/api/articles?tag=security&per_page=10';
const LOBSTERS_API = 'https://lobste.rs/t/security.json';
const GITHUB_ADVISORIES_API = 'https://api.github.com/advisories?per_page=10';
const THREATFOX_API = 'https://threatfox-api.abuse.ch/api/v1/';
const CISA_API = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1/urls/recent/';
const FEODO_API = 'https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json';
const GNEWS_RSS = 'https://news.google.com/rss/search?q=cyber+attack+OR+data+breach+OR+ransomware+India+when:2d&hl=en-IN&gl=IN&ceid=IN:en';
const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=10';
const STACKOVERFLOW_API = 'https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=vulnerability&site=stackoverflow';
const FULL_DISCLOSURE_RSS = 'https://seclists.org/rss/fulldisclosure.rss';
const ALIENVAULT_OTX_API = 'https://otx.alienvault.com/api/v1/pulses/activity';

// Reddit Config
const SUBREDDITS = [
    'cybersecurity', 'netsec', 'hacking', 'blackhat', 'redteamsec', 'threatintel', 'Malware', 
    'ReverseEngineering', 'pwned', 'fulldisclosure', 'InfoSec', 'ApplicationSecurity', 'bugbounty', 
    'crypto', 'Bitcoin', 'Ethereum', 'darknet', 'Tor', 'privacy', 'sysadmin', 'networking', 'devops', 
    'linux', 'programming', 'technology', 'hardware', 'software', 'security', 'howtohack', 'pentesting',
    'ComputerSecurity', 'antiforensics', 'socialengineering', 'OSINT', 'privacytoolsIO', 'masterhacker',
    'india', 'indianews', 'india_tech', 'developersIndia', 'bangalore', 'mumbai', 'delhi', 'hyderabad',
    'worldnews', 'geopolitics', 'IndiaSpeaks', 'IndianDefense', 'ISRO', 'UPSC'
].join('+');

const KEYWORDS = '(breach OR leak OR hacked OR ransomware OR malware OR "data dump" OR vulnerability OR "0day" OR "zero day" OR "sql injection" OR ddos OR "cyber attack" OR "database dump" OR "admin panel" OR "root access" OR "indian infrastructure" OR "threat intel" OR "apt group" OR "cve" OR "exploit" OR "phishing campaign" OR "NIC.in" OR "gov.in" OR "Aadhaar" OR "NPCI" OR "UPI leak" OR "AIIMS hack" OR "PowerGrid attack" OR "ISRO leak" OR "DRDO exploit" OR "Indian Railways hack")';

const GITHUB_QUERY = '("password leak" OR "database dump" OR "hacked india" OR "gov.in leak" OR "ransomware" OR "auth bypass" OR "admin credentials" OR "sql dump" OR "indian government leak") sort:updated';

const REDDIT_API = `https://www.reddit.com/r/${SUBREDDITS}/search.json?q=${encodeURIComponent(KEYWORDS)}&sort=new&limit=25&restrict_sr=1`;

// --- HELPER CONSTANTS ---
const CRITICAL_KEYWORDS = ['0day', 'zero-day', 'rce', 'breach', 'leak', 'database dump', 'admin', 'root', 'ransomware', 'leaked credentials', 'exploited'];

const SECTOR_KEYWORDS: Record<string, ThreatSector> = {
  'bank': ThreatSector.FINANCE,
  'finance': ThreatSector.FINANCE,
  'crypto': ThreatSector.FINANCE,
  'money': ThreatSector.FINANCE,
  'upi': ThreatSector.FINANCE,
  'grid': ThreatSector.ENERGY,
  'power': ThreatSector.ENERGY,
  'oil': ThreatSector.ENERGY,
  'gas': ThreatSector.ENERGY,
  'army': ThreatSector.DEFENSE,
  'military': ThreatSector.DEFENSE,
  'defense': ThreatSector.DEFENSE,
  'navy': ThreatSector.DEFENSE,
  'drdo': ThreatSector.DEFENSE,
  'hospital': ThreatSector.HEALTHCARE,
  'medical': ThreatSector.HEALTHCARE,
  'health': ThreatSector.HEALTHCARE,
  'telecom': ThreatSector.TELECOM,
  'isp': ThreatSector.TELECOM,
  'jio': ThreatSector.TELECOM,
  'airtel': ThreatSector.TELECOM,
  'train': ThreatSector.TRANSPORT,
  'railway': ThreatSector.TRANSPORT,
  'irctc': ThreatSector.TRANSPORT,
  'airline': ThreatSector.TRANSPORT,
  'flight': ThreatSector.TRANSPORT,
  'airport': ThreatSector.TRANSPORT
};

// --- MAIN FETCH FUNCTION ---
export const fetchRealThreats = async (): Promise<ForumPost[]> => {
  try {
    const [
      redditThreats, 
      githubThreats, 
      parseHubThreats,
      hnThreats,
      cisaThreats,
      urlhausThreats,
      feodoThreats,
      gnewsThreats,
      nvdThreats,
      soThreats,
      fdThreats,
      otxThreats,
      devtoThreats,
      lobstersThreats,
      ghAdvisories,
      threatFoxThreats
    ] = await Promise.all([
      fetchRedditThreats(),
      fetchGitHubThreats(),
      fetchParseHubData(),
      fetchHackerNewsThreats(),
      fetchCISAExploits(),
      fetchURLHausThreats(),
      fetchFeodoTracker(),
      fetchGoogleNewsThreats(),
      fetchNVDThreats(),
      fetchStackOverflowThreats(),
      fetchFullDisclosureThreats(),
      fetchAlienVaultOTX(),
      fetchDevToThreats(),
      fetchLobstersThreats(),
      fetchGitHubAdvisories(),
      fetchThreatFoxIOCs()
    ]);

    let allThreats = [
      ...redditThreats, 
      ...githubThreats, 
      ...parseHubThreats,
      ...hnThreats,
      ...cisaThreats,
      ...urlhausThreats,
      ...feodoThreats,
      ...gnewsThreats,
      ...nvdThreats,
      ...soThreats,
      ...fdThreats,
      ...otxThreats,
      ...devtoThreats,
      ...lobstersThreats,
      ...ghAdvisories,
      ...threatFoxThreats
    ];

    // Deduplicate by ID
    const uniqueThreats = Array.from(new Map(allThreats.map(item => [item.id, item])).values());

    // Sort by timestamp (newest first)
    return uniqueThreats.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  } catch (error) {
    console.error("Failed to fetch merged threats:", error);
    return [];
  }
};

// --- INDIVIDUAL FETCHERS ---

// 1. Hacker News
const fetchHackerNewsThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(HN_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        return data.hits.map((hit: any) => ({
            id: `hn-${hit.objectID}`,
            source: 'Hacker News',
            author: hit.author,
            timestamp: hit.created_at,
            content: hit.title || hit.story_title || 'Security Discussion',
            rawContent: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.MEDIUM,
            sector: detectSector(hit.title),
            keywords: ['security', 'news'],
            credibilityScore: 90,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("HN Fetch Error", e); return []; }
};

// 2. CISA Known Exploited Vulnerabilities
const fetchCISAExploits = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(`${PROXY_URL}${CISA_API}`);
        if(!response.ok) return [];
        const data = await response.json();
        
        // Get last 10 added vulnerabilities
        const recent = data.vulnerabilities
            .sort((a: any, b: any) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
            .slice(0, 10);

        return recent.map((vuln: any) => ({
            id: `cisa-${vuln.cveID}`,
            source: 'US-CISA',
            author: 'CISA.gov',
            timestamp: vuln.dateAdded,
            content: `[Active Exploit] ${vuln.vulnerabilityName} (${vuln.cveID})`,
            rawContent: vuln.shortDescription,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.CRITICAL, // CISA KEV are critical by definition
            sector: ThreatSector.DEFENSE,
            keywords: ['cve', 'exploit', vuln.product],
            entities: [vuln.cveID, vuln.vendorProject, vuln.product],
            credibilityScore: 100,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("CISA Fetch Error", e); return []; }
};

// 3. URLhaus (Malware URLs)
const fetchURLHausThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(URLHAUS_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        // Use 'urls' key from response
        const urls = data.urls ? data.urls.slice(0, 10) : [];
        
        return urls.map((u: any) => ({
            id: `urlhaus-${u.id}`,
            source: 'Abuse.ch URLhaus',
            author: u.reporter,
            timestamp: u.date_added,
            content: `[Malware Host] ${u.url_status === 'online' ? 'ONLINE' : 'OFFLINE'} - ${u.threat} detected`,
            rawContent: u.url,
            type: ThreatType.MALWARE,
            severity: ThreatSeverity.HIGH,
            sector: ThreatSector.TELECOM,
            keywords: ['malware', 'phishing', ...((u.tags || []))],
            entities: [u.url, ...(u.tags || [])],
            credibilityScore: 95,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("URLhaus Fetch Error", e); return []; }
};

// 4. Feodo Tracker (Botnets)
const fetchFeodoTracker = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(FEODO_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        // Take last 8 entries
        const botnets = data.slice(0, 8);
        
        return botnets.map((b: any) => ({
            id: `feodo-${b.ip_address}-${b.port}`,
            source: 'Feodo Tracker',
            author: 'Abuse.ch',
            timestamp: b.first_seen_utc,
            content: `[Botnet C2] ${b.malware} C2 Server detected at ${b.ip_address}:${b.port}`,
            rawContent: `IP: ${b.ip_address} | Malware: ${b.malware} | Status: ${b.status}`,
            type: ThreatType.MALWARE,
            severity: ThreatSeverity.HIGH,
            sector: ThreatSector.TELECOM,
            keywords: ['botnet', 'c2', b.malware],
            entities: [b.ip_address, b.malware],
            credibilityScore: 95,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("Feodo Fetch Error", e); return []; }
};

// 5. Google News RSS
const fetchGoogleNewsThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(GNEWS_RSS)}`);
        if(!response.ok) return [];
        const text = await response.text();
        
        // Simple XML parsing
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item')).slice(0, 10);
        
        return items.map((item, idx) => {
            const title = item.querySelector('title')?.textContent || 'News Alert';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
            const source = item.querySelector('source')?.textContent || 'Google News';
            
            return {
                id: `gnews-${idx}-${Date.now()}`,
                source: `News: ${source}`,
                author: 'Google News',
                timestamp: new Date(pubDate).toISOString(),
                content: title,
                rawContent: link,
                type: title.toLowerCase().includes('leak') ? ThreatType.LEAK : ThreatType.ATTACK_DISCUSSION,
                severity: ThreatSeverity.MEDIUM,
                sector: detectSector(title),
                keywords: ['news', 'india', 'cyber'],
                credibilityScore: 80,
                isAnalyzed: false
            };
        });
    } catch(e) { console.warn("GNews Fetch Error", e); return []; }
};

// 6. NVD (National Vulnerability Database)
const fetchNVDThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(NVD_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        return (data.vulnerabilities || []).map((v: any) => {
            const cve = v.cve;
            return {
                id: `nvd-${cve.id}`,
                source: 'NIST NVD',
                author: cve.sourceIdentifier,
                timestamp: cve.published,
                content: `[CVE] ${cve.id}: ${cve.descriptions[0]?.value.substring(0, 100)}...`,
                rawContent: cve.descriptions[0]?.value,
                type: ThreatType.ATTACK_DISCUSSION,
                severity: ThreatSeverity.HIGH,
                sector: detectSector(cve.descriptions[0]?.value),
                keywords: ['cve', 'vulnerability', cve.id],
                entities: [cve.id],
                credibilityScore: 100,
                isAnalyzed: false
            };
        });
    } catch(e) { console.warn("NVD Fetch Error", e); return []; }
};

// 7. StackOverflow
const fetchStackOverflowThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(STACKOVERFLOW_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        return (data.items || []).map((item: any) => ({
            id: `so-${item.question_id}`,
            source: 'StackOverflow',
            author: item.owner.display_name,
            timestamp: new Date(item.creation_date * 1000).toISOString(),
            content: `[SO] ${item.title}`,
            rawContent: item.link,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.LOW,
            sector: detectSector(item.title),
            keywords: ['stackoverflow', 'code', 'security'],
            credibilityScore: 70,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("SO Fetch Error", e); return []; }
};

// 8. Full Disclosure (Seclists)
const fetchFullDisclosureThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(FULL_DISCLOSURE_RSS)}`);
        if(!response.ok) return [];
        const text = await response.text();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = Array.from(xml.querySelectorAll('item')).slice(0, 10);
        
        return items.map((item, idx) => ({
            id: `fd-${idx}-${Date.now()}`,
            source: 'Full Disclosure',
            author: 'Seclists',
            timestamp: new Date(item.querySelector('pubDate')?.textContent || new Date()).toISOString(),
            content: `[FD] ${item.querySelector('title')?.textContent || 'Vulnerability Report'}`,
            rawContent: item.querySelector('link')?.textContent || '',
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.HIGH,
            sector: detectSector(item.querySelector('title')?.textContent || ''),
            keywords: ['fulldisclosure', 'mailinglist', 'exploit'],
            credibilityScore: 95,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("FD Fetch Error", e); return []; }
};

// 9. AlienVault OTX
const fetchAlienVaultOTX = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(ALIENVAULT_OTX_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        return (data.results || []).slice(0, 10).map((pulse: any) => ({
            id: `otx-${pulse.id}`,
            source: 'AlienVault OTX',
            author: pulse.author_name,
            timestamp: pulse.created,
            content: `[OTX Pulse] ${pulse.name}`,
            rawContent: `https://otx.alienvault.com/pulse/${pulse.id}`,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: pulse.adversary ? ThreatSeverity.HIGH : ThreatSeverity.MEDIUM,
            sector: detectSector(pulse.name + ' ' + (pulse.description || '')),
            keywords: ['otx', 'threatintel', ...(pulse.tags || [])],
            entities: pulse.indicators_count > 0 ? [`${pulse.indicators_count} indicators`] : [],
            credibilityScore: 90,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("OTX Fetch Error", e); return []; }
};

// 10. Dev.to (Security Blogs)
const fetchDevToThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(DEVTO_API);
        if(!response.ok) return [];
        const data = await response.json();
        
        return data.map((article: any) => ({
            id: `devto-${article.id}`,
            source: 'Dev.to',
            author: article.user.name,
            timestamp: article.published_at,
            content: `[Blog] ${article.title}`,
            rawContent: article.url,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.LOW,
            sector: detectSector(article.title + ' ' + (article.description || '')),
            keywords: ['blog', 'devto', ...(article.tag_list || [])],
            credibilityScore: 85,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("Dev.to Fetch Error", e); return []; }
};

// 11. Lobste.rs (Security News)
const fetchLobstersThreats = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(LOBSTERS_API)}`);
        if(!response.ok) return [];
        const data = await response.json();
        
        return data.map((item: any) => ({
            id: `lobsters-${item.short_id}`,
            source: 'Lobste.rs',
            author: item.submitter_user,
            timestamp: item.created_at,
            content: `[News] ${item.title}`,
            rawContent: item.url || item.comments_url,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: ThreatSeverity.MEDIUM,
            sector: detectSector(item.title + ' ' + (item.description || '')),
            keywords: ['news', 'lobsters', ...(item.tags || [])],
            credibilityScore: 90,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("Lobste.rs Fetch Error", e); return []; }
};

// 12. GitHub Security Advisories
const fetchGitHubAdvisories = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(GITHUB_ADVISORIES_API, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if(!response.ok) return [];
        const data = await response.json();
        
        return data.map((adv: any) => ({
            id: `gh-adv-${adv.ghsa_id}`,
            source: 'GitHub Advisories',
            author: adv.author?.login || 'GitHub Security',
            timestamp: adv.published_at,
            content: `[Advisory] ${adv.summary}`,
            rawContent: adv.html_url,
            type: ThreatType.ATTACK_DISCUSSION,
            severity: adv.severity === 'critical' ? ThreatSeverity.CRITICAL : (adv.severity === 'high' ? ThreatSeverity.HIGH : ThreatSeverity.MEDIUM),
            sector: detectSector(adv.summary + ' ' + adv.description),
            keywords: ['github', 'advisory', adv.ghsa_id, ...(adv.identifiers?.map((i: any) => i.value) || [])],
            entities: [adv.ghsa_id, ...(adv.identifiers?.map((i: any) => i.value) || [])],
            credibilityScore: 100,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("GitHub Advisories Fetch Error", e); return []; }
};

// 13. ThreatFox (IOCs)
const fetchThreatFoxIOCs = async (): Promise<ForumPost[]> => {
    try {
        const response = await fetch(THREATFOX_API, {
            method: 'POST',
            body: JSON.stringify({ query: 'get_iocs', days: 1 })
        });
        if(!response.ok) return [];
        const data = await response.json();
        
        if (data.query_status !== 'ok') return [];
        
        return (data.data || []).slice(0, 10).map((ioc: any) => ({
            id: `threatfox-${ioc.id}`,
            source: 'ThreatFox',
            author: ioc.reporter,
            timestamp: ioc.first_seen,
            content: `[IOC] ${ioc.threat_type_desc}: ${ioc.ioc_value}`,
            rawContent: `Type: ${ioc.ioc_type} | Malware: ${ioc.malware_printable} | Confidence: ${ioc.confidence_level}%`,
            type: ThreatType.MALWARE,
            severity: ioc.confidence_level > 75 ? ThreatSeverity.HIGH : ThreatSeverity.MEDIUM,
            sector: detectSector(ioc.malware_printable || ''),
            keywords: ['ioc', 'threatfox', ioc.malware_printable, ioc.threat_type],
            entities: [ioc.ioc_value, ioc.malware_printable],
            credibilityScore: ioc.confidence_level,
            isAnalyzed: false
        }));
    } catch(e) { console.warn("ThreatFox Fetch Error", e); return []; }
};

// --- EXISTING REDDIT & GITHUB FETCHERS ---

const fetchRedditThreats = async (): Promise<ForumPost[]> => {
    try {
        const targetUrl = encodeURIComponent(REDDIT_API);
        const response = await fetch(`${PROXY_URL}${targetUrl}`);
        
        if (!response.ok) return [];
        
        const data = await response.json();
        if (!data.data || !data.data.children) return [];

        return data.data.children.map((child: any) => mapRedditPostToForumPost(child.data));
    } catch (error) {
        console.warn("Reddit fetch failed:", error);
        return [];
    }
}

const fetchGitHubThreats = async (): Promise<ForumPost[]> => {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(GITHUB_QUERY)}&per_page=15`;
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
    };

    try {
        let response;
        try {
            response = await fetch(url, {
                headers: { ...headers, 'Authorization': `token ${GITHUB_TOKEN}` }
            });
        } catch (e) {
            console.warn("GitHub Network Error (Authenticated):", e);
        }

        if (response && response.status === 401) {
            response = await fetch(url, { headers });
        }

        if (!response || !response.ok) {
            return [];
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            return [];
        }

        return (data.items || []).map(mapGitHubToPost);

    } catch (error) {
        return [];
    }
}

// --- UTILS ---

const detectSector = (text: string): ThreatSector => {
    const lower = text.toLowerCase();
    for (const [key, val] of Object.entries(SECTOR_KEYWORDS)) {
        if (lower.includes(key)) return val;
    }
    return ThreatSector.FINANCE; // Default
};

const mapGitHubToPost = (data: any): ForumPost => {
    const content = `${data.title} \n ${data.body ? data.body.substring(0, 200) : ''}`;
    const lowerContent = content.toLowerCase();

    let severity = ThreatSeverity.MEDIUM;
    if (CRITICAL_KEYWORDS.some(k => lowerContent.includes(k))) severity = ThreatSeverity.HIGH;
    if (lowerContent.includes('password') || lowerContent.includes('secret')) severity = ThreatSeverity.CRITICAL;

    return {
        id: `gh-${data.id}`,
        source: 'GitHub',
        author: data.user?.login || 'unknown',
        timestamp: data.updated_at || data.created_at,
        content: `[GitHub Issue] ${data.title}`,
        rawContent: data.html_url,
        type: lowerContent.includes('leak') ? ThreatType.LEAK : ThreatType.ATTACK_DISCUSSION,
        severity: severity,
        sector: detectSector(content),
        keywords: ['github', ...CRITICAL_KEYWORDS.filter(k => lowerContent.includes(k))],
        credibilityScore: 85, 
        isAnalyzed: false
    };
}

const mapRedditPostToForumPost = (data: any): ForumPost => {
  const content = data.title + (data.selftext ? `\n${data.selftext.substring(0, 150)}...` : '');
  const lowerContent = content.toLowerCase();

  let severity = ThreatSeverity.LOW;
  const isIndianThreat = lowerContent.includes('india') || lowerContent.includes('gov.in') || lowerContent.includes('nic.in') || lowerContent.includes('aadhaar') || lowerContent.includes('upi');

  if (CRITICAL_KEYWORDS.some(k => lowerContent.includes(k))) {
    severity = isIndianThreat ? ThreatSeverity.CRITICAL : ThreatSeverity.HIGH;
    if (data.ups > 100 || lowerContent.includes('urgent') || lowerContent.includes('critical')) {
        severity = ThreatSeverity.CRITICAL;
    }
  } else if (lowerContent.includes('warning') || lowerContent.includes('alert') || lowerContent.includes('security')) {
    severity = isIndianThreat ? ThreatSeverity.HIGH : ThreatSeverity.MEDIUM;
  } else if (isIndianThreat) {
    severity = ThreatSeverity.MEDIUM;
  }

  let type = ThreatType.ATTACK_DISCUSSION;
  if (lowerContent.includes('leak') || lowerContent.includes('dump') || lowerContent.includes('database')) {
      type = ThreatType.LEAK;
  } else if (lowerContent.includes('malware') || lowerContent.includes('virus') || lowerContent.includes('ransomware')) {
      type = ThreatType.MALWARE;
  } else if (lowerContent.includes('ddos')) {
      type = ThreatType.DDOS;
  }

  return {
    id: data.id,
    source: `r/${data.subreddit}`,
    author: data.author,
    timestamp: new Date(data.created_utc * 1000).toISOString(),
    content: data.title,
    rawContent: data.selftext || data.url,
    type: type,
    severity: severity,
    sector: detectSector(content),
    keywords: [data.subreddit, ...CRITICAL_KEYWORDS.filter(k => lowerContent.includes(k))],
    credibilityScore: Math.min(100, Math.floor(data.upvote_ratio * 100)),
    isAnalyzed: false
  };
};
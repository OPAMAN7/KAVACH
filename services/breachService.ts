import { BreachData, DomainIntel, HunterEmailVerify, HunterDomainInfo, HunterEmailFinderResult } from "../types";
import { getAppConfig } from "./configService";

// --- HELPER FOR MOCKING HUNTER ---
const mockHunterEmailVerify = (email: string): HunterEmailVerify => {
  const isCompany = !email.endsWith('gmail.com') && !email.endsWith('yahoo.com');
  const isValid = !email.includes('fake');
  return {
    status: isValid ? (isCompany ? 'valid' : 'webmail') : 'invalid',
    score: isValid ? (isCompany ? 95 : 70) : 10,
    regexp: true,
    gibberish: false,
    disposable: false,
    webmail: !isCompany,
    mx_records: true,
    smtp_server: true,
    smtp_check: true,
    accept_all: false
  };
};

const mockHunterDomainInfo = (domain: string): HunterDomainInfo => ({
  domain: domain,
  organization: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + " Inc.",
  country: "US",
  state: "CA",
  description: "A leading technology company in the sector.",
  pattern: "{first}.{last}",
  twitter: `https://twitter.com/${domain.split('.')[0]}`,
  linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
  technologies: ["Google Cloud", "React", "Node.js"],
  emails: [
    { value: `contact@${domain}`, type: "generic", position: "Support", first_name: "Support", last_name: "Team" },
    { value: `ceo@${domain}`, type: "personal", position: "CEO", first_name: "John", last_name: "Doe", linkedin: "http://linkedin.com/in/johndoe" },
    { value: `admin@${domain}`, type: "generic", position: "IT Admin", first_name: "Sys", last_name: "Admin" }
  ]
});

const mockHunterEmailFinder = (domain: string, first: string, last: string): HunterEmailFinderResult => ({
  email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
  score: 88,
  position: "Manager",
  source: "Domain Search",
  first_name: first,
  last_name: last,
  company: domain,
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com"
});

// --- MAIN SERVICES ---

export const verifyEmailHunter = async (email: string): Promise<HunterEmailVerify | null> => {
  const { hunterApiKey } = getAppConfig();
  if (!hunterApiKey) return mockHunterEmailVerify(email);

  try {
    const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterApiKey}`);
    const data = await response.json();
    if (data.data) {
      return data.data as HunterEmailVerify;
    }
    return mockHunterEmailVerify(email);
  } catch (error) {
    console.error("Hunter Verify Error:", error);
    return mockHunterEmailVerify(email);
  }
};

export const searchDomainHunter = async (domain: string): Promise<HunterDomainInfo | null> => {
  const { hunterApiKey } = getAppConfig();
  if (!hunterApiKey) return mockHunterDomainInfo(domain);
  
  try {
    const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=10`);
    const data = await response.json();
    if (data.data) {
      const d = data.data;
      return {
        domain: d.domain,
        organization: d.organization || "Unknown Org",
        country: d.country || "Unknown",
        state: d.state || "",
        description: d.description || "",
        pattern: d.pattern || "unknown",
        twitter: d.twitter || undefined,
        facebook: d.facebook || undefined,
        linkedin: d.linkedin || undefined,
        instagram: d.instagram || undefined,
        technologies: d.technologies || [],
        emails: d.emails || []
      };
    }
    return mockHunterDomainInfo(domain);
  } catch (error) {
    console.error("Hunter Domain Search Error:", error);
    return mockHunterDomainInfo(domain);
  }
};

export const findEmailHunter = async (domain: string, firstName: string, lastName: string): Promise<HunterEmailFinderResult | null> => {
    const { hunterApiKey } = getAppConfig();
    if (!hunterApiKey) return mockHunterEmailFinder(domain, firstName, lastName);

    try {
        const response = await fetch(`https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${hunterApiKey}`);
        const data = await response.json();
        
        if (data.data) {
            const d = data.data;
            return {
                email: d.email,
                score: d.score,
                position: d.position || "Unknown",
                source: d.source || "Hunter.io",
                first_name: d.first_name,
                last_name: d.last_name,
                company: d.company || domain,
                twitter: d.twitter,
                linkedin: d.linkedin
            };
        }
        return null;
    } catch (error) {
        console.error("Hunter Email Finder Error:", error);
        return null;
    }
};

// --- EXISTING SERVICES ---

export const checkEmailBreach = async (email: string): Promise<BreachData[] | null> => {
  const { hibpApiKey } = getAppConfig();
  let combinedBreaches: BreachData[] = [];
  const processedNames = new Set<string>();

  try {
    const response = await fetch(`https://api.xposedornot.com/v1/check-email/${email}`);
    if (response.status !== 404) {
      const data = await response.json();
      if (!data.Error && data.Breaches_Details) {
        data.Breaches_Details.forEach((b: any) => {
          if (!processedNames.has(b.breach)) {
             processedNames.add(b.breach);
             combinedBreaches.push({
                Name: b.breach,
                Title: b.breach,
                Domain: b.domain || 'unknown',
                BreachDate: b.breach_date,
                Description: b.description,
                DataClasses: b.xposed_data?.split(';') || [],
                LogoType: 'png',
                Source: 'XposeOrNot'
             });
          }
        });
      }
    }
  } catch (error) {
    console.error("XposeOrNot API Error:", error);
  }

  if (hibpApiKey) {
    try {
      const hibpResponse = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${email}?truncateResponse=false`, {
        headers: {
          'hibp-api-key': hibpApiKey,
          'user-agent': 'Kavach-App'
        }
      });
      
      if (hibpResponse.ok) {
        const hibpData = await hibpResponse.json();
        hibpData.forEach((b: any) => {
          if (!processedNames.has(b.Name)) {
             processedNames.add(b.Name);
             combinedBreaches.push({
                Name: b.Name,
                Title: b.Title,
                Domain: b.Domain,
                BreachDate: b.BreachDate,
                Description: b.Description,
                DataClasses: b.DataClasses,
                LogoType: b.LogoPath, 
                Source: 'HIBP'
             });
          }
        });
      }
    } catch (error) {
      console.error("HIBP API Error:", error);
    }
  }

  return combinedBreaches;
};

export const checkPasswordLeak = async (password: string): Promise<number> => {
  const buffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  const prefix = hashHex.substring(0, 5);
  const suffix = hashHex.substring(5);
  
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    const lines = text.split('\n');
    const match = lines.find(line => line.startsWith(suffix));
    
    if (match) {
      return parseInt(match.split(':')[1], 10);
    }
    return 0;
  } catch (error) {
    console.error("HIBP Password API Error:", error);
    return -1;
  }
};

export const checkDomainReputation = async (domain: string): Promise<DomainIntel | null> => {
  const { vtApiKey } = getAppConfig();
  
  if (!vtApiKey) {
      return null;
  }

  try {
    // SECURITY NOTE: In a production environment, API calls should be routed through a backend server.
    // Calling VirusTotal directly from the browser triggers CORS errors.
    // We use a CORS proxy here to demonstrate functionality in a pure client-side environment.
    const targetUrl = `https://www.virustotal.com/api/v3/domains/${domain}`;
    // Using corsproxy.io to bypass CORS
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'x-apikey': vtApiKey,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        console.error("VirusTotal API Error:", response.status, response.statusText);
        try {
           const err = await response.json();
           console.error("Details:", err);
        } catch(e) {}
        return null;
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.data || !data.data.attributes) {
        console.error("Unexpected VirusTotal response format", data);
        return null;
    }

    const attr = data.data.attributes;

    return {
        reputation: attr.reputation || 0,
        last_analysis_stats: attr.last_analysis_stats || { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0 },
        total_votes: attr.total_votes || { harmless: 0, malicious: 0 },
        categories: attr.categories || {},
        registrar: attr.registrar,
        creation_date: attr.creation_date,
        last_update_date: attr.last_update_date,
        tags: attr.tags || [],
        whois: attr.whois,
        last_dns_records: attr.last_dns_records,
        popularity_ranks: attr.popularity_ranks,
        last_https_certificate: attr.last_https_certificate,
        jarm: attr.jarm,
        raw_data: data
    };

  } catch (error) {
    console.error("VirusTotal Fetch Error:", error);
    return null;
  }
};
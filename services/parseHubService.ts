import { getAppConfig } from './configService';
import { ForumPost, ThreatSector, ThreatSeverity, ThreatType } from '../types';

const PROXY_URL = 'https://corsproxy.io/?';
const BASE_URL = 'https://www.parsehub.com/api/v2';

// Fetch all projects associated with the API Key
export const fetchParseHubProjects = async () => {
  const { parseHubApiKey } = getAppConfig();
  if (!parseHubApiKey) return [];
  
  try {
    const url = `${BASE_URL}/projects?api_key=${parseHubApiKey}`;
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.projects || [];
  } catch (e) {
    console.error("ParseHub Projects Error:", e);
    return [];
  }
};

// Fetch data from all active projects
export const fetchParseHubData = async (): Promise<ForumPost[]> => {
  const { parseHubApiKey } = getAppConfig();
  if (!parseHubApiKey) return [];

  try {
    const projects = await fetchParseHubProjects();
    if (projects.length === 0) return [];

    const allPosts: ForumPost[] = [];

    // Fetch data for each project
    for (const project of projects) {
        if (!project.last_ready_run) continue;

        const url = `${BASE_URL}/projects/${project.token}/last_ready_run/data?api_key=${parseHubApiKey}`;
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        
        if (response.ok) {
            const data = await response.json();
            const posts = mapParseHubToPosts(data, project.title);
            allPosts.push(...posts);
        }
    }
    return allPosts;
  } catch (e) {
    console.error("ParseHub Fetch Error:", e);
    return [];
  }
};

// Trigger a new run for all projects
export const triggerParseHubScrape = async (): Promise<boolean> => {
    const { parseHubApiKey } = getAppConfig();
    if (!parseHubApiKey) return false;

    try {
        const projects = await fetchParseHubProjects();
        if (projects.length === 0) return false;

        const results = await Promise.all(projects.map(async (project: any) => {
            const url = `${BASE_URL}/projects/${project.token}/run?api_key=${parseHubApiKey}`;
            const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`, {
                method: 'POST'
            });
            return response.ok;
        }));

        return results.some(r => r === true);
    } catch (e) {
        console.error("ParseHub Trigger Error:", e);
        return false;
    }
};

// Heuristic mapping to convert arbitrary scraped JSON to our ForumPost format
const mapParseHubToPosts = (data: any, sourceName: string): ForumPost[] => {
    // 1. Flatten data: ParseHub usually returns { "selection1": [...] }
    let items: any[] = [];
    
    if (Array.isArray(data)) {
        items = data;
    } else if (typeof data === 'object' && data !== null) {
        // Look for the first array property which likely contains the list of scraped items
        for (const key in data) {
            if (Array.isArray(data[key])) {
                items = data[key];
                break;
            }
        }
        // If no array found, treat the object itself as a single item if it has meaningful keys
        if (items.length === 0 && (data.title || data.name || data.text)) {
            items = [data];
        }
    }

    return items.map((item, index) => {
        // Try to find common content fields
        const title = item.title || item.name || item.header || item.headline || 'Scraped Intelligence';
        const body = item.description || item.body || item.text || item.content || item.summary || JSON.stringify(item);
        const url = item.url || item.link || item.href || '';
        const author = item.author || item.user || item.creator || 'ParseHub Scraper';
        
        const fullContent = `${title}\n${body}`;
        
        // Basic keyword detection for type
        const lowerContent = fullContent.toLowerCase();
        let type = ThreatType.ATTACK_DISCUSSION;
        if (lowerContent.includes('leak') || lowerContent.includes('database')) type = ThreatType.LEAK;
        if (lowerContent.includes('malware') || lowerContent.includes('ransomware')) type = ThreatType.MALWARE;

        return {
            id: `ph-${sourceName}-${index}-${Date.now()}`,
            source: `ParseHub: ${sourceName}`,
            author: author,
            timestamp: new Date().toISOString(), // Scraped data might not have a date, default to now
            content: fullContent.length > 500 ? fullContent.substring(0, 500) + '...' : fullContent,
            rawContent: url || fullContent,
            type: type,
            severity: ThreatSeverity.MEDIUM, // Default
            sector: ThreatSector.DEFENSE, // Default
            keywords: ['scraped', sourceName.toLowerCase(), 'parsehub'],
            entities: [],
            credibilityScore: 70,
            isAnalyzed: false
        };
    });
}
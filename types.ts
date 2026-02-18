
export enum ThreatSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum ThreatSector {
  ENERGY = 'Energy',
  FINANCE = 'Finance',
  TELECOM = 'Telecom',
  DEFENSE = 'Defense',
  TRANSPORT = 'Transport',
  HEALTHCARE = 'Healthcare',
}

export enum ThreatType {
  LEAK = 'Credential Leak',
  ATTACK_DISCUSSION = 'Attack Discussion',
  MALWARE = 'Malware Distribution',
  DDOS = 'DDoS Planning'
}

export interface ForumPost {
  id: string;
  source: string;
  author: string;
  timestamp: string;
  content: string;
  rawContent?: string;
  type: ThreatType;
  severity: ThreatSeverity;
  sector: ThreatSector;
  keywords: string[];
  entities?: string[]; // New: For IOCs (IPs, Malware names, etc)
  credibilityScore: number; // 0-100
  isAnalyzed: boolean;
  analysisSummary?: string;
}

export interface DashboardStats {
  totalLeaks: number;
  activeThreats: number;
  criticalAlerts: number;
  monitoredSources: number;
}

export interface AIAnalysisResult {
  severity: ThreatSeverity;
  sector: ThreatSector;
  keywords: string[];
  entities: string[];
  summary: string;
  credibilityScore: number;
  isThreat: boolean;
}

export interface BreachData {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  LogoType: string;
  Source?: 'XposeOrNot' | 'HIBP';
}

export interface DomainIntel {
  // VirusTotal Attributes
  reputation: number;
  last_analysis_stats: {
    harmless: number;
    malicious: number;
    suspicious: number;
    undetected: number;
    timeout: number;
  };
  total_votes: {
    harmless: number;
    malicious: number;
  };
  categories: Record<string, string>;
  registrar?: string;
  creation_date?: number;
  last_update_date?: number;
  tags: string[];
  whois?: string;
  last_dns_records?: any[];
  popularity_ranks?: Record<string, { rank: number; timestamp: number }>;
  last_https_certificate?: any;
  jarm?: string;
  // Raw Data for complete visibility
  raw_data?: any;
}

export interface HunterEmailVerify {
  status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
  score: number;
  regexp: boolean;
  gibberish: boolean;
  disposable: boolean;
  webmail: boolean;
  mx_records: boolean;
  smtp_server: boolean;
  smtp_check: boolean;
  accept_all: boolean;
}

export interface HunterEmailFinderResult {
  email: string;
  score: number;
  position: string;
  source: string;
  twitter?: string;
  linkedin?: string;
  first_name: string;
  last_name: string;
  company: string;
}

export interface HunterDomainInfo {
  domain: string;
  organization: string;
  country: string;
  state: string;
  description: string;
  pattern: string; // e.g., {first}.{last}@domain.com
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  technologies: string[];
  emails: {
    value: string;
    type: string;
    position: string;
    first_name: string;
    last_name: string;
    linkedin?: string;
    twitter?: string;
    phone_number?: string;
  }[];
}

export interface ComprehensiveEmailReport {
  breaches: BreachData[];
  hunterStatus: HunterEmailVerify | null;
  email: string;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  hunterApiKey: string;
  hibpApiKey: string;
  vtApiKey: string;
  parseHubApiKey: string;
}

export interface HistoryLog {
  id: string;
  created_at: string;
  query_type: 'email' | 'domain' | 'person' | 'password';
  query_value: string;
  summary: string;
  full_data: any;
}

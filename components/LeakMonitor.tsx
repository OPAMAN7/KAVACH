import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, Database, Globe, Lock, Briefcase, UserCheck, Building, User, Linkedin, Twitter, Facebook, MapPin, Activity, Server, FileText, Share2 } from 'lucide-react';
import { checkEmailBreach, checkPasswordLeak, checkDomainReputation, verifyEmailHunter, searchDomainHunter, findEmailHunter } from '../services/breachService';
import { getOrganizationIntel, searchSocialMedia } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { saveToHistory } from '../services/supabaseClient';
import { BreachData, DomainIntel, HunterEmailVerify, HunterDomainInfo, HunterEmailFinderResult, OrganizationIntel } from '../types';

export const LeakMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'person' | 'domain' | 'password' | 'social'>('email');
  
  // Email State
  const [email, setEmail] = useState('');
  const [breaches, setBreaches] = useState<BreachData[] | null>(null);
  const [hunterVerify, setHunterVerify] = useState<HunterEmailVerify | null>(null);
  const [orgIntel, setOrgIntel] = useState<OrganizationIntel | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSearched, setEmailSearched] = useState(false);

  // Person Finder State
  const [personDomain, setPersonDomain] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personResult, setPersonResult] = useState<HunterEmailFinderResult | null>(null);
  const [personLoading, setPersonLoading] = useState(false);

  // Password State
  const [password, setPassword] = useState('');
  const [leakCount, setLeakCount] = useState<number | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Domain State
  const [domain, setDomain] = useState('');
  const [domainIntel, setDomainIntel] = useState<DomainIntel | null>(null);
  const [hunterDomain, setHunterDomain] = useState<HunterDomainInfo | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);
  const [showRawVt, setShowRawVt] = useState(false);

  // Social OSINT State
  const [socialUsername, setSocialUsername] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const [socialIntel, setSocialIntel] = useState<{ text: string; groundingMetadata?: any } | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  // Helper for DNS descriptions
  const getDnsDescription = (type: string) => {
    const map: Record<string, string> = {
        'A': 'IPv4 Host Address (Maps domain to IP)',
        'AAAA': 'IPv6 Host Address (Modern IP mapping)',
        'MX': 'Mail Exchange (Routes email traffic)',
        'NS': 'Name Server (Authoritative DNS source)',
        'TXT': 'Text Record (Verification & SPF/DKIM)',
        'CNAME': 'Canonical Name (Alias to another domain)',
        'SOA': 'Start of Authority (Zone metadata)',
        'PTR': 'Pointer (Reverse DNS lookup)',
        'SRV': 'Service Location (Specific port/protocol)',
        'CAA': 'Certificate Authority Authorization',
        'DS': 'Delegation Signer (DNSSEC)',
        'DNSKEY': 'DNS Key (DNSSEC Public Key)'
    };
    return map[type.toUpperCase()] || 'Standard DNS Resource Record';
  };

  // Custom Threat Scoring Logic
  const calculateThreatScore = (stats: any) => {
    const { malicious, suspicious, harmless, undetected } = stats;
    const total = malicious + suspicious + harmless + undetected || 1;

    // 1. Critical: If ANY malicious hits exist
    if (malicious > 0) {
        // Score > 80. 
        // Logic: Base 80, add 2 points per malicious vendor, cap at 100.
        const score = Math.min(100, 80 + (malicious * 5)); 
        return { 
            score, 
            color: 'text-[#dc2626]', 
            label: 'CRITICAL RISK',
            desc: 'Malicious activity detected by security vendors.'
        };
    }

    // 2. Suspicious: If Suspicious is the majority (more than harmless & undetected)
    if (suspicious > harmless && suspicious > undetected) {
        // Score 40-80.
        // Logic: Base 40 + ratio * 40
        const ratio = suspicious / total;
        const score = Math.floor(40 + (ratio * 40));
        return { 
            score, 
            color: 'text-[#d97706]', 
            label: 'SUSPICIOUS',
            desc: 'High level of suspicious activity reported.'
        };
    }

    // 3. Unknown: If Undetected is the majority
    if (undetected > harmless && undetected > suspicious) {
        // Score 15-40.
        // Logic: Base 15 + ratio * 25
        const ratio = undetected / total;
        const score = Math.floor(15 + (ratio * 25));
        return { 
            score, 
            color: 'text-[#666]', // Grey/Blue
            label: 'UNCERTAIN',
            desc: 'Not enough data or unrated by most vendors.'
        };
    }

    // 4. Safe: If Harmless is majority (or default fallback)
    // Score 0-15.
    // Logic: 15 minus ratio. The more harmless, the closer to 0.
    const ratio = harmless / total;
    const score = Math.floor(Math.max(0, 15 - (ratio * 15)));
    return { 
        score, 
        color: 'text-[#16a34a]', 
        label: 'CLEAN',
        desc: 'Domain is rated safe by most vendors.'
    };
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    setEmailSearched(true);
    
    const [breachResult, verifyResult] = await Promise.all([
        checkEmailBreach(email),
        verifyEmailHunter(email)
    ]);

    // Fetch Organization Intel if it's a company email
    if (email.includes('@') && !email.endsWith('gmail.com') && !email.endsWith('yahoo.com') && !email.endsWith('outlook.com') && !email.endsWith('hotmail.com')) {
        const domain = email.split('@')[1];
        getOrganizationIntel(domain).then(intel => setOrgIntel(intel));
    } else {
        setOrgIntel(null);
    }

    if ((!breachResult || breachResult.length === 0) && email.includes('demo')) {
        setBreaches([
            {
                Name: "000webhost",
                Title: "000webhost",
                Domain: "000webhost.com",
                BreachDate: "2015-03-01",
                Description: "In approx March 2015, the free web hosting provider 000webhost suffered a major data breach.",
                DataClasses: ["Email addresses", "IP addresses", "Names", "Passwords"],
                LogoType: "png",
                Source: 'XposeOrNot'
            }
        ]);
    } else {
        setBreaches(breachResult || []);
    }
    
    setHunterVerify(verifyResult);
    
    const summary = `${(breachResult || []).length} Breaches found. Status: ${verifyResult?.status || 'Unknown'}`;
    await saveToHistory('email', email, summary, { breaches: breachResult, hunter: verifyResult, orgIntel: orgIntel });

    setEmailLoading(false);
  };

  const handlePersonFind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personDomain || !firstName || !lastName) return;
    setPersonLoading(true);
    const result = await findEmailHunter(personDomain, firstName, lastName);
    setPersonResult(result);
    
    const summary = result ? `Found: ${result.email} (${result.score}%)` : 'Person not found';
    await saveToHistory('person', `${firstName} ${lastName} @ ${personDomain}`, summary, result);

    setPersonLoading(false);
  };

  const handlePasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setPwLoading(true);
    const count = await checkPasswordLeak(password);
    setLeakCount(count);
    
    const masked = '*'.repeat(password.length);
    const summary = count > 0 ? `Leaked ${count} times` : 'Safe';
    await saveToHistory('password', masked, summary, { leakCount: count });

    setPwLoading(false);
  };

  const handleDomainCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    setDomainLoading(true);
    
    const [intel, hunter] = await Promise.all([
        checkDomainReputation(domain),
        searchDomainHunter(domain)
    ]);
    
    setDomainIntel(intel);
    setHunterDomain(hunter);
    
    const summary = `VT Reputation: ${intel?.reputation || 'N/A'}. Hunter Org: ${hunter?.organization || 'Unknown'}`;
    await saveToHistory('domain', domain, summary, { intel, hunter });

    setDomainLoading(false);
  };

  const handleSocialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUsername) return;
    setSocialLoading(true);
    try {
      const result = await searchSocialMedia(socialUsername, socialEmail);
      setSocialIntel(result);
      await saveToHistory('social', `${socialUsername} (${socialEmail || 'no email'})`, 'Social OSINT Search Completed', result);
    } catch (error) {
      console.error("Social Search Error:", error);
    }
    setSocialLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#f5f5f0] border border-[#d4d0c8] rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-[#111] mb-6 flex items-center gap-2">
          <Database className="text-[#e8521a]" />
          LEAK MONITOR & INTEL
        </h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#e8e6e0] mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('email')} className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'email' ? 'text-[#e8521a]' : 'text-[#666] hover:text-[#111]'}`}>
            Email Intelligence
            {activeTab === 'email' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e8521a]"></span>}
          </button>
          <button onClick={() => setActiveTab('person')} className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'person' ? 'text-[#e8521a]' : 'text-[#666] hover:text-[#111]'}`}>
            Person Finder
            {activeTab === 'person' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e8521a]"></span>}
          </button>
           <button onClick={() => setActiveTab('domain')} className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'domain' ? 'text-[#e8521a]' : 'text-[#666] hover:text-[#111]'}`}>
            Domain Intel (Company)
            {activeTab === 'domain' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e8521a]"></span>}
          </button>
          <button onClick={() => setActiveTab('social')} className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'social' ? 'text-[#e8521a]' : 'text-[#666] hover:text-[#111]'}`}>
            Social OSINT
            {activeTab === 'social' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e8521a]"></span>}
          </button>
          <button onClick={() => setActiveTab('password')} className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'password' ? 'text-[#e8521a]' : 'text-[#666] hover:text-[#111]'}`}>
            Password Audit
            {activeTab === 'password' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#e8521a]"></span>}
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleEmailCheck} className="flex gap-4 mb-8">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email to scan breaches and verify..." className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                <button type="submit" disabled={emailLoading} className="bg-[#e8521a] hover:bg-[#c73f0a] text-[#111] px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  {emailLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Search className="w-4 h-4" />}
                  FULL SCAN
                </button>
              </form>

              {emailSearched && !emailLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        {hunterVerify && (
                            <div className="bg-white border border-[#d4d0c8] rounded p-4 h-full">
                                <h3 className="text-[#e8521a] font-bold mb-3 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    VALIDATION STATUS
                                </h3>
                                <div className="text-center py-4 border-b border-[#f0efe8] mb-4">
                                    <div className="text-sm text-[#666] uppercase tracking-widest mb-1">Deliverability</div>
                                    <div className={`text-4xl font-mono font-bold ${hunterVerify.score > 80 ? 'text-[#16a34a]' : hunterVerify.score > 50 ? 'text-[#d97706]' : 'text-[#dc2626]'}`}>
                                        {hunterVerify.score}/100
                                    </div>
                                    <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        hunterVerify.status === 'valid' ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#dc2626]/20 text-[#dc2626]'
                                    }`}>
                                        {hunterVerify.status}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-[#666]">MX Records</span><span className={hunterVerify.mx_records ? 'text-[#16a34a]' : 'text-[#dc2626]'}>{hunterVerify.mx_records ? 'VALID' : 'INVALID'}</span></div>
                                    <div className="flex justify-between"><span className="text-[#666]">SMTP Server</span><span className={hunterVerify.smtp_server ? 'text-[#16a34a]' : 'text-[#dc2626]'}>{hunterVerify.smtp_server ? 'ACTIVE' : 'DOWN'}</span></div>
                                    <div className="flex justify-between"><span className="text-[#666]">Disposable</span><span className={hunterVerify.disposable ? 'text-[#dc2626]' : 'text-[#16a34a]'}>{hunterVerify.disposable ? 'YES' : 'NO'}</span></div>
                                     <div className="flex justify-between"><span className="text-[#666]">Accept All</span><span className="text-[#111]">{hunterVerify.accept_all ? 'YES' : 'NO'}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white border border-[#d4d0c8] rounded p-4 h-full">
                             <h3 className="text-[#dc2626] font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />BREACH DATA</h3>
                            {breaches && breaches.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="bg-[#fef2f2] border border-[#dc2626] rounded p-3 text-sm text-[#dc2626] font-bold">Found in {breaches.length} data breaches.</div>
                                    {breaches.map((breach, idx) => (
                                    <div key={idx} className="bg-[#f5f5f0] border border-[#e8e6e0] p-4 rounded hover:border-[#999] transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div><h4 className="font-bold text-[#111] text-md">{breach.Title}</h4><span className="text-xs text-[#888] bg-[#f5f5f0] px-2 py-0.5 rounded ml-2 border border-[#f0efe8]">{breach.Source || 'Unknown Source'}</span></div>
                                            <span className="text-xs font-mono text-[#666]">{breach.BreachDate}</span>
                                        </div>
                                        <p className="text-sm text-[#333] mb-3 line-clamp-2" dangerouslySetInnerHTML={{__html: breach.Description}}></p>
                                        <div className="flex flex-wrap gap-2">{breach.DataClasses.map((dc, i) => (<span key={i} className="text-[10px] bg-white text-[#e8521a] px-2 py-1 rounded border border-[#e8e6e0]">{dc}</span>))}</div>
                                    </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8"><CheckCircle className="w-10 h-10 text-[#16a34a] mx-auto mb-3" /><p className="text-[#333]">No breaches found.</p></div>
                            )}
                        </div>
                    </div>

                    {/* ORGANIZATION INTELLIGENCE SECTION */}
                    {orgIntel && (
                      <div className="lg:col-span-3 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white border border-[#fbd5c0] rounded-lg p-6 shadow-sm">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-[#111] flex items-center gap-2">
                                <Building className="text-[#e8521a]" />
                                {orgIntel.name.toUpperCase()}
                              </h3>
                              <p className="text-[#666] text-sm mt-1">{orgIntel.description}</p>
                            </div>
                            <div className="flex gap-3">
                              {orgIntel.website && (
                                <a href={orgIntel.website.startsWith('http') ? orgIntel.website : `https://${orgIntel.website}`} target="_blank" rel="noopener noreferrer" className="bg-[#f5f5f0] hover:bg-[#e8e6e0] p-2 rounded border border-[#d4d0c8] transition-colors text-[#e8521a]" title="Website">
                                  <Globe className="w-5 h-5" />
                                </a>
                              )}
                              {orgIntel.linkedin && (
                                <a href={orgIntel.linkedin} target="_blank" rel="noopener noreferrer" className="bg-[#f5f5f0] hover:bg-[#e8e6e0] p-2 rounded border border-[#d4d0c8] transition-colors text-[#e8521a]" title="LinkedIn">
                                  <Linkedin className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Main Person */}
                            <div className="bg-[#f8f7f4] border border-[#e8e6e0] p-4 rounded">
                              <h4 className="text-[#e8521a] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                <User className="w-3 h-3" />
                                Main Person in Charge
                              </h4>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-[#111] font-bold">{orgIntel.mainPerson.name}</div>
                                  <div className="text-[#666] text-xs">{orgIntel.mainPerson.title}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {orgIntel.mainPerson.website && (
                                    <a href={orgIntel.mainPerson.website.startsWith('http') ? orgIntel.mainPerson.website : `https://${orgIntel.mainPerson.website}`} target="_blank" rel="noopener noreferrer" className="text-[#e8521a] hover:text-[#111] transition-colors">
                                      <Globe className="w-4 h-4" />
                                    </a>
                                  )}
                                  {orgIntel.mainPerson.linkedin && (
                                    <a href={orgIntel.mainPerson.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#e8521a] hover:text-[#111] transition-colors">
                                      <Linkedin className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Authorities */}
                            <div className="bg-[#f8f7f4] border border-[#e8e6e0] p-4 rounded">
                              <h4 className="text-[#e8521a] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Leadership & Authorities
                              </h4>
                              <div className="space-y-3">
                                {orgIntel.authorities.map((auth, i) => (
                                  <div key={i} className="flex justify-between items-center border-b border-[#e8e6e0] pb-2 last:border-0 last:pb-0">
                                    <div>
                                      <div className="text-[#111] text-sm font-medium">{auth.name}</div>
                                      <div className="text-[#888] text-[10px]">{auth.title}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {auth.website && (
                                        <a href={auth.website.startsWith('http') ? auth.website : `https://${auth.website}`} target="_blank" rel="noopener noreferrer" className="text-[#e8521a] hover:text-[#111] transition-colors">
                                          <Globe className="w-3 h-3" />
                                        </a>
                                      )}
                                      {auth.linkedin && (
                                        <a href={auth.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#e8521a] hover:text-[#111] transition-colors">
                                          <Linkedin className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* People Working */}
                            <div className="bg-[#f8f7f4] border border-[#e8e6e0] p-4 rounded">
                              <h4 className="text-[#e8521a] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Identified Employees
                              </h4>
                              <div className="space-y-3">
                                {orgIntel.employees.map((emp, i) => (
                                  <div key={i} className="flex flex-col border-b border-[#e8e6e0] pb-2 last:border-0 last:pb-0">
                                    <div className="text-[#111] text-sm font-medium">{emp.name}</div>
                                    <div className="flex justify-between items-center">
                                      <div className="text-[#888] text-[10px]">{emp.title}</div>
                                      <div className="text-[#e8521a] text-[10px] font-mono">{emp.email}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* PERSON FINDER TAB */}
          {activeTab === 'person' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-[#f8f7f4] border border-[#e8e6e0] rounded p-4 mb-6 text-sm text-[#333]">
                    <User className="inline w-4 h-4 mr-2 text-[#e8521a]" />
                    Enter a target's name and company domain to discover their verified email address and social handles.
                </div>
                <form onSubmit={handlePersonFind} className="flex flex-col md:flex-row gap-4 mb-8">
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                     <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                     <input type="text" value={personDomain} onChange={(e) => setPersonDomain(e.target.value)} placeholder="Company Domain" className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                    <button type="submit" disabled={personLoading} className="bg-[#e8521a] hover:bg-[#c73f0a] text-[#111] px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap">
                        {personLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Search className="w-4 h-4" />}
                        FIND PERSON
                    </button>
                </form>
                {personResult ? (
                     <div className="bg-[#f5f5f0] border border-[#d4d0c8] rounded-lg p-6 max-w-2xl mx-auto">
                        <div className="flex items-start justify-between mb-6">
                            <div><h3 className="text-xl font-bold text-[#111] mb-1">{personResult.first_name} {personResult.last_name}</h3><p className="text-[#666]">{personResult.position}</p><p className="text-xs text-[#888] uppercase tracking-widest mt-1">{personResult.company}</p></div>
                            <div className="text-right"><div className="text-sm text-[#666] mb-1">Confidence Score</div><div className={`text-2xl font-bold font-mono ${personResult.score > 80 ? 'text-[#16a34a]' : 'text-[#d97706]'}`}>{personResult.score}%</div></div>
                        </div>
                        <div className="bg-white p-4 rounded border border-[#e8e6e0] mb-6 flex items-center justify-between">
                            <div><span className="text-xs text-[#888] uppercase block mb-1">Verified Email</span><span className="text-lg text-[#e8521a] font-mono tracking-wide">{personResult.email}</span></div>
                             <div className="flex gap-2">
                                {personResult.linkedin && <a href={personResult.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-[#f5f5f0] rounded hover:text-[#111] text-[#666] transition-colors"><Linkedin className="w-4 h-4" /></a>}
                                 {personResult.twitter && <a href={personResult.twitter} target="_blank" rel="noreferrer" className="p-2 bg-[#f5f5f0] rounded hover:text-[#111] text-[#666] transition-colors"><Twitter className="w-4 h-4" /></a>}
                             </div>
                        </div>
                     </div>
                ) : (personLoading ? null : (personDomain && firstName && <div className="text-center text-[#666]">No public email found for this profile.</div>))}
            </div>
          )}

          {/* DOMAIN TAB */}
          {activeTab === 'domain' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <form onSubmit={handleDomainCheck} className="flex gap-4 mb-8">
                <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Enter domain (e.g. example.com)..." className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                <button type="submit" disabled={domainLoading} className="bg-[#e8521a] hover:bg-[#c73f0a] text-[#111] px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  {domainLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Globe className="w-4 h-4" />}
                  ANALYZE DOMAIN
                </button>
              </form>

              {!domainIntel && !hunterDomain && !domainLoading && (
                  <div className="text-center text-[#666] py-10">Enter a domain to fetch comprehensive intelligence from VirusTotal and Hunter.io</div>
              )}

              {(domainIntel || hunterDomain) && !domainLoading && (
                  <div className="space-y-5">
                     {/* 1. VirusTotal Reputation Section */}
                     {domainIntel && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* Reputation Score */}
                             <div className="bg-white border border-[#e8e6e0] p-6 rounded text-center md:col-span-1">
                                <div className="text-sm text-[#666] uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><Shield className="w-4 h-4" /> THREAT SCORE</div>
                                {(() => {
                                    const threat = calculateThreatScore(domainIntel.last_analysis_stats);
                                    return (
                                        <>
                                            <div className={`text-6xl font-mono font-bold mb-2 ${threat.color}`}>{threat.score}</div>
                                            <div className={`text-sm font-bold tracking-widest mb-4 ${threat.color}`}>{threat.label}</div>
                                            <p className="text-xs text-[#666] mb-4 px-2">{threat.desc}</p>
                                        </>
                                    );
                                })()}
                                
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-[#f5f5f0] p-2 rounded text-[#dc2626]">Malicious: {domainIntel.last_analysis_stats.malicious}</div>
                                    <div className="bg-[#f5f5f0] p-2 rounded text-[#d97706]">Suspicious: {domainIntel.last_analysis_stats.suspicious}</div>
                                    <div className="bg-[#f5f5f0] p-2 rounded text-[#16a34a]">Harmless: {domainIntel.last_analysis_stats.harmless}</div>
                                    <div className="bg-[#f5f5f0] p-2 rounded text-[#333]">Undetected: {domainIntel.last_analysis_stats.undetected}</div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#f0efe8]">
                                    <div className="text-[10px] text-[#888] uppercase tracking-widest mb-2">Community Votes</div>
                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[#16a34a] font-bold text-lg">{domainIntel.total_votes.harmless}</span>
                                            <span className="text-[9px] text-[#888] uppercase">Harmless</span>
                                        </div>
                                        <div className="h-8 w-[1px] bg-[#f5f5f0]"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[#dc2626] font-bold text-lg">{domainIntel.total_votes.malicious}</span>
                                            <span className="text-[9px] text-[#888] uppercase">Malicious</span>
                                        </div>
                                    </div>
                                </div>
                             </div>
                             
                             {/* Basic Info */}
                             <div className="bg-white border border-[#e8e6e0] p-6 rounded md:col-span-2">
                                <h4 className="text-[#e8521a] font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> ANALYSIS DETAILS</h4>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div>
                                        <label className="text-[#888] text-xs uppercase block">Registrar</label>
                                        <span className="text-[#111]">{domainIntel.registrar || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <label className="text-[#888] text-xs uppercase block">Creation Date</label>
                                        <span className="text-[#111]">{domainIntel.creation_date ? new Date(domainIntel.creation_date * 1000).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <label className="text-[#888] text-xs uppercase block">Last Update</label>
                                        <span className="text-[#111]">{domainIntel.last_update_date ? new Date(domainIntel.last_update_date * 1000).toLocaleDateString() : 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <label className="text-[#888] text-xs uppercase block">VT Reputation Score</label>
                                        <span className={`font-mono font-bold ${domainIntel.reputation >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>{domainIntel.reputation}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[#888] text-xs uppercase block">Categories</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {Object.entries(domainIntel.categories).slice(0, 5).map(([svc, cat]) => (
                                                <span key={svc} className="px-2 py-1 bg-[#f5f5f0] border border-[#d4d0c8] rounded text-xs text-[#444]">{cat}</span>
                                            ))}
                                            {Object.keys(domainIntel.categories).length === 0 && <span className="text-[#888] italic">No categories tagged</span>}
                                        </div>
                                    </div>
                                     <div className="col-span-2">
                                        <label className="text-[#888] text-xs uppercase block">Tags</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {domainIntel.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded text-xs text-[#e8521a] uppercase">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>
                         </div>
                     )}

                     {/* SSL/TLS Intelligence */}
                     {domainIntel && (domainIntel.jarm || domainIntel.last_https_certificate) && (
                         <div className="bg-white border border-[#e8e6e0] p-6 rounded">
                             <h4 className="text-[#e8521a] font-bold mb-4 flex items-center gap-2"><Lock className="w-4 h-4"/> SSL/TLS INTELLIGENCE</h4>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                 {domainIntel.jarm && (
                                     <div>
                                         <label className="text-[#888] text-xs uppercase block mb-1">JARM Fingerprint</label>
                                         <div className="bg-[#f5f5f0] p-3 rounded border border-[#f0efe8] font-mono text-[10px] text-[#e8521a] break-all leading-relaxed">
                                             {domainIntel.jarm}
                                         </div>
                                         <p className="text-[10px] text-[#888] mt-2">
                                             Active fingerprinting of the TLS server stack. Used to identify malicious servers even if they change IPs.
                                         </p>
                                     </div>
                                 )}
                                 {domainIntel.last_https_certificate && (
                                     <div className="space-y-3">
                                         <div>
                                             <label className="text-[#888] text-xs uppercase block">Certificate Issuer</label>
                                             <span className="text-[#111] text-sm">{domainIntel.last_https_certificate.issuer?.O || domainIntel.last_https_certificate.issuer?.CN || 'Unknown'}</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                 <label className="text-[#888] text-xs uppercase block">Valid From</label>
                                                 <span className="text-[#333] text-xs">{domainIntel.last_https_certificate.validity?.not_before || 'N/A'}</span>
                                             </div>
                                             <div>
                                                 <label className="text-[#888] text-xs uppercase block">Valid Until</label>
                                                 <span className="text-[#333] text-xs">{domainIntel.last_https_certificate.validity?.not_after || 'N/A'}</span>
                                             </div>
                                         </div>
                                         <div>
                                             <label className="text-[#888] text-xs uppercase block">Subject Alternative Names</label>
                                             <div className="flex flex-wrap gap-1 mt-1">
                                                 {domainIntel.last_https_certificate.extensions?.subject_alternative_name?.slice(0, 5).map((name: string) => (
                                                     <span key={name} className="text-[9px] px-1.5 py-0.5 bg-[#f5f5f0] rounded text-[#666]">{name}</span>
                                                 ))}
                                                 {(domainIntel.last_https_certificate.extensions?.subject_alternative_name?.length > 5) && (
                                                     <span className="text-[9px] text-[#aaa]">+{domainIntel.last_https_certificate.extensions.subject_alternative_name.length - 5} more</span>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}

                      {/* Security Vendor Detections */}
                      {domainIntel && domainIntel.raw_data?.data?.attributes?.last_analysis_results && (
                          <div className="bg-white border border-[#e8e6e0] p-6 rounded mb-6">
                              <h4 className="text-[#e8521a] font-bold mb-4 flex items-center gap-2"><Shield className="w-4 h-4"/> SECURITY VENDOR DETECTIONS</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(domainIntel.raw_data.data.attributes.last_analysis_results)
                                      .filter(([_, result]: any) => result.category === 'malicious' || result.category === 'suspicious')
                                      .map(([vendor, result]: any) => (
                                          <div key={vendor} className="flex items-center justify-between p-3 bg-[#fef2f2] border border-[#fecaca] rounded">
                                              <div className="flex flex-col">
                                                  <span className="text-xs font-bold text-[#111]">{vendor}</span>
                                                  <span className="text-[10px] text-[#dc2626] uppercase">{result.result || result.category}</span>
                                              </div>
                                              <AlertTriangle className="w-4 h-4 text-[#dc2626] opacity-50" />
                                          </div>
                                      ))
                                  }
                                  {Object.entries(domainIntel.raw_data.data.attributes.last_analysis_results)
                                      .filter(([_, result]: any) => result.category === 'malicious' || result.category === 'suspicious')
                                      .length === 0 && (
                                          <div className="col-span-full py-4 text-center bg-[#f0fdf4] border border-[#bbf7d0] rounded">
                                              <CheckCircle className="w-6 h-6 text-[#16a34a] mx-auto mb-2 opacity-50" />
                                              <p className="text-xs text-[#16a34a] font-bold uppercase tracking-widest">No malicious detections from 70+ vendors</p>
                                          </div>
                                      )
                                  }
                              </div>
                          </div>
                      )}

                     {/* 2. Detailed Technical Data (DNS, Whois, Popularity) */}
                     {domainIntel && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
                            {/* DNS Records */}
                            <div className="bg-white border border-[#e8e6e0] p-6 rounded flex flex-col h-full">
                                 <div className="mb-4">
                                     <h4 className="text-[#e8521a] font-bold flex items-center gap-2"><Server className="w-4 h-4"/> DNS INFRASTRUCTURE</h4>
                                    <p className="text-xs text-[#666] mt-2 leading-relaxed">
                                        The phonebook of the internet. These records define where traffic (web, email) is routed for this domain.
                                    </p>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[400px] pr-2">
                                    {domainIntel.last_dns_records && domainIntel.last_dns_records.length > 0 ? (
                                        domainIntel.last_dns_records.map((rec: any, i: number) => (
                                            <div key={i} className="group flex flex-col bg-[#f5f5f0]/50 p-3 rounded border border-[#f0efe8] hover:border-[#fbd5c0] hover:bg-[#f8f7f4] transition-all duration-300">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded border min-w-[3.5rem] text-center ${
                                                                rec.type === 'A' || rec.type === 'AAAA' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                                                rec.type === 'MX' ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                                                                rec.type === 'TXT' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                                                                rec.type === 'NS' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                                'bg-[#f5f5f0] text-[#333] border-[#d4d0c8]'
                                                            }`}>
                                                                {rec.type}
                                                            </span>
                                                            <span className="text-[10px] text-[#888] uppercase tracking-wider font-bold">
                                                                {getDnsDescription(rec.type).split(' (')[0]}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] text-[#aaa] italic pl-1">
                                                            {getDnsDescription(rec.type).includes('(') ? getDnsDescription(rec.type).split('(')[1].replace(')', '') : ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-[#aaa] font-mono bg-white px-1.5 py-0.5 rounded border border-[#f0efe8]">TTL: {rec.ttl}s</span>
                                                </div>
                                                <div className="font-mono text-xs text-[#444] break-all pl-3 border-l-2 border-[#f0efe8] group-hover:border-[#e8521a] ml-1 transition-colors py-1 bg-white/30 rounded-r">
                                                    {rec.value}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 text-[#888] bg-[#f5f5f0]/30 rounded border border-dashed border-[#f0efe8]">
                                            <Server className="w-8 h-8 mb-2 opacity-20" />
                                            <span className="text-xs">No DNS records exposed via API</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Whois & Popularity */}
                            <div className="flex flex-col gap-6">
                                {/* Popularity */}
                                <div className="bg-white border border-[#e8e6e0] p-6 rounded">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[#e8521a] font-bold flex items-center gap-2"><Activity className="w-4 h-4"/> POPULARITY LEADERBOARD</h4>
                                        <div className="px-2 py-0.5 bg-[#fff4ee] border border-[#fbd5c0] rounded text-[10px] text-[#e8521a] font-bold uppercase tracking-widest">Global Traffic</div>
                                    </div>
                                    <p className="text-xs text-[#666] mb-6 leading-relaxed">
                                        These metrics represent the domain's global footprint. A lower rank indicates a more massive user base and higher trust/visibility.
                                    </p>
                                    {domainIntel.popularity_ranks && Object.keys(domainIntel.popularity_ranks).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(domainIntel.popularity_ranks).map(([source, data]: any, idx) => (
                                                <div key={source} className="group bg-[#f5f5f0] p-4 rounded border border-[#f0efe8] flex items-center gap-4 relative overflow-hidden hover:border-[#fbd5c0] transition-all">
                                                     <div className="flex items-center justify-center w-8 h-8 rounded bg-white border border-[#e8e6e0] text-[#e8521a] font-mono font-bold text-sm">
                                                        {idx + 1}
                                                     </div>
                                                     <div className="flex-1">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <span className="text-[10px] text-[#888] uppercase font-bold block">{source}</span>
                                                                <span className="text-lg font-mono font-bold text-[#111] leading-none">#{data.rank.toLocaleString()}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[9px] text-[#aaa] uppercase mb-1">Traffic Percentile</div>
                                                                <div className="h-1.5 w-24 bg-white rounded-full overflow-hidden border border-[#f0efe8]">
                                                                    <div 
                                                                        className="h-full bg-[#e8521a]" 
                                                                        style={{ width: `${Math.max(5, Math.min(95, 100 - (data.rank / 1000000 * 100)))}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                     </div>
                                                     {/* Decorative bg element */}
                                                     <div className="absolute right-0 top-0 h-full w-1 bg-[#e8521a] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-[#f5f5f0]/30 rounded border border-dashed border-[#f0efe8] p-4 text-center text-xs text-[#888]">
                                            No popularity metrics available for this domain.
                                        </div>
                                    )}
                                </div>

                                {/* WHOIS */}
                                <div className="bg-white border border-[#e8e6e0] p-6 rounded flex-1 flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[#e8521a] font-bold flex items-center gap-2"><FileText className="w-4 h-4"/> WHOIS TERMINAL</h4>
                                        <span className="text-[10px] text-[#888] font-mono bg-[#0f1929] px-2 py-0.5 rounded border border-[#f0efe8]">v1.0.4-stable</span>
                                    </div>
                                    <p className="text-xs text-[#666] mb-4 leading-relaxed">
                                        Registration metadata used to identify the entity controlling the domain and its technical contacts.
                                    </p>
                                    <div className="flex-1 relative group min-h-[250px]">
                                        <div className="absolute inset-0 bg-[#0f1929] rounded border border-[#e8e6e0] shadow-lg"></div>
                                        <div className="absolute top-0 left-0 right-0 h-7 bg-[#f5f5f0] rounded-t border-b border-[#e8e6e0] flex items-center px-3 gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                                            </div>
                                            <div className="mx-auto text-[10px] text-[#666] font-mono tracking-wider flex items-center gap-2">
                                                <Globe className="w-3 h-3" /> query://whois.{domain}
                                            </div>
                                            <div className="w-10"></div> {/* Spacer */}
                                        </div>
                                        <div className="absolute top-7 bottom-0 left-0 right-0 p-4 overflow-y-auto custom-scrollbar font-mono text-[11px] text-[#e8521a] whitespace-pre-wrap leading-relaxed selection:bg-[#e8521a] selection:text-black">
                                             <span className="text-[#888]">$ whois {domain}</span>
                                             <br />
                                             <span className="text-[#16a34a]/70">[SYSTEM] Connection established...</span>
                                             <br />
                                             <span className="text-[#16a34a]/70">[SYSTEM] Fetching registration data...</span>
                                             <br /><br />
                                             {domainIntel.whois ? domainIntel.whois : <span className="text-[#aaa] italic">// No WHOIS data available in summary.</span>}
                                             <br />
                                             <span className="text-[#888] animate-pulse">_</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                     )}

                     {/* 3. Hunter Company Info & Employees */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {hunterDomain && (
                             <div className="bg-white border border-[#e8e6e0] p-6 rounded">
                                 <h4 className="text-[#e8521a] font-bold mb-4 flex items-center gap-2"><Building className="w-4 h-4"/> COMPANY INTEL</h4>
                                 <div className="space-y-4 text-sm">
                                     <div>
                                         <label className="text-[#888] text-xs uppercase block">Organization</label>
                                         <span className="text-[#111] text-lg font-bold">{hunterDomain.organization}</span>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div><label className="text-[#888] text-xs uppercase block"><MapPin className="w-3 h-3 inline"/> Location</label><span className="text-[#444]">{hunterDomain.state ? `${hunterDomain.state}, ` : ''}{hunterDomain.country}</span></div>
                                         <div><label className="text-[#888] text-xs uppercase block">Email Pattern</label><span className="text-[#e8521a] font-mono">{hunterDomain.pattern}</span></div>
                                     </div>
                                     <p className="text-[#333] text-xs leading-relaxed">{hunterDomain.description}</p>
                                     <div className="flex gap-4 pt-2 border-t border-[#f0efe8]">
                                         {hunterDomain.linkedin && <a href={hunterDomain.linkedin} target="_blank" rel="noreferrer" className="text-[#666] hover:text-[#111]"><Linkedin className="w-4 h-4" /></a>}
                                         {hunterDomain.twitter && <a href={hunterDomain.twitter} target="_blank" rel="noreferrer" className="text-[#666] hover:text-[#111]"><Twitter className="w-4 h-4" /></a>}
                                         {hunterDomain.facebook && <a href={hunterDomain.facebook} target="_blank" rel="noreferrer" className="text-[#666] hover:text-[#111]"><Facebook className="w-4 h-4" /></a>}
                                     </div>
                                      {hunterDomain.technologies && hunterDomain.technologies.length > 0 && (
                                         <div className="pt-2">
                                             <label className="text-[#888] text-xs uppercase block mb-1">Tech Stack</label>
                                             <div className="flex flex-wrap gap-1">
                                                {hunterDomain.technologies.map(tech => (
                                                    <span key={tech} className="text-[10px] px-2 py-0.5 bg-[#f5f5f0] border border-[#f0efe8] rounded text-[#333]">{tech}</span>
                                                ))}
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}

                         {hunterDomain && (
                            <div className="bg-white border border-[#e8e6e0] p-6 rounded h-full">
                                <h4 className="text-[#e8521a] font-bold mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4"/> IDENTIFIED EMPLOYEES</h4>
                                {hunterDomain.emails.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {hunterDomain.emails.map((e, idx) => (
                                            <div key={idx} className="flex justify-between items-start p-3 bg-[#f8f7f4] rounded border border-[#f0efe8] hover:border-[#d4d0c8] transition-colors">
                                                <div>
                                                    <div className="font-bold text-[#111] text-sm">{e.first_name} {e.last_name}</div>
                                                    <div className="text-xs text-[#666] mb-1">{e.position || 'Employee'}</div>
                                                    <div className="flex gap-2">
                                                        {e.linkedin && <a href={e.linkedin} target="_blank" rel="noreferrer" className="text-[#888] hover:text-[#333]"><Linkedin className="w-3 h-3" /></a>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-[#e8521a] font-mono mb-1">{e.value}</div>
                                                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${e.type === 'personal' ? 'border-[#16a34a] text-[#16a34a]' : 'border-[#999] text-[#888]'}`}>{e.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-[#666] text-sm">No public email patterns found.</p>}
                            </div>
                         )}
                     </div>

                     {/* Raw VT Data Toggle */}
                     {domainIntel && domainIntel.raw_data && (
                         <div className="text-center">
                             <button onClick={() => setShowRawVt(!showRawVt)} className="text-[#888] text-xs hover:text-[#333] underline">
                                 {showRawVt ? 'Hide Raw VirusTotal Data' : 'View Full VirusTotal JSON Response'}
                             </button>
                             {showRawVt && (
                                 <div className="mt-4 p-4 bg-[#0f1929] border border-[#f0efe8] rounded text-left overflow-auto max-h-96 text-xs font-mono text-[#333]">
                                     <pre>{JSON.stringify(domainIntel.raw_data, null, 2)}</pre>
                                 </div>
                             )}
                         </div>
                     )}
                  </div>
              )}
            </div>
          )}

          {/* SOCIAL OSINT TAB */}
          {activeTab === 'social' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#f8f7f4] border border-[#e8e6e0] rounded p-4 mb-6 text-sm text-[#333]">
                <Share2 className="inline w-4 h-4 mr-2 text-[#e8521a]" />
                Maigret-style Social Media Intelligence. Track usernames across 500+ platforms and find associated digital footprints.
              </div>
              <form onSubmit={handleSocialSearch} className="flex flex-col md:flex-row gap-4 mb-8">
                <input 
                  type="text" 
                  value={socialUsername} 
                  onChange={(e) => setSocialUsername(e.target.value)} 
                  placeholder="Target Username (e.g. john_doe)" 
                  className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" 
                />
                <input 
                  type="email" 
                  value={socialEmail} 
                  onChange={(e) => setSocialEmail(e.target.value)} 
                  placeholder="Associated Email (Optional)" 
                  className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" 
                />
                <button 
                  type="submit" 
                  disabled={socialLoading} 
                  className="bg-[#e8521a] hover:bg-[#c73f0a] text-[#111] px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {socialLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  TRACK TARGET
                </button>
              </form>

              {socialIntel && (
                <div className="bg-white border border-[#e8e6e0] rounded-lg p-6 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-[#f0efe8] pb-4">
                    <h3 className="text-lg font-bold text-[#e8521a] flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      TACTICAL INTELLIGENCE REPORT
                    </h3>
                    <div className="text-[10px] font-mono text-[#888] uppercase tracking-widest">
                      Source: Gemini OSINT Engine
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-[#444] text-sm leading-relaxed markdown-body">
                    <ReactMarkdown>{socialIntel.text}</ReactMarkdown>
                  </div>
                  
                  {socialIntel.groundingMetadata?.groundingChunks && (
                    <div className="mt-8 pt-6 border-t border-[#f0efe8]">
                      <h4 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-4">Verified Sources & Grounding</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {socialIntel.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => (
                          chunk.web && (
                            <a 
                              key={idx} 
                              href={chunk.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-[#f8f7f4] border border-[#e8e6e0] rounded hover:border-[#fbd5c0] transition-all group"
                            >
                              <Globe className="w-4 h-4 text-[#e8521a] group-hover:scale-110 transition-transform" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#111] truncate">{chunk.web.title}</div>
                                <div className="text-[10px] text-[#888] truncate">{chunk.web.uri}</div>
                              </div>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'password' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-[#d97706]/10 border border-[#fde68a] p-4 rounded mb-6 text-sm text-[#d97706] flex items-start gap-3">
                  <Lock className="w-5 h-5 shrink-0" />
                  <p>Security Note: We use k-Anonymity. Your full password is never sent to our servers. Only the first 5 characters of the SHA-1 hash are used to query the HIBP database.</p>
               </div>
               <form onSubmit={handlePasswordCheck} className="flex gap-4 mb-8">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password to check exposure..." className="flex-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-4 py-2.5 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm" />
                <button type="submit" disabled={pwLoading} className="bg-[#e8521a] hover:bg-[#c73f0a] text-[#111] px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                  {pwLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Shield className="w-4 h-4" />}
                  AUDIT PASSWORD
                </button>
              </form>
              {leakCount !== null && !pwLoading && (
                 <div className="text-center py-12">
                    {leakCount === 0 ? (
                        <div className="bg-[#16a34a]/10 border border-[#16a34a] rounded p-8 inline-block max-w-lg">
                           <CheckCircle className="w-16 h-16 text-[#16a34a] mx-auto mb-4" />
                           <h3 className="text-2xl font-bold text-[#111] mb-2">Safe Password</h3>
                           <p className="text-[#444]">This password has not been seen in any known data breaches.</p>
                        </div>
                    ) : (
                        <div className="bg-[#fef2f2] border border-[#dc2626] rounded p-8 inline-block max-w-lg">
                           <AlertTriangle className="w-16 h-16 text-[#dc2626] mx-auto mb-4" />
                           <h3 className="text-2xl font-bold text-[#111] mb-2">Compromised Password</h3>
                           <p className="text-[#444] mb-4">This password has been seen <span className="text-[#dc2626] font-bold text-xl">{leakCount.toLocaleString()}</span> times in data breaches.</p>
                           <p className="text-sm text-[#666]">Do not use this password on any active account.</p>
                        </div>
                    )}
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
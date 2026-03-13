
import React, { useState, useEffect, useCallback } from 'react';
import { fetchRealThreats } from '../services/realFeedService';
import { triggerParseHubScrape } from '../services/parseHubService';
import { ForumPost, ThreatSeverity } from '../types';
import { analyzeThreatContent } from '../services/geminiService';
import { saveThreat } from '../services/supabaseClient';
import { Play, Pause, RefreshCw, Bot, ShieldCheck, Globe, ExternalLink, Database, Github, MessageSquare, Layers, Sparkles, Fingerprint, Newspaper, Radio } from 'lucide-react';

export const LiveFeed: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'ALL' | 'REDDIT' | 'GITHUB' | 'NEWS' | 'SCRAPED'>('ALL');

  // Unified fetch function to merge new data without overwriting existing state
  const fetchAndMergeData = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    
    try {
        const realPosts = await fetchRealThreats();
        
        setPosts(prev => {
            // De-duplicate based on ID
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = realPosts.filter(p => !existingIds.has(p.id));
            
            // Auto-save Critical threats to DB
            newPosts.forEach(post => {
                if (post.severity === ThreatSeverity.CRITICAL) {
                    saveThreat(post);
                }
            });
            
            // If new posts found, merge them at the top
            if (newPosts.length > 0) {
                return [...newPosts, ...prev].slice(0, 100); // Keep last 100
            }
            return prev;
        });
        setLastUpdated(new Date());
    } catch (error) {
        console.error("Error fetching feed:", error);
    } finally {
        if (showLoadingState) setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchAndMergeData(true);
  }, [fetchAndMergeData]);

  // Live polling effect
  useEffect(() => {
    let interval: any;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        // Poll every 60 seconds (1 min)
        fetchAndMergeData(false);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchAndMergeData]);

  const handleAnalyze = async (post: ForumPost) => {
    setAnalyzingId(post.id);
    const result = await analyzeThreatContent(post.rawContent || post.content);
    
    const updatedPost: ForumPost = {
        ...post,
        isAnalyzed: true,
        severity: result.severity,
        sector: result.sector,
        keywords: result.keywords,
        entities: result.entities || [],
        analysisSummary: result.summary,
        credibilityScore: result.credibilityScore
    };

    // Save analyzed result to DB
    await saveThreat(updatedPost);

    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return updatedPost;
      }
      return p;
    }));
    setAnalyzingId(null);
  };

  const handleBatchScan = async () => {
      setIsBatchScanning(true);
      // Find top 3 unanalyzed posts to avoid rate limits
      const unanalyzed = posts.filter(p => !p.isAnalyzed).slice(0, 3);
      
      for (const post of unanalyzed) {
          await handleAnalyze(post);
          // Small delay to be nice to the API
          await new Promise(r => setTimeout(r, 1000));
      }
      setIsBatchScanning(false);
  };

  const getSeverityColor = (sev: ThreatSeverity) => {
    switch(sev) {
      case ThreatSeverity.CRITICAL: return 'text-cyber-danger border-cyber-danger';
      case ThreatSeverity.HIGH: return 'text-cyber-warning border-cyber-warning';
      case ThreatSeverity.MEDIUM: return 'text-cyber-accent border-cyber-accent';
      case ThreatSeverity.LOW: return 'text-cyber-success border-cyber-success';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getSourceIcon = (source: string) => {
      if (source === 'GitHub' || source === 'StackOverflow' || source === 'GitHub Advisories') return <Github className="w-3 h-3"/>;
      if (source.startsWith('r/')) return <MessageSquare className="w-3 h-3"/>;
      if (source === 'Dev.to' || source === 'Lobste.rs' || source.startsWith('News:') || source === 'Hacker News' || source === 'Full Disclosure') return <Newspaper className="w-3 h-3"/>;
      if (source.includes('CISA') || source.includes('URLhaus') || source.includes('Feodo') || source === 'NIST NVD' || source === 'AlienVault OTX' || source === 'ThreatFox') return <Radio className="w-3 h-3" />;
      if (source.startsWith('ParseHub:')) return <Database className="w-3 h-3" />;
      return <Globe className="w-3 h-3"/>;
  };

  const getSourceLink = (post: ForumPost) => {
      if (post.rawContent && post.rawContent.startsWith('http')) return post.rawContent;
      if (post.source.startsWith('r/')) return `https://reddit.com/${post.source}/comments/${post.id}`;
      return '#';
  };

  // Filter Logic
  const displayedPosts = posts.filter(post => {
      if (filter === 'ALL') return true;
      if (filter === 'REDDIT') return post.source.startsWith('r/');
      if (filter === 'GITHUB') return post.source === 'GitHub' || post.source === 'StackOverflow' || post.source === 'GitHub Advisories';
      if (filter === 'NEWS') return post.source.startsWith('News:') || post.source === 'Hacker News' || post.source.includes('CISA') || post.source === 'NIST NVD' || post.source === 'Full Disclosure' || post.source === 'AlienVault OTX' || post.source.includes('Abuse.ch') || post.source === 'Dev.to' || post.source === 'Lobste.rs' || post.source === 'ThreatFox';
      if (filter === 'SCRAPED') return post.source.startsWith('ParseHub:');
      return true;
  });

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-cyber-800 p-4 rounded-lg border border-cyber-600 gap-4">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyber-accent" />
                    GLOBAL THREAT STREAM
                </h2>
                {isAutoRefresh && <span className="flex h-3 w-3 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-success"></span>
                </span>}
            </div>
            <div className="text-xs text-cyber-400 font-mono hidden md:block">
               LAST SYNC: {lastUpdated.toLocaleTimeString()}
            </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-cyber-900 p-1 rounded-lg border border-cyber-700 overflow-x-auto max-w-full">
            <button
                onClick={() => setFilter('ALL')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-cyber-600 text-white shadow-lg' : 'text-cyber-400 hover:text-cyber-200'}`}
            >
                <Layers className="w-3 h-3" /> ALL
            </button>
            <button
                onClick={() => setFilter('REDDIT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === 'REDDIT' ? 'bg-cyber-600 text-white shadow-lg' : 'text-cyber-400 hover:text-cyber-200'}`}
            >
                <MessageSquare className="w-3 h-3" /> SOCIAL
            </button>
            <button
                onClick={() => setFilter('GITHUB')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === 'GITHUB' ? 'bg-cyber-600 text-white shadow-lg' : 'text-cyber-400 hover:text-cyber-200'}`}
            >
                <Github className="w-3 h-3" /> CODE
            </button>
            <button
                onClick={() => setFilter('NEWS')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === 'NEWS' ? 'bg-cyber-600 text-white shadow-lg' : 'text-cyber-400 hover:text-cyber-200'}`}
            >
                <Newspaper className="w-3 h-3" /> INTEL
            </button>
            <button
                onClick={() => setFilter('SCRAPED')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${filter === 'SCRAPED' ? 'bg-cyber-600 text-white shadow-lg' : 'text-cyber-400 hover:text-cyber-200'}`}
            >
                <Database className="w-3 h-3" /> SCRAPED
            </button>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={async () => {
                    setIsScraping(true);
                    const success = await triggerParseHubScrape();
                    if (success) {
                        alert("Scrape triggered successfully! Data will appear in a few minutes.");
                    } else {
                        alert("Failed to trigger scrape. Check API key.");
                    }
                    setIsScraping(false);
                }}
                disabled={isScraping}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-900 hover:bg-cyber-800 border border-cyber-700 text-cyber-accent rounded font-bold transition-colors disabled:opacity-50"
                title="Trigger ParseHub Scrapers"
            >
                <Database className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                {isScraping ? 'TRIGGERING...' : 'SCRAPE NOW'}
            </button>

            <button 
                onClick={handleBatchScan}
                disabled={isBatchScanning}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-700 hover:bg-cyber-600 border border-cyber-500 text-white rounded font-bold transition-colors disabled:opacity-50"
            >
                 <Sparkles className={`w-4 h-4 ${isBatchScanning ? 'animate-spin' : ''}`} />
                 {isBatchScanning ? 'SCANNING...' : 'DEEP NLP SCAN'}
            </button>
            
            <button 
                onClick={() => fetchAndMergeData(true)}
                className="p-2 bg-cyber-700 hover:bg-cyber-600 rounded text-cyber-300 transition-colors"
                title="Force Refresh"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${isAutoRefresh ? 'bg-cyber-danger/20 text-cyber-danger border border-cyber-danger' : 'bg-cyber-success/20 text-cyber-success border border-cyber-success'}`}
            >
                {isAutoRefresh ? <><Pause className="w-4 h-4"/> PAUSE LIVE</> : <><Play className="w-4 h-4"/> GO LIVE</>}
            </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-70">
                <Globe className="w-12 h-12 text-cyber-accent mb-4 animate-pulse" />
                <span className="text-cyber-300 text-lg font-mono">Scanning global networks...</span>
                <span className="text-cyber-500 text-sm mt-2">Connecting to 50+ threat intelligence sources</span>
            </div>
        ) : displayedPosts.length === 0 ? (
            <div className="text-center py-10 text-cyber-400">
                No active items found in the current stream for this filter.
            </div>
        ) : displayedPosts.map(post => (
            <div key={post.id} className="bg-cyber-900 border border-cyber-700 p-4 rounded-lg hover:border-cyber-500 transition-colors relative overflow-hidden group">
                {post.severity === ThreatSeverity.CRITICAL && (
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rotate-45 bg-cyber-danger w-24 h-4 shadow-lg shadow-cyber-danger/50"></div>
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono text-cyber-400">{new Date(post.timestamp).toLocaleTimeString()}</span>
                        <a 
                            href={getSourceLink(post)}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded text-xs font-bold bg-cyber-700 text-cyber-300 uppercase tracking-wide hover:bg-cyber-600 hover:text-white transition-colors flex items-center gap-1"
                        >
                            {getSourceIcon(post.source)}
                            {post.source} <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-xs text-cyber-500 truncate max-w-[150px]">{post.author ? `by ${post.author}` : ''}</span>
                    </div>
                    <div className={`px-2 py-1 rounded border text-xs font-bold uppercase ${getSeverityColor(post.severity)}`}>
                        {post.severity}
                    </div>
                </div>

                <div className="text-cyber-100 mb-4 font-mono text-sm leading-relaxed">
                    <h4 className="font-bold block mb-1 text-lg">{post.content}</h4>
                    {post.rawContent && post.rawContent !== post.content && !post.rawContent.startsWith('http') && (
                        <p className="text-xs text-cyber-400 line-clamp-3 mt-2 pl-3 border-l-2 border-cyber-800">{post.rawContent}</p>
                    )}
                </div>

                {post.isAnalyzed ? (
                    <div className="bg-cyber-800/50 rounded p-3 border-l-2 border-cyber-accent animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2 mb-2 text-cyber-accent">
                            <Bot className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Automated Threat Analysis</span>
                        </div>
                        <p className="text-xs text-cyber-200 mb-2">{post.analysisSummary}</p>
                        
                        {/* NLP Entities Section */}
                        {post.entities && post.entities.length > 0 && (
                             <div className="mb-3">
                                <div className="text-[10px] uppercase text-cyber-500 font-bold mb-1 flex items-center gap-1">
                                    <Fingerprint className="w-3 h-3" /> Extracted IOCs & Entities
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {post.entities.map((ent, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-cyber-950 text-cyber-warning border border-cyber-700 rounded font-mono">
                                            {ent}
                                        </span>
                                    ))}
                                </div>
                             </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                             {post.keywords.map((k, i) => (
                                 <span key={i} className="text-[10px] px-1.5 py-0.5 bg-cyber-900 text-cyber-400 rounded border border-cyber-700">#{k}</span>
                             ))}
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-cyber-700/50 pt-2 mt-2">
                             <span className="text-cyber-400">Target Sector: <span className="text-white font-bold">{post.sector}</span></span>
                             <span className="text-cyber-400">Risk Score: <span className={`${post.credibilityScore > 70 ? 'text-cyber-danger' : 'text-cyber-warning'}`}>{post.credibilityScore}/100</span></span>
                             <span className="text-[10px] text-cyber-500 flex items-center gap-1"><Database className="w-3 h-3"/> Saved to DB</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center mt-3 border-t border-cyber-800 pt-3">
                        <div className="text-xs text-cyber-500 font-mono flex gap-2">
                            {post.type}
                        </div>
                        <button 
                            onClick={() => handleAnalyze(post)}
                            disabled={analyzingId === post.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-cyber-700 hover:bg-cyber-600 text-cyber-300 text-xs rounded transition-colors disabled:opacity-50"
                        >
                            {analyzingId === post.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" /> 
                            ) : (
                                <ShieldCheck className="w-3 h-3" />
                            )}
                            {analyzingId === post.id ? 'ANALYZING...' : 'ANALYZE THREAT'}
                        </button>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

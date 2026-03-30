
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

    const fetchAndMergeData = useCallback(async (showLoadingState = false) => {
        if (showLoadingState) setLoading(true);

        try {
            const realPosts = await fetchRealThreats();

            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPosts = realPosts.filter(p => !existingIds.has(p.id));

                newPosts.forEach(post => {
                    if (post.severity === ThreatSeverity.CRITICAL) {
                        saveThreat(post);
                    }
                });

                if (newPosts.length > 0) {
                    return [...newPosts, ...prev].slice(0, 100);
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

    useEffect(() => {
        fetchAndMergeData(true);
    }, [fetchAndMergeData]);

    useEffect(() => {
        let interval: any;
        if (isAutoRefresh) {
            interval = setInterval(() => {
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
        const unanalyzed = posts.filter(p => !p.isAnalyzed).slice(0, 3);

        for (const post of unanalyzed) {
            await handleAnalyze(post);
            await new Promise(r => setTimeout(r, 1000));
        }
        setIsBatchScanning(false);
    };

    const getSeverityStyle = (sev: ThreatSeverity) => {
        switch (sev) {
            case ThreatSeverity.CRITICAL: return 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]';
            case ThreatSeverity.HIGH: return 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
            case ThreatSeverity.MEDIUM: return 'bg-[#fff4ee] text-[#e8521a] border-[#fbd5c0]';
            case ThreatSeverity.LOW: return 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]';
            default: return 'bg-[#f5f5f0] text-[#666] border-[#e8e6e0]';
        }
    };

    const getSourceIcon = (source: string) => {
        if (source === 'GitHub' || source === 'StackOverflow' || source === 'GitHub Advisories') return <Github className="w-3 h-3" />;
        if (source.startsWith('r/')) return <MessageSquare className="w-3 h-3" />;
        if (source === 'Dev.to' || source === 'Lobste.rs' || source.startsWith('News:') || source === 'Hacker News' || source === 'Full Disclosure') return <Newspaper className="w-3 h-3" />;
        if (source.includes('CISA') || source.includes('URLhaus') || source.includes('Feodo') || source === 'NIST NVD' || source === 'AlienVault OTX' || source === 'ThreatFox') return <Radio className="w-3 h-3" />;
        if (source.startsWith('ParseHub:')) return <Database className="w-3 h-3" />;
        return <Globe className="w-3 h-3" />;
    };

    const getSourceLink = (post: ForumPost) => {
        if (post.rawContent && post.rawContent.startsWith('http')) return post.rawContent;
        if (post.source.startsWith('r/')) return `https://reddit.com/${post.source}/comments/${post.id}`;
        return '#';
    };

    const displayedPosts = posts.filter(post => {
        if (filter === 'ALL') return true;
        if (filter === 'REDDIT') return post.source.startsWith('r/');
        if (filter === 'GITHUB') return post.source === 'GitHub' || post.source === 'StackOverflow' || post.source === 'GitHub Advisories';
        if (filter === 'NEWS') return post.source.startsWith('News:') || post.source === 'Hacker News' || post.source.includes('CISA') || post.source === 'NIST NVD' || post.source === 'Full Disclosure' || post.source === 'AlienVault OTX' || post.source.includes('Abuse.ch') || post.source === 'Dev.to' || post.source === 'Lobste.rs' || post.source === 'ThreatFox';
        if (filter === 'SCRAPED') return post.source.startsWith('ParseHub:');
        return true;
    });

    const filterBtns = [
        { id: 'ALL', label: 'ALL', icon: <Layers className="w-3 h-3" /> },
        { id: 'REDDIT', label: 'SOCIAL', icon: <MessageSquare className="w-3 h-3" /> },
        { id: 'GITHUB', label: 'CODE', icon: <Github className="w-3 h-3" /> },
        { id: 'NEWS', label: 'INTEL', icon: <Newspaper className="w-3 h-3" /> },
        { id: 'SCRAPED', label: 'SCRAPED', icon: <Database className="w-3 h-3" /> },
    ];

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-[#e8e6e0] rounded-xl p-4 gap-4 shadow-sm">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-[#111] flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[#e8521a]" />
                            GLOBAL THREAT STREAM
                        </h2>
                        {isAutoRefresh && <span className="flex h-2.5 w-2.5 relative ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16a34a] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16a34a]" />
                        </span>}
                    </div>
                    <div className="text-xs text-[#aaa] font-mono hidden md:block">
                        LAST SYNC: {lastUpdated.toLocaleTimeString()}
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-[#f5f5f0] p-1 rounded-lg border border-[#e8e6e0] overflow-x-auto max-w-full">
                    {filterBtns.map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filter === btn.id
                                    ? 'bg-white text-[#111] shadow-sm border border-[#e8e6e0]'
                                    : 'text-[#888] hover:text-[#333]'
                                }`}
                        >
                            {btn.icon} {btn.label}
                        </button>
                    ))}
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
                        className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f0] hover:bg-[#fff4ee] border border-[#e8e6e0] hover:border-[#fbd5c0] text-[#e8521a] rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        title="Trigger ParseHub Scrapers"
                    >
                        <Database className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                        {isScraping ? 'TRIGGERING...' : 'SCRAPE NOW'}
                    </button>

                    <button
                        onClick={handleBatchScan}
                        disabled={isBatchScanning}
                        className="flex items-center gap-2 px-3 py-2 bg-[#e8521a] hover:bg-[#c73f0a] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                        <Sparkles className={`w-3.5 h-3.5 ${isBatchScanning ? 'animate-spin' : ''}`} />
                        {isBatchScanning ? 'SCANNING...' : 'DEEP NLP SCAN'}
                    </button>

                    <button
                        onClick={() => fetchAndMergeData(true)}
                        className="p-2 bg-[#f5f5f0] hover:bg-[#e8e6e0] border border-[#e8e6e0] rounded-lg text-[#555] transition-colors"
                        title="Force Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${isAutoRefresh
                                ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]'
                                : 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                            }`}
                    >
                        {isAutoRefresh ? <><Pause className="w-3.5 h-3.5" /> PAUSE LIVE</> : <><Play className="w-3.5 h-3.5" /> GO LIVE</>}
                    </button>
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-[#888]">
                        <div className="w-16 h-16 bg-[#fff4ee] rounded-full flex items-center justify-center mb-4">
                            <Globe className="w-8 h-8 text-[#e8521a] animate-pulse" />
                        </div>
                        <span className="text-[#333] text-base font-semibold">Scanning global networks...</span>
                        <span className="text-[#aaa] text-xs mt-1">Connecting to 50+ threat intelligence sources</span>
                    </div>
                ) : displayedPosts.length === 0 ? (
                    <div className="text-center py-10 text-[#aaa]">
                        No active items found in the current stream for this filter.
                    </div>
                ) : displayedPosts.map(post => (
                    <div key={post.id} className={`bg-white border rounded-xl p-4 hover:border-[#e8521a]/30 transition-colors relative overflow-hidden ${post.severity === ThreatSeverity.CRITICAL ? 'border-[#fecaca]' : 'border-[#e8e6e0]'
                        }`}>
                        {post.severity === ThreatSeverity.CRITICAL && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#dc2626] rounded-l-xl" />
                        )}

                        <div className="flex justify-between items-start mb-2 pl-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono text-[#aaa]">{new Date(post.timestamp).toLocaleTimeString()}</span>
                                <a
                                    href={getSourceLink(post)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded-md text-xs font-semibold bg-[#f5f5f0] text-[#555] border border-[#e8e6e0] uppercase tracking-wide hover:bg-[#fff4ee] hover:text-[#e8521a] hover:border-[#fbd5c0] transition-colors flex items-center gap-1"
                                >
                                    {getSourceIcon(post.source)}
                                    {post.source} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <span className="text-xs text-[#bbb] truncate max-w-[150px]">{post.author ? `by ${post.author}` : ''}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-md border text-xs font-bold uppercase ${getSeverityStyle(post.severity)}`}>
                                {post.severity}
                            </span>
                        </div>

                        <div className="text-[#111] mb-3 pl-2">
                            <h4 className="font-bold text-sm leading-snug">{post.content}</h4>
                            {post.rawContent && post.rawContent !== post.content && !post.rawContent.startsWith('http') && (
                                <p className="text-xs text-[#888] line-clamp-2 mt-1.5 pl-3 border-l-2 border-[#e8e6e0]">{post.rawContent}</p>
                            )}
                        </div>

                        {post.isAnalyzed ? (
                            <div className="bg-[#f5f5f0] rounded-lg p-3 border-l-2 border-[#e8521a] ml-2">
                                <div className="flex items-center gap-2 mb-1.5 text-[#e8521a]">
                                    <Bot className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold uppercase">Automated Threat Analysis</span>
                                </div>
                                <p className="text-xs text-[#444] mb-2">{post.analysisSummary}</p>

                                {post.entities && post.entities.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] uppercase text-[#888] font-bold mb-1 flex items-center gap-1">
                                            <Fingerprint className="w-3 h-3" /> Extracted IOCs & Entities
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {post.entities.map((ent, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 bg-[#fffbeb] text-[#d97706] border border-[#fde68a] rounded-md font-mono">
                                                    {ent}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {post.keywords.map((k, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white text-[#888] rounded border border-[#e8e6e0]">#{k}</span>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center text-xs border-t border-[#e8e6e0] pt-2 mt-1">
                                    <span className="text-[#666]">Sector: <span className="text-[#111] font-bold">{post.sector}</span></span>
                                    <span className="text-[#666]">Risk: <span className={`font-bold ${post.credibilityScore > 70 ? 'text-[#dc2626]' : 'text-[#d97706]'}`}>{post.credibilityScore}/100</span></span>
                                    <span className="text-[10px] text-[#aaa] flex items-center gap-1"><Database className="w-3 h-3" /> Saved to DB</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center mt-2 border-t border-[#f0efe8] pt-2 pl-2">
                                <div className="text-xs text-[#bbb] font-mono">
                                    {post.type}
                                </div>
                                <button
                                    onClick={() => handleAnalyze(post)}
                                    disabled={analyzingId === post.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#fff4ee] border border-[#e8e6e0] hover:border-[#fbd5c0] text-[#555] hover:text-[#e8521a] text-xs rounded-lg transition-colors disabled:opacity-50"
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

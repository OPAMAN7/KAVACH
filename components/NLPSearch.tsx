import React, { useState } from 'react';
import { Search, BrainCircuit, AlertTriangle, Database, Globe, RefreshCw, Cpu, ShieldAlert, ArrowRight } from 'lucide-react';
import { fetchRealThreats } from '../services/realFeedService';
import { ForumPost } from '../types';
import { analyzeThreatContent } from '../services/geminiService';

export const NLPSearch: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ForumPost[]>([]);
    const [analyzedResults, setAnalyzedResults] = useState<ForumPost[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword) return;

        setIsSearching(true);
        setAnalyzedResults([]);

        const allPosts = await fetchRealThreats();

        const filtered = allPosts.filter(post => {
            const text = (post.content + ' ' + (post.rawContent || '')).toLowerCase();
            const term = keyword.toLowerCase();
            return text.includes(term) || post.keywords.some(k => k.toLowerCase().includes(term));
        });

        setResults(filtered);
        setIsSearching(false);
    };

    const runDeepAnalysis = async () => {
        setIsAnalyzing(true);
        const topResults = results.slice(0, 5);

        const analysisPromises = topResults.map(async (post) => {
            if (post.isAnalyzed) return post;

            const analysis = await analyzeThreatContent(
                `CONTEXT: The user is specifically searching for threats related to "${keyword}". 
               Focus on identifying specific ATTACK PLANNING, BREACH DATA, or INFRASTRUCTURE TARGETING. 
               
               POST CONTENT: ${post.content}`
            );

            return {
                ...post,
                isAnalyzed: true,
                severity: analysis.severity,
                sector: analysis.sector,
                keywords: analysis.keywords,
                entities: analysis.entities,
                analysisSummary: analysis.summary,
                credibilityScore: analysis.credibilityScore
            };
        });

        const processed = await Promise.all(analysisPromises);
        setAnalyzedResults(processed);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-5">
            <div className="bg-white border border-[#e8e6e0] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#fff4ee] border border-[#fbd5c0] rounded-xl flex items-center justify-center">
                        <BrainCircuit className="w-6 h-6 text-[#e8521a]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#111]">NLP THREAT HUNTER</h2>
                        <p className="text-[#888] text-sm">Semantic search across Reddit, GitHub & ParseHub Archives</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Enter target (e.g., 'Indian Power Grid', 'HDFC Bank', 'SQL Injection')..."
                            className="w-full bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl pl-11 pr-4 py-3 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-[#e8521a] hover:bg-[#c73f0a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 min-w-[120px] justify-center shadow-sm"
                    >
                        {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        SCAN
                    </button>
                </form>

                {/* Results Area */}
                {results.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4 border-b border-[#e8e6e0] pb-3">
                            <h3 className="text-[#555] font-bold flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-[#e8521a]" /> FOUND {results.length} RAW MATCHES
                            </h3>
                            {!isAnalyzing && analyzedResults.length === 0 && (
                                <button
                                    onClick={runDeepAnalysis}
                                    className="text-xs bg-[#fff4ee] text-[#e8521a] border border-[#fbd5c0] px-3 py-1.5 rounded-lg hover:bg-[#ffe8dc] transition-colors flex items-center gap-1 font-bold"
                                >
                                    <Cpu className="w-3 h-3" /> ANALYZE ATTACK VECTORS
                                </button>
                            )}
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#888] bg-[#f5f5f0] rounded-xl border-2 border-dashed border-[#e8e6e0]">
                                <BrainCircuit className="w-10 h-10 mb-3 animate-pulse text-[#e8521a]" />
                                <p className="font-medium text-[#555]">Gemini NLP is extracting Intelligence...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {/* Analyzed Results */}
                                {analyzedResults.length > 0 && (
                                    <div className="mb-4 space-y-3">
                                        <div className="text-[#e8521a] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4" /> AI-Verified Threats
                                        </div>
                                        {analyzedResults.map((post) => (
                                            <div key={`analyzed-${post.id}`} className="bg-[#fef2f2] border border-[#fecaca] border-l-4 border-l-[#dc2626] p-4 rounded-xl">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-[#111] text-sm leading-snug">{post.content.split('\n')[0]}</h4>
                                                    <span className="bg-[#dc2626] text-white text-xs font-bold px-2 py-0.5 rounded-md ml-2 flex-shrink-0">{post.severity}</span>
                                                </div>
                                                <p className="text-[#555] text-xs leading-relaxed">{post.analysisSummary}</p>

                                                {post.entities && post.entities.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {post.entities.map((ent, i) => (
                                                            <span key={i} className="text-[10px] bg-[#fffbeb] text-[#d97706] border border-[#fde68a] px-2 py-1 rounded-md font-mono">
                                                                {ent}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-2 text-xs text-[#aaa]">Source: {post.source} | Score: {post.credibilityScore}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Raw Results */}
                                <div className="space-y-2">
                                    {results.slice(analyzedResults.length, analyzedResults.length + 5).map(post => (
                                        <div key={post.id} className="bg-[#f5f5f0] border border-[#e8e6e0] p-3 rounded-xl flex justify-between items-center group hover:border-[#e8521a]/30 hover:bg-[#fff4ee] transition-colors cursor-pointer">
                                            <div className="truncate flex-1 pr-4">
                                                <div className="text-sm text-[#333] truncate font-medium">{post.content.split('\n')[0]}</div>
                                                <div className="text-xs text-[#aaa]">{post.source} • {new Date(post.timestamp).toLocaleDateString()}</div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-[#ddd] group-hover:text-[#e8521a] transition-colors flex-shrink-0" />
                                        </div>
                                    ))}
                                    {results.length > (analyzedResults.length + 5) && (
                                        <div className="text-center text-xs text-[#bbb] pt-2">
                                            + {results.length - (analyzedResults.length + 5)} more raw results hidden
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isSearching && results.length === 0 && keyword && (
                    <div className="text-center py-12 text-[#bbb] border-2 border-dashed border-[#e8e6e0] rounded-xl">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-[#888]">No matching intelligence found in active streams.</p>
                        <p className="text-xs mt-1">Try broader terms or verify ParseHub project status.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
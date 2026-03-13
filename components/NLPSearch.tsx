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

  // Filter threats based on user input
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;

    setIsSearching(true);
    setAnalyzedResults([]); // Clear previous analysis

    // Fetch from all sources (Reddit, GitHub, ParseHub)
    const allPosts = await fetchRealThreats();

    // Deep Filter: Check content, keywords, and extracted entities
    const filtered = allPosts.filter(post => {
        const text = (post.content + ' ' + (post.rawContent || '')).toLowerCase();
        const term = keyword.toLowerCase();
        return text.includes(term) || post.keywords.some(k => k.toLowerCase().includes(term));
    });

    setResults(filtered);
    setIsSearching(false);
  };

  // Run Gemini Analysis on the filtered results to identify attack planning
  const runDeepAnalysis = async () => {
      setIsAnalyzing(true);
      const topResults = results.slice(0, 5); // Analyze top 5 to respect rate limits
      
      const analysisPromises = topResults.map(async (post) => {
          if (post.isAnalyzed) return post; // Skip if already analyzed

          // Custom Prompt Context for this specific view
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
    <div className="space-y-6">
      <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-6 shadow-lg">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyber-900 rounded-lg border border-cyber-500">
                <BrainCircuit className="w-8 h-8 text-cyber-accent" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">NLP THREAT HUNTER</h2>
                <p className="text-cyber-400 text-sm">Semantic search across Reddit, GitHub & ParseHub Archives</p>
            </div>
         </div>

         <form onSubmit={handleSearch} className="flex gap-4 mb-8">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyber-500" />
                <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Enter target (e.g., 'Indian Power Grid', 'HDFC Bank', 'SQL Injection')..." 
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent focus:outline-none transition-all" 
                />
            </div>
            <button 
                type="submit" 
                disabled={isSearching}
                className="bg-cyber-600 hover:bg-cyber-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 min-w-[140px] justify-center"
            >
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Database className="w-5 h-5" />}
                SCAN
            </button>
         </form>

         {/* Results Area */}
         {results.length > 0 && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center mb-4 border-b border-cyber-700 pb-2">
                     <h3 className="text-cyber-300 font-bold flex items-center gap-2">
                         <Globe className="w-4 h-4" /> FOUND {results.length} RAW MATCHES
                     </h3>
                     {!isAnalyzing && analyzedResults.length === 0 && (
                         <button 
                            onClick={runDeepAnalysis}
                            className="text-xs bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/50 px-3 py-1.5 rounded hover:bg-cyber-accent/20 transition-colors flex items-center gap-1 font-bold"
                         >
                            <Cpu className="w-3 h-3" /> ANALYZE ATTACK VECTORS
                         </button>
                     )}
                 </div>

                 {isAnalyzing ? (
                     <div className="flex flex-col items-center justify-center py-12 text-cyber-400 bg-cyber-900/50 rounded-lg border border-dashed border-cyber-700">
                         <BrainCircuit className="w-12 h-12 mb-4 animate-pulse text-cyber-accent" />
                         <p>Gemini NLP is extracting Intelligence...</p>
                     </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {/* Display Analyzed Results First */}
                        {analyzedResults.length > 0 && (
                            <div className="mb-6 space-y-4">
                                <div className="text-cyber-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> AI-Verified Threats
                                </div>
                                {analyzedResults.map((post) => (
                                    <div key={`analyzed-${post.id}`} className="bg-cyber-900 border-l-4 border-cyber-danger p-4 rounded shadow-lg">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-lg">{post.content.split('\n')[0]}</h4>
                                            <span className="bg-cyber-danger text-cyber-900 text-xs font-bold px-2 py-0.5 rounded">{post.severity}</span>
                                        </div>
                                        <p className="text-cyber-300 text-sm mt-2">{post.analysisSummary}</p>
                                        
                                        {post.entities && post.entities.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {post.entities.map((ent, i) => (
                                                    <span key={i} className="text-[10px] bg-cyber-950 text-cyber-warning border border-cyber-700 px-2 py-1 rounded font-mono">
                                                        {ent}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2 text-xs text-cyber-500 font-mono">Source: {post.source} | Score: {post.credibilityScore}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Raw Results List (truncated) */}
                        <div className="space-y-2">
                            {results.slice(analyzedResults.length, analyzedResults.length + 5).map(post => (
                                <div key={post.id} className="bg-cyber-900/50 border border-cyber-800 p-3 rounded flex justify-between items-center group hover:bg-cyber-800 transition-colors">
                                    <div className="truncate flex-1 pr-4">
                                        <div className="text-sm text-cyber-200 truncate">{post.content.split('\n')[0]}</div>
                                        <div className="text-xs text-cyber-500">{post.source} • {new Date(post.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-cyber-600 group-hover:text-cyber-accent opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                            {results.length > (analyzedResults.length + 5) && (
                                <div className="text-center text-xs text-cyber-500 pt-2 italic">
                                    + {results.length - (analyzedResults.length + 5)} more raw results hidden
                                </div>
                            )}
                        </div>
                    </div>
                 )}
             </div>
         )}
         
         {!isSearching && results.length === 0 && keyword && (
             <div className="text-center py-12 text-cyber-500">
                 <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p>No matching intelligence found in active streams.</p>
                 <p className="text-xs mt-1">Try broader terms or verify ParseHub project status.</p>
             </div>
         )}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Search, Users, Globe, ExternalLink, ShieldAlert, Loader2, Info } from 'lucide-react';
import { searchSocialMedia } from '../services/geminiService';
import { saveToHistory } from '../services/supabaseClient';
import ReactMarkdown from 'react-markdown';

export const SocialSearch: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; groundingMetadata?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username && !email) {
      setError('Please enter at least a username or an email ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchSocialMedia(username, email);
      setResult(data);
      
      // Save to history
      await saveToHistory(
        'social',
        username || email,
        `Social media intelligence for ${username || email}`,
        data
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred during the search.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyber-900 rounded-lg border border-cyber-500 shadow-[0_0_15px_rgba(0,242,234,0.1)]">
            <Users className="w-6 h-6 text-cyber-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">SOCIAL MEDIA INTELLIGENCE</h2>
            <p className="text-cyber-400 text-sm font-mono">OSINT Module: Profile Cross-Referencing & Presence Detection</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyber-300 uppercase tracking-wider">Username / Handle</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. janesmith_dev"
                className="w-full bg-cyber-900 border border-cyber-700 rounded px-10 py-3 text-white focus:border-cyber-accent focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyber-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. jane@example.com"
                className="w-full bg-cyber-900 border border-cyber-700 rounded px-10 py-3 text-white focus:border-cyber-accent focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyber-accent hover:bg-cyber-accent/80 disabled:bg-cyber-800 disabled:text-cyber-600 text-cyber-900 font-bold py-3 rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,234,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  ANALYZING DIGITAL FOOTPRINT...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  INITIATE OSINT SCAN
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-cyber-danger text-sm flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-cyber-800 border border-cyber-600 rounded-lg overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-cyber-900 px-6 py-4 border-b border-cyber-700 flex justify-between items-center">
            <h3 className="font-bold text-cyber-accent flex items-center gap-2">
              <Info className="w-4 h-4" />
              INTELLIGENCE REPORT
            </h3>
            <div className="text-[10px] font-mono text-cyber-500">SOURCE: GOOGLE SEARCH GROUNDING</div>
          </div>
          
          <div className="p-6">
            <div className="prose prose-invert max-w-none prose-sm prose-headings:text-cyber-accent prose-a:text-cyber-accent prose-strong:text-white">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>

            {result.groundingMetadata?.groundingChunks && (
              <div className="mt-8 pt-6 border-t border-cyber-700">
                <h4 className="text-xs font-bold text-cyber-400 uppercase mb-4 flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  Verified Sources & References
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                    chunk.web && (
                      <a
                        key={i}
                        href={chunk.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-cyber-900 border border-cyber-700 rounded hover:border-cyber-accent transition-colors group"
                      >
                        <span className="text-xs text-cyber-300 truncate mr-2">{chunk.web.title || chunk.web.uri}</span>
                        <ExternalLink className="w-3 h-3 text-cyber-500 group-hover:text-cyber-accent flex-shrink-0" />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cyber-900/50 border border-cyber-800 p-4 rounded-lg">
          <h4 className="text-xs font-bold text-cyber-500 uppercase mb-2">Privacy Notice</h4>
          <p className="text-[10px] text-cyber-400 leading-relaxed">
            This tool performs searches across public data sources only. It does not access private accounts or non-public information.
          </p>
        </div>
        <div className="bg-cyber-900/50 border border-cyber-800 p-4 rounded-lg">
          <h4 className="text-xs font-bold text-cyber-500 uppercase mb-2">Data Retention</h4>
          <p className="text-[10px] text-cyber-400 leading-relaxed">
            Search queries are logged for audit purposes within the KAVACH history module.
          </p>
        </div>
        <div className="bg-cyber-900/50 border border-cyber-800 p-4 rounded-lg">
          <h4 className="text-xs font-bold text-cyber-500 uppercase mb-2">Accuracy</h4>
          <p className="text-[10px] text-cyber-400 leading-relaxed">
            Intelligence is gathered in real-time. Results may vary based on platform privacy settings and data availability.
          </p>
        </div>
      </div>
    </div>
  );
};

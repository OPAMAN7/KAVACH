import React, { useState, useEffect } from 'react';
import { X, Save, Database, Key, Shield, FileCode } from 'lucide-react';
import { getAppConfig, saveAppConfig } from '../services/configService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA = `
-- 1. Create table for Search History
create table if not exists history_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  query_type text,
  query_value text,
  summary text,
  full_data jsonb
);

-- 2. Create table for Threat Intelligence Events
create table if not exists threat_events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  source_id text unique,
  source text,
  author text,
  content text,
  severity text,
  sector text,
  type text,
  posted_at timestamp with time zone,
  keywords text[],
  credibility_score int,
  is_analyzed boolean default false,
  analysis_summary text,
  raw_data jsonb
);
`;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    hunterApiKey: '',
    hibpApiKey: '',
    vtApiKey: '',
    parseHubApiKey: ''
  });
  const [showSchema, setShowSchema] = useState(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean, success?: boolean, message?: string }>({ loading: false });

  useEffect(() => {
    if (isOpen) {
      setFormData(getAppConfig());
    }
  }, [isOpen]);

  const handleTestParseHub = async () => {
    setTestStatus({ loading: true });
    try {
        const { fetchParseHubProjects } = await import('../services/parseHubService');
        // Temporarily override config for test
        const originalConfig = localStorage.getItem('kavach_config');
        localStorage.setItem('kavach_config', JSON.stringify({ ...formData }));
        
        const projects = await fetchParseHubProjects();
        
        if (projects && projects.length > 0) {
            setTestStatus({ loading: false, success: true, message: `Success! Found ${projects.length} projects.` });
        } else {
            setTestStatus({ loading: false, success: false, message: 'Connection failed. Check API key.' });
        }
        
        // Restore config
        if (originalConfig) localStorage.setItem('kavach_config', originalConfig);
        else localStorage.removeItem('kavach_config');
    } catch (e) {
        setTestStatus({ loading: false, success: false, message: 'Error testing connection.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppConfig(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-cyber-900 border border-cyber-600 rounded-lg p-6 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-cyber-400 hover:text-white transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyber-accent" />
            SYSTEM CONFIGURATION
        </h2>

        <div className="flex gap-4 mb-6 border-b border-cyber-700">
             <button 
                onClick={() => setShowSchema(false)}
                className={`pb-2 px-2 text-sm font-medium transition-colors ${!showSchema ? 'text-cyber-accent border-b-2 border-cyber-accent' : 'text-cyber-400 hover:text-white'}`}
             >
                API Keys & Connections
             </button>
             <button 
                onClick={() => setShowSchema(true)}
                className={`pb-2 px-2 text-sm font-medium transition-colors ${showSchema ? 'text-cyber-accent border-b-2 border-cyber-accent' : 'text-cyber-400 hover:text-white'}`}
             >
                Database Schema Setup
             </button>
        </div>

        {!showSchema ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Supabase Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyber-400 uppercase tracking-wider border-b border-cyber-800 pb-1">Database (Supabase)</h3>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">Project URL</label>
                        <input 
                            name="supabaseUrl"
                            value={formData.supabaseUrl}
                            onChange={handleChange}
                            className="w-full bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                            placeholder="https://xyz.supabase.co"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">Anon Public Key</label>
                        <input 
                            name="supabaseKey"
                            value={formData.supabaseKey}
                            onChange={handleChange}
                            type="password"
                            className="w-full bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                            placeholder="eyJh..."
                        />
                    </div>
                </div>

                {/* API Keys Section */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyber-400 uppercase tracking-wider border-b border-cyber-800 pb-1 flex items-center gap-2">
                        <Key className="w-3 h-3" /> API Credentials
                    </h3>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">VirusTotal API Key</label>
                        <input 
                            name="vtApiKey"
                            value={formData.vtApiKey}
                            onChange={handleChange}
                            type="password"
                            className="w-full bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                            placeholder="Required for Domain Intel"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">Hunter.io API Key</label>
                        <input 
                            name="hunterApiKey"
                            value={formData.hunterApiKey}
                            onChange={handleChange}
                            type="password"
                            className="w-full bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                            placeholder="Required for Email Finder"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">HaveIBeenPwned Key (Optional)</label>
                        <input 
                            name="hibpApiKey"
                            value={formData.hibpApiKey}
                            onChange={handleChange}
                            type="password"
                            className="w-full bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                            placeholder="Required for full breach data"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-cyber-300 mb-1">ParseHub API Key</label>
                        <div className="flex gap-2">
                            <input 
                                name="parseHubApiKey"
                                value={formData.parseHubApiKey}
                                onChange={handleChange}
                                type="password"
                                className="flex-1 bg-cyber-950 border border-cyber-700 rounded px-3 py-2 text-sm text-white focus:border-cyber-accent focus:outline-none"
                                placeholder="Required for Dark Web Scraper"
                            />
                            <button 
                                type="button"
                                onClick={handleTestParseHub}
                                disabled={testStatus.loading || !formData.parseHubApiKey}
                                className="px-3 py-2 bg-cyber-800 border border-cyber-600 rounded text-xs font-bold text-cyber-accent hover:bg-cyber-700 transition-colors disabled:opacity-50"
                            >
                                {testStatus.loading ? '...' : 'TEST'}
                            </button>
                        </div>
                        {testStatus.message && (
                            <p className={`text-[10px] mt-1 font-mono ${testStatus.success ? 'text-cyber-success' : 'text-cyber-danger'}`}>
                                {testStatus.message}
                            </p>
                        )}
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-cyber-600 hover:bg-cyber-500 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    SAVE CONFIGURATION
                </button>
            </form>
        ) : (
            <div className="space-y-4">
                 <div className="bg-cyber-950/50 p-4 rounded border border-cyber-700 text-sm text-cyber-300">
                    <p className="mb-2"><strong className="text-cyber-accent">Initial Setup:</strong> To enable data storage, run the following SQL query in your Supabase Project's SQL Editor.</p>
                 </div>
                 <div className="relative group">
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => navigator.clipboard.writeText(SQL_SCHEMA)}
                            className="bg-cyber-700 text-xs px-2 py-1 rounded hover:bg-cyber-600 text-white"
                         >
                            Copy SQL
                         </button>
                     </div>
                     <pre className="bg-black p-4 rounded border border-cyber-800 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                        {SQL_SCHEMA}
                     </pre>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};
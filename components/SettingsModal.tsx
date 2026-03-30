import React, { useState, useEffect } from 'react';
import { X, Save, Database, Key } from 'lucide-react';
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
            const originalConfig = localStorage.getItem('kavach_config');
            localStorage.setItem('kavach_config', JSON.stringify({ ...formData }));

            const projects = await fetchParseHubProjects();

            if (projects && projects.length > 0) {
                setTestStatus({ loading: false, success: true, message: `Success! Found ${projects.length} projects.` });
            } else {
                setTestStatus({ loading: false, success: false, message: 'Connection failed. Check API key.' });
            }

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

    const inputClass = "w-full bg-[#f5f5f0] border border-[#e8e6e0] rounded-lg px-3 py-2.5 text-sm text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-colors";
    const labelClass = "block text-xs font-semibold text-[#555] mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white border border-[#e8e6e0] rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#ccc] hover:text-[#111] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f0]"
                >
                    <X className="w-4 h-4" />
                </button>

                <h2 className="text-lg font-black text-[#111] mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#fff4ee] rounded-lg flex items-center justify-center">
                        <Database className="w-4 h-4 text-[#e8521a]" />
                    </div>
                    System Configuration
                </h2>

                <div className="flex gap-1 mb-5 bg-[#f5f5f0] p-1 rounded-lg">
                    <button
                        onClick={() => setShowSchema(false)}
                        className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${!showSchema ? 'bg-white text-[#111] shadow-sm' : 'text-[#888] hover:text-[#333]'}`}
                    >
                        API Keys & Connections
                    </button>
                    <button
                        onClick={() => setShowSchema(true)}
                        className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${showSchema ? 'bg-white text-[#111] shadow-sm' : 'text-[#888] hover:text-[#333]'}`}
                    >
                        Database Schema
                    </button>
                </div>

                {!showSchema ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Supabase Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-2">
                                <Database className="w-3 h-3" /> Database (Supabase)
                            </h3>
                            <div>
                                <label className={labelClass}>Project URL</label>
                                <input
                                    name="supabaseUrl"
                                    value={formData.supabaseUrl}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="https://xyz.supabase.co"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Anon Public Key</label>
                                <input
                                    name="supabaseKey"
                                    value={formData.supabaseKey}
                                    onChange={handleChange}
                                    type="password"
                                    className={inputClass}
                                    placeholder="eyJh..."
                                />
                            </div>
                        </div>

                        {/* API Keys Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider flex items-center gap-2">
                                <Key className="w-3 h-3" /> API Credentials
                            </h3>
                            <div>
                                <label className={labelClass}>VirusTotal API Key</label>
                                <input
                                    name="vtApiKey"
                                    value={formData.vtApiKey}
                                    onChange={handleChange}
                                    type="password"
                                    className={inputClass}
                                    placeholder="Required for Domain Intel"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hunter.io API Key</label>
                                <input
                                    name="hunterApiKey"
                                    value={formData.hunterApiKey}
                                    onChange={handleChange}
                                    type="password"
                                    className={inputClass}
                                    placeholder="Required for Email Finder"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>HaveIBeenPwned Key (Optional)</label>
                                <input
                                    name="hibpApiKey"
                                    value={formData.hibpApiKey}
                                    onChange={handleChange}
                                    type="password"
                                    className={inputClass}
                                    placeholder="Required for full breach data"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>ParseHub API Key</label>
                                <div className="flex gap-2">
                                    <input
                                        name="parseHubApiKey"
                                        value={formData.parseHubApiKey}
                                        onChange={handleChange}
                                        type="password"
                                        className={`${inputClass} flex-1`}
                                        placeholder="Required for Dark Web Scraper"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTestParseHub}
                                        disabled={testStatus.loading || !formData.parseHubApiKey}
                                        className="px-4 py-2 bg-[#f5f5f0] border border-[#e8e6e0] rounded-lg text-xs font-bold text-[#e8521a] hover:bg-[#fff4ee] hover:border-[#fbd5c0] transition-colors disabled:opacity-50"
                                    >
                                        {testStatus.loading ? '...' : 'TEST'}
                                    </button>
                                </div>
                                {testStatus.message && (
                                    <p className={`text-[10px] mt-1.5 font-medium ${testStatus.success ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                                        {testStatus.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#e8521a] hover:bg-[#c73f0a] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            SAVE CONFIGURATION
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-[#fff4ee] border border-[#fbd5c0] p-4 rounded-xl text-sm text-[#555]">
                            <p><strong className="text-[#e8521a]">Initial Setup:</strong> Run the following SQL query in your Supabase Project's SQL Editor to enable data storage.</p>
                        </div>
                        <div className="relative group">
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => navigator.clipboard.writeText(SQL_SCHEMA)}
                                    className="bg-white border border-[#e8e6e0] text-xs px-3 py-1.5 rounded-lg hover:bg-[#f5f5f0] text-[#555] font-medium shadow-sm"
                                >
                                    Copy SQL
                                </button>
                            </div>
                            <pre className="bg-[#0f1929] p-4 rounded-xl border border-[#1a2a40] text-xs font-mono text-[#4ade80] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                {SQL_SCHEMA}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
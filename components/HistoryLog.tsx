import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/supabaseClient';
import { HistoryLog } from '../types';
import { Clock, Search, Shield, User, Globe, Mail, ChevronDown, ChevronUp, Users } from 'lucide-react';

export const HistoryLogView: React.FC = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchHistory();
    setLogs(data);
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4 text-[#e8521a]" />;
      case 'domain': return <Globe className="w-4 h-4 text-[#16a34a]" />;
      case 'person': return <User className="w-4 h-4 text-[#d97706]" />;
      case 'password': return <Shield className="w-4 h-4 text-[#dc2626]" />;
      case 'social': return <Users className="w-4 h-4 text-[#e8521a]" />;
      default: return <Search className="w-4 h-4 text-[#888]" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'email': return 'bg-[#fff4ee] border-[#fbd5c0]';
      case 'domain': return 'bg-[#f0fdf4] border-[#bbf7d0]';
      case 'person': return 'bg-[#fffbeb] border-[#fde68a]';
      case 'password': return 'bg-[#fef2f2] border-[#fecaca]';
      case 'social': return 'bg-[#fff4ee] border-[#fbd5c0]';
      default: return 'bg-[#f5f5f0] border-[#e8e6e0]';
    }
  };

  return (
    <div className="bg-white border border-[#e8e6e0] rounded-xl p-6 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fff4ee] border border-[#fbd5c0] rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#e8521a]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111]">INTELLIGENCE HISTORY</h2>
            <p className="text-xs text-[#aaa]">{logs.length} entries in log</p>
          </div>
        </div>
        <button
          onClick={loadHistory}
          className="text-sm text-[#e8521a] hover:text-[#c73f0a] font-semibold border border-[#fbd5c0] bg-[#fff4ee] hover:bg-[#ffe8dc] px-3 py-1.5 rounded-lg transition-colors"
        >
          Refresh Log
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#e8521a] border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#bbb] border-2 border-dashed border-[#e8e6e0] rounded-xl">
          <Search className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-medium text-[#888]">No search history found.</p>
          <p className="text-xs mt-1">Perform searches in the Leak Monitor to populate this log.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="border border-[#e8e6e0] rounded-xl overflow-hidden hover:border-[#e8521a]/30 transition-colors">
              <div
                onClick={() => toggleExpand(log.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#f5f5f0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${getTypeBg(log.query_type)}`}>
                    {getIcon(log.query_type)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#111]">{log.query_value}</div>
                    <div className="text-xs text-[#aaa] font-mono">{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#666] hidden md:block truncate max-w-[200px]">{log.summary}</span>
                  {expandedId === log.id
                    ? <ChevronUp className="w-4 h-4 text-[#888]" />
                    : <ChevronDown className="w-4 h-4 text-[#bbb]" />
                  }
                </div>
              </div>

              {expandedId === log.id && (
                <div className="p-4 bg-[#0f1929] border-t border-[#e8e6e0] text-xs font-mono text-[#4ade80] whitespace-pre-wrap overflow-x-auto rounded-b-xl">
                  {JSON.stringify(log.full_data, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
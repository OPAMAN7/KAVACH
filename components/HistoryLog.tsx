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
    switch(type) {
      case 'email': return <Mail className="w-4 h-4 text-cyber-accent" />;
      case 'domain': return <Globe className="w-4 h-4 text-cyber-success" />;
      case 'person': return <User className="w-4 h-4 text-cyber-warning" />;
      case 'password': return <Shield className="w-4 h-4 text-cyber-danger" />;
      case 'social': return <Users className="w-4 h-4 text-cyber-accent" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-6 shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="text-cyber-accent" />
          INTELLIGENCE HISTORY
        </h2>
        <button 
          onClick={loadHistory}
          className="text-sm text-cyber-400 hover:text-white underline decoration-dotted"
        >
          Refresh Log
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyber-accent border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-cyber-500">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>No search history found.</p>
            <p className="text-xs mt-2">Perform searches in the Leak Monitor to populate this log.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="bg-cyber-900 border border-cyber-700 rounded overflow-hidden">
                    <div 
                        onClick={() => toggleExpand(log.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-cyber-800 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-cyber-950 rounded border border-cyber-800">
                                {getIcon(log.query_type)}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">{log.query_value}</div>
                                <div className="text-xs text-cyber-400 font-mono">{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-cyber-300 hidden md:block">{log.summary}</span>
                            {expandedId === log.id ? <ChevronUp className="w-4 h-4 text-cyber-500" /> : <ChevronDown className="w-4 h-4 text-cyber-500" />}
                        </div>
                    </div>
                    
                    {expandedId === log.id && (
                        <div className="p-4 bg-cyber-950 border-t border-cyber-800 text-xs font-mono text-cyber-300 whitespace-pre-wrap overflow-x-auto">
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
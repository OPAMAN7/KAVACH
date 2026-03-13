import React, { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { fetchRealThreats } from '../services/realFeedService';
import { ForumPost } from '../types';

export const ThreatReports: React.FC = () => {
  const [reports, setReports] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const data = await fetchRealThreats();
    setReports(data);
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Source', 'Timestamp', 'Threat Type', 'Severity', 'Sector', 'Summary'];
    const rows = reports.map(report => [
      report.source,
      new Date(report.timestamp).toISOString(),
      report.type,
      report.severity,
      report.sector,
      `"${report.content.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kavach_threat_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-cyber-accent" />
            THREAT INTELLIGENCE REPORTS
          </h2>
          <div className="flex items-center gap-3">
             <button 
                onClick={loadReports}
                className="p-2 bg-cyber-700 hover:bg-cyber-600 text-cyber-300 rounded transition-colors"
                title="Refresh Data"
             >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
             <button 
                onClick={exportCSV}
                disabled={loading || reports.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-600 hover:bg-cyber-500 text-white rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Download className="w-4 h-4" />
                EXPORT CSV
             </button>
          </div>
        </div>

        {loading && reports.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-cyber-400">
                <RefreshCw className="w-8 h-8 mb-4 animate-spin text-cyber-accent" />
                <p>Aggregating report data...</p>
           </div>
        ) : (
          <div className="overflow-x-auto border border-cyber-700 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyber-900 border-b border-cyber-700 text-xs uppercase text-cyber-400 tracking-wider">
                  <th className="p-4 font-medium">Source</th>
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Threat Type</th>
                  <th className="p-4 font-medium">Severity</th>
                  <th className="p-4 font-medium">Sector</th>
                  <th className="p-4 font-medium w-1/3">Summary</th>
                </tr>
              </thead>
              <tbody className="text-sm text-cyber-200 divide-y divide-cyber-800">
                {reports.length > 0 ? reports.map((report) => (
                  <tr key={report.id} className="bg-cyber-800/50 hover:bg-cyber-700/50 transition-colors">
                     <td className="p-4 font-mono text-xs text-cyber-400">{report.source}</td>
                     <td className="p-4 font-mono text-xs whitespace-nowrap">{new Date(report.timestamp).toLocaleString()}</td>
                     <td className="p-4">
                        <span className="px-2 py-1 bg-cyber-900 rounded border border-cyber-700 text-xs font-medium">
                            {report.type}
                        </span>
                     </td>
                     <td className="p-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                             report.severity === 'Critical' ? 'text-cyber-danger border-cyber-danger bg-cyber-danger/10' :
                             report.severity === 'High' ? 'text-cyber-warning border-cyber-warning bg-cyber-warning/10' :
                             'text-cyber-success border-cyber-success bg-cyber-success/10'
                         }`}>
                             {report.severity}
                         </span>
                     </td>
                     <td className="p-4 text-cyber-accent font-medium">{report.sector}</td>
                     <td className="p-4 text-xs text-cyber-300 leading-relaxed max-w-xs truncate" title={report.content}>
                        {report.content}
                     </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-cyber-500">
                            No active threats found in current report cycle.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
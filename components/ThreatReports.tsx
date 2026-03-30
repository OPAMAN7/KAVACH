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
    <div className="space-y-5">
      <div className="bg-white border border-[#e8e6e0] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#fff4ee] rounded-xl flex items-center justify-center border border-[#fbd5c0]">
              <FileText className="w-5 h-5 text-[#e8521a]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111]">THREAT INTELLIGENCE REPORTS</h2>
              <p className="text-xs text-[#aaa]">{reports.length} reports in current cycle</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReports}
              className="w-9 h-9 flex items-center justify-center bg-[#f5f5f0] hover:bg-[#e8e6e0] border border-[#e8e6e0] rounded-lg text-[#555] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              disabled={loading || reports.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8521a] hover:bg-[#c73f0a] text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4" />
              EXPORT CSV
            </button>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#aaa]">
            <div className="w-12 h-12 bg-[#fff4ee] rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#e8521a]" />
            </div>
            <p className="text-sm">Aggregating report data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#e8e6e0] rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f5f0] border-b border-[#e8e6e0] text-xs uppercase text-[#888] tracking-wider">
                  <th className="p-4 font-semibold">Source</th>
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Threat Type</th>
                  <th className="p-4 font-semibold">Severity</th>
                  <th className="p-4 font-semibold">Sector</th>
                  <th className="p-4 font-semibold w-1/3">Summary</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#333] divide-y divide-[#f0efe8]">
                {reports.length > 0 ? reports.map((report) => (
                  <tr key={report.id} className="bg-white hover:bg-[#f5f5f0] transition-colors">
                    <td className="p-4 font-mono text-xs text-[#888]">{report.source}</td>
                    <td className="p-4 font-mono text-xs text-[#666] whitespace-nowrap">{new Date(report.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-[#f5f5f0] border border-[#e8e6e0] rounded-md text-xs font-medium text-[#555]">
                        {report.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase border ${report.severity === 'Critical' ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]' :
                          report.severity === 'High' ? 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]' :
                            'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                        }`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="p-4 text-[#e8521a] font-semibold text-xs">{report.sector}</td>
                    <td className="p-4 text-xs text-[#666] leading-relaxed max-w-xs truncate" title={report.content}>
                      {report.content}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#bbb] text-sm">
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
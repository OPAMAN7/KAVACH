import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { fetchRealThreats } from '../services/realFeedService';
import { ForumPost, ThreatSeverity, ThreatSector, ThreatType } from '../types';
import { StatCard } from './StatCard';
import { AlertTriangle, Database, MessageSquareWarning, Target, RefreshCw, ExternalLink, Activity } from 'lucide-react';

const RADIAN = Math.PI / 180;

<<<<<<< HEAD
// Color mapping for dynamic charts (adapted for light theme)
const SECTOR_COLORS: Record<string, string> = {
    [ThreatSector.FINANCE]: '#d97706',
    [ThreatSector.ENERGY]: '#dc2626',
    [ThreatSector.TELECOM]: '#2563eb',
    [ThreatSector.DEFENSE]: '#7c3aed',
    [ThreatSector.TRANSPORT]: '#0891b2',
    [ThreatSector.HEALTHCARE]: '#e8521a',
    'Other': '#9ca3af'
};

const SEVERITY_COLORS: Record<string, string> = {
    [ThreatSeverity.CRITICAL]: '#dc2626',
    [ThreatSeverity.HIGH]: '#d97706',
    [ThreatSeverity.MEDIUM]: '#e8521a',
    [ThreatSeverity.LOW]: '#16a34a',
=======
// Color mapping for dynamic charts
const SECTOR_COLORS: Record<string, string> = {
  [ThreatSector.FINANCE]: '#ffd166',
  [ThreatSector.ENERGY]: '#ef476f',
  [ThreatSector.TELECOM]: '#06d6a0',
  [ThreatSector.DEFENSE]: '#118ab2',
  [ThreatSector.TRANSPORT]: '#a8dadc',
  [ThreatSector.HEALTHCARE]: '#e63946',
  'Other': '#8d99ae'
};

const SEVERITY_COLORS: Record<string, string> = {
  [ThreatSeverity.CRITICAL]: '#ef476f',
  [ThreatSeverity.HIGH]: '#ffd166',
  [ThreatSeverity.MEDIUM]: '#00f2ea',
  [ThreatSeverity.LOW]: '#06d6a0',
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
};

// Custom Label for Pie Chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
<<<<<<< HEAD
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export const DashboardOverview: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeThreats: 0,
        leaks: 0,
        attacks: 0,
        sectors: 0
    });
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [sectorData, setSectorData] = useState<any[]>([]);
    const [severityData, setSeverityData] = useState<any[]>([]);
    const [recentAlerts, setRecentAlerts] = useState<ForumPost[]>([]);
    const [parseHubStatus, setParseHubStatus] = useState<{ count: number, active: boolean }>({ count: 0, active: false });

    useEffect(() => {
        loadRealData();
    }, []);

    const loadRealData = async () => {
        setLoading(true);
        try {
            const posts = await fetchRealThreats();
            processThreatData(posts);

            const phPosts = posts.filter(p => p.source.includes('ParseHub'));
            setParseHubStatus({
                count: phPosts.length,
                active: phPosts.length > 0
            });
        } catch (e) {
            console.error("Failed to load dashboard data:", e);
        } finally {
            setLoading(false);
        }
    };

    const processThreatData = (posts: ForumPost[]) => {
        const leaksCount = posts.filter(p => p.type === ThreatType.LEAK).length;
        const attacksCount = posts.filter(p => p.type !== ThreatType.LEAK).length;
        const uniqueSectors = new Set(posts.map(p => p.sector)).size;

        setStats({
            activeThreats: posts.length,
            leaks: leaksCount,
            attacks: attacksCount,
            sectors: uniqueSectors
        });

        const timelineMap: Record<string, { date: string, leaks: number, attacks: number }> = {};
        const sortedPosts = [...posts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (sortedPosts.length > 0) {
            sortedPosts.forEach(post => {
                const dateObj = new Date(post.timestamp);
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                if (!timelineMap[dateStr]) {
                    timelineMap[dateStr] = { date: dateStr, leaks: 0, attacks: 0 };
                }

                if (post.type === ThreatType.LEAK) {
                    timelineMap[dateStr].leaks += 1;
                } else {
                    timelineMap[dateStr].attacks += 1;
                }
            });
        }
        setTimelineData(Object.values(timelineMap));

        const sectorCounts: Record<string, number> = {};
        posts.forEach(p => {
            const key = p.sector || 'Other';
            sectorCounts[key] = (sectorCounts[key] || 0) + 1;
        });

        const sData = Object.keys(sectorCounts)
            .map(sector => ({
                name: sector,
                value: sectorCounts[sector],
                color: SECTOR_COLORS[sector] || SECTOR_COLORS['Other']
            }))
            .sort((a, b) => b.value - a.value);

        setSectorData(sData);

        const sevCounts: Record<string, number> = {};
        posts.forEach(p => {
            sevCounts[p.severity] = (sevCounts[p.severity] || 0) + 1;
        });
        const sevData = Object.keys(sevCounts).map(sev => ({
            name: sev,
            value: sevCounts[sev],
            fill: SEVERITY_COLORS[sev] || '#9ca3af'
        }));
        setSeverityData(sevData);

        const criticals = posts
            .filter(p => p.severity === ThreatSeverity.CRITICAL || p.severity === ThreatSeverity.HIGH)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
        setRecentAlerts(criticals);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-[#888]">
                <div className="w-16 h-16 mb-6 rounded-full bg-[#fff4ee] flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#e8521a]" />
                </div>
                <h2 className="text-xl font-bold text-[#111] mb-2">Establishing Secure Link...</h2>
                <p className="text-sm text-[#888]">Aggregating intelligence from Reddit & GitHub nodes</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Page Header */}
            <div className="pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
                    <span className="text-xs font-semibold text-[#16a34a] uppercase tracking-wider">Live Defense Status: Operational</span>
                </div>
                <h1 className="text-3xl font-black text-[#111] leading-tight">Executive Cybersecurity Intelligence</h1>
                <p className="text-[#666] text-sm mt-1 max-w-xl">
                    High-fidelity active defense monitoring and strategic threat neutralization for national infrastructure.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Active Intelligence"
                    value={stats.activeThreats}
                    icon={Activity}
                    trend="LIVE"
                    trendUp={true}
                    colorClass="text-[#e8521a]"
                />
                <StatCard
                    title="Credential Leaks"
                    value={stats.leaks}
                    icon={Database}
                    trend={`${((stats.leaks / (stats.activeThreats || 1)) * 100).toFixed(0)}%`}
                    trendUp={true}
                    colorClass="text-[#d97706]"
                />
                <StatCard
                    title="Attack Discussions"
                    value={stats.attacks}
                    icon={MessageSquareWarning}
                    colorClass="text-[#dc2626]"
                />
                <StatCard
                    title="Sectors Targeted"
                    value={stats.sectors}
                    icon={Target}
                    colorClass="text-[#16a34a]"
                />
            </div>

            {/* Intelligence Nodes Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-[#e8e6e0] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${parseHubStatus.active ? 'bg-[#16a34a] shadow-[0_0_6px_rgba(22,163,74,0.4)]' : 'bg-[#d4d0c8]'}`} />
                        <div>
                            <div className="text-[10px] text-[#999] uppercase font-semibold tracking-wide">Dark Web Node</div>
                            <div className="text-sm text-[#111] font-semibold">ParseHub Scraper</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#bbb] uppercase font-medium">Status</div>
                        <div className={`text-xs font-bold ${parseHubStatus.active ? 'text-[#16a34a]' : 'text-[#aaa]'}`}>
                            {parseHubStatus.active ? 'CONNECTED' : 'STANDBY'}
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-[#e8e6e0] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shadow-[0_0_6px_rgba(22,163,74,0.4)] flex-shrink-0" />
                        <div>
                            <div className="text-[10px] text-[#999] uppercase font-semibold tracking-wide">OSINT Node</div>
                            <div className="text-sm text-[#111] font-semibold">Reddit & GitHub</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#bbb] uppercase font-medium">Status</div>
                        <div className="text-xs font-bold text-[#16a34a]">OPERATIONAL</div>
                    </div>
                </div>
                <div className="bg-white border border-[#e8e6e0] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shadow-[0_0_6px_rgba(22,163,74,0.4)] flex-shrink-0" />
                        <div>
                            <div className="text-[10px] text-[#999] uppercase font-semibold tracking-wide">Gov Intel Node</div>
                            <div className="text-sm text-[#111] font-semibold">CISA KEV Feed</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-[#bbb] uppercase font-medium">Status</div>
                        <div className="text-xs font-bold text-[#16a34a]">SYNCED</div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Trend Line Chart */}
                <div className="lg:col-span-2 bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#e8521a] rounded-full" />
                            THREAT ACTIVITY TIMELINE
                        </h3>
                        <span className="text-xs text-[#aaa] font-medium uppercase tracking-wide">Source: Live API</span>
                    </div>
                    <div className="h-56">
                        {timelineData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLeaks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e8521a" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#e8521a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#ddd" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#aaa' }} />
                                    <YAxis stroke="#ddd" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#aaa' }} />
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0efe8" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e8e6e0', color: '#111', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#333' }}
                                    />
                                    <Area type="monotone" dataKey="leaks" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorLeaks)" name="Leaks" connectNulls />
                                    <Area type="monotone" dataKey="attacks" stroke="#e8521a" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" name="Attacks" connectNulls />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#bbb] text-sm">Not enough history data for timeline</div>
                        )}
                    </div>
                </div>

                {/* Sector Bar Chart */}
                <div className="bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#d97706] rounded-full" />
                        SECTORS UNDER FIRE
                    </h3>
                    <div className="h-56">
                        {sectorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sectorData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                                    <XAxis type="number" stroke="#ddd" hide />
                                    <YAxis dataKey="name" type="category" stroke="#ccc" fontSize={11} width={60} tick={{ fill: '#666' }} />
                                    <Tooltip cursor={{ fill: '#f5f5f0' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#e8e6e0', color: '#111', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {sectorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#bbb] text-sm">No sector data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#16a34a] rounded-full" />
                        THREAT SEVERITY DISTRIBUTION
                    </h3>
                    <div className="h-56 flex items-center justify-center">
                        {severityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e8e6e0', borderRadius: '8px' }} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#555' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[#bbb] text-sm">No data to display</div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#111] mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                            PRIORITY ALERTS (LIVE)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dc2626] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dc2626]" />
                            </span>
                            <span className="text-[10px] text-[#dc2626] font-semibold uppercase tracking-wide">Real-Time</span>
                        </div>
                    </h3>
                    <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                        {recentAlerts.length > 0 ? recentAlerts.map((post) => (
                            <div key={post.id} className="flex items-start gap-3 p-3 bg-[#fef2f2] rounded-lg border border-[#fecaca] hover:border-[#dc2626]/40 transition-colors">
                                <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] text-[#aaa] font-mono">{new Date(post.timestamp).toLocaleTimeString()}</span>
                                        <span className="text-[10px] border border-[#e8e6e0] bg-white px-1.5 rounded text-[#888] font-medium">{post.source}</span>
                                    </div>
                                    <p className="text-xs text-[#111] font-semibold truncate">{post.content}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] text-[#dc2626] uppercase font-bold">{post.severity}</span>
                                        <span className="text-[10px] text-[#e8521a] uppercase">Target: {post.sector}</span>
                                    </div>
                                </div>
                                <a href={post.source === 'GitHub' ? post.rawContent : `https://reddit.com/${post.source}/comments/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-[#ccc] hover:text-[#e8521a] transition-colors flex-shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-[#bbb]">
                                <p className="text-sm">No critical threats detected in current stream.</p>
                                <p className="text-xs mt-1">System is monitoring global channels.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
=======
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const DashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeThreats: 0,
    leaks: 0,
    attacks: 0,
    sectors: 0
  });
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<ForumPost[]>([]);
  const [parseHubStatus, setParseHubStatus] = useState<{ count: number, active: boolean }>({ count: 0, active: false });

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
        // Fetch fresh data from live sources
        const posts = await fetchRealThreats();
        processThreatData(posts);
        
        // Specifically check ParseHub data for status widget
        const phPosts = posts.filter(p => p.source.includes('ParseHub'));
        setParseHubStatus({
            count: phPosts.length,
            active: phPosts.length > 0
        });
    } catch (e) {
        console.error("Failed to load dashboard data:", e);
    } finally {
        setLoading(false);
    }
  };

  const processThreatData = (posts: ForumPost[]) => {
      // 1. Calculate Stats
      const leaksCount = posts.filter(p => p.type === ThreatType.LEAK).length;
      const attacksCount = posts.filter(p => p.type !== ThreatType.LEAK).length;
      const uniqueSectors = new Set(posts.map(p => p.sector)).size;
      
      setStats({
          activeThreats: posts.length,
          leaks: leaksCount,
          attacks: attacksCount,
          sectors: uniqueSectors
      });

      // 2. Process Timeline (Group by Date)
      const timelineMap: Record<string, { date: string, leaks: number, attacks: number }> = {};
      
      // Sort ascending for chart
      const sortedPosts = [...posts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (sortedPosts.length > 0) {
        sortedPosts.forEach(post => {
            const dateObj = new Date(post.timestamp);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!timelineMap[dateStr]) {
                timelineMap[dateStr] = { date: dateStr, leaks: 0, attacks: 0 };
            }

            if (post.type === ThreatType.LEAK) {
                timelineMap[dateStr].leaks += 1;
            } else {
                timelineMap[dateStr].attacks += 1;
            }
        });
      }
      setTimelineData(Object.values(timelineMap));

      // 3. Process Sector Distribution
      const sectorCounts: Record<string, number> = {};
      posts.forEach(p => {
          const key = p.sector || 'Other';
          sectorCounts[key] = (sectorCounts[key] || 0) + 1;
      });
      
      const sData = Object.keys(sectorCounts)
        .map(sector => ({
            name: sector,
            value: sectorCounts[sector],
            color: SECTOR_COLORS[sector] || SECTOR_COLORS['Other']
        }))
        .sort((a, b) => b.value - a.value); // Sort highest first
      
      setSectorData(sData);

      // 4. Process Severity Distribution
      const sevCounts: Record<string, number> = {};
      posts.forEach(p => {
          sevCounts[p.severity] = (sevCounts[p.severity] || 0) + 1;
      });
      const sevData = Object.keys(sevCounts).map(sev => ({
          name: sev,
          value: sevCounts[sev],
          fill: SEVERITY_COLORS[sev] || '#8884d8'
      }));
      setSeverityData(sevData);

      // 5. Extract Recent Critical/High Alerts
      const criticals = posts
        .filter(p => p.severity === ThreatSeverity.CRITICAL || p.severity === ThreatSeverity.HIGH)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
      setRecentAlerts(criticals);
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-cyber-400">
            <RefreshCw className="w-16 h-16 mb-6 animate-spin text-cyber-accent" />
            <h2 className="text-2xl font-bold text-white mb-2">Establishing Secure Link...</h2>
            <p className="font-mono text-sm">Aggregating intelligence from Reddit & GitHub nodes</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Active Intelligence" 
            value={stats.activeThreats} 
            icon={Activity} 
            trend="LIVE" 
            trendUp={true} 
            colorClass="text-cyber-accent" 
        />
        <StatCard 
            title="Credential Leaks" 
            value={stats.leaks} 
            icon={Database} 
            trend={`${((stats.leaks / (stats.activeThreats || 1)) * 100).toFixed(0)}%`} 
            trendUp={true} 
            colorClass="text-cyber-warning" 
        />
        <StatCard 
            title="Attack Discussions" 
            value={stats.attacks} 
            icon={MessageSquareWarning} 
            colorClass="text-cyber-danger" 
        />
        <StatCard 
            title="Sectors Targeted" 
            value={stats.sectors} 
            icon={Target} 
            colorClass="text-cyber-success" 
        />
      </div>
      
      {/* Intelligence Nodes Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${parseHubStatus.active ? 'bg-cyber-success shadow-[0_0_8px_rgba(6,214,160,0.5)]' : 'bg-cyber-400'}`}></div>
                <div>
                    <div className="text-[10px] text-cyber-400 uppercase font-bold">Dark Web Node</div>
                    <div className="text-sm text-white font-mono">ParseHub Scraper</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-cyber-500 uppercase">Status</div>
                <div className={`text-xs font-bold ${parseHubStatus.active ? 'text-cyber-success' : 'text-cyber-400'}`}>
                    {parseHubStatus.active ? 'CONNECTED' : 'STANDBY'}
                </div>
            </div>
        </div>
        <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyber-success shadow-[0_0_8px_rgba(6,214,160,0.5)]"></div>
                <div>
                    <div className="text-[10px] text-cyber-400 uppercase font-bold">OSINT Node</div>
                    <div className="text-sm text-white font-mono">Reddit & GitHub</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-cyber-500 uppercase">Status</div>
                <div className="text-xs font-bold text-cyber-success">OPERATIONAL</div>
            </div>
        </div>
        <div className="bg-cyber-900/50 border border-cyber-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cyber-success shadow-[0_0_8px_rgba(6,214,160,0.5)]"></div>
                <div>
                    <div className="text-[10px] text-cyber-400 uppercase font-bold">Gov Intel Node</div>
                    <div className="text-sm text-white font-mono">CISA KEV Feed</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-cyber-500 uppercase">Status</div>
                <div className="text-xs font-bold text-cyber-success">SYNCED</div>
            </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-cyber-800 border border-cyber-600 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-bold flex items-center">
                <span className="w-1 h-4 bg-cyber-accent mr-2"></span>
                THREAT ACTIVITY TIMELINE
            </h3>
            <span className="text-xs text-cyber-400 font-mono">SOURCE: LIVE API</span>
          </div>
          <div className="h-64">
            {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorLeaks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef476f" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef476f" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00f2ea" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#457b9d" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#457b9d" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d3557" vertical={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1d3557', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="leaks" stroke="#ef476f" fillOpacity={1} fill="url(#colorLeaks)" name="Leaks" connectNulls />
                    <Area type="monotone" dataKey="attacks" stroke="#00f2ea" fillOpacity={1} fill="url(#colorAttacks)" name="Attacks" connectNulls />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-cyber-500 text-sm">Not enough history data for timeline</div>
            )}
          </div>
        </div>

        {/* Sector Bar Chart */}
        <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-4 shadow-lg">
          <h3 className="text-white text-sm font-bold mb-4 flex items-center">
             <span className="w-1 h-4 bg-cyber-warning mr-2"></span>
             SECTORS UNDER FIRE
          </h3>
          <div className="h-64">
             {sectorData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" stroke="#457b9d" hide />
                    <YAxis dataKey="name" type="category" stroke="#a8dadc" fontSize={11} width={60} />
                    <Tooltip cursor={{fill: '#1d3557'}} contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1d3557', color: '#fff' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-cyber-500 text-sm">No sector data available</div>
             )}
          </div>
        </div>
      </div>

       {/* Charts Row 2 */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-4 shadow-lg">
             <h3 className="text-white text-sm font-bold mb-4 flex items-center">
               <span className="w-1 h-4 bg-cyber-success mr-2"></span>
               THREAT SEVERITY DISTRIBUTION
             </h3>
             <div className="h-64 flex items-center justify-center">
                {severityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        dataKey="value"
                        >
                            {severityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1d3557' }} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-cyber-500 text-sm">No data to display</div>
                )}
             </div>
          </div>

          <div className="bg-cyber-800 border border-cyber-600 rounded-lg p-4 shadow-lg">
              <h3 className="text-white text-sm font-bold mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <span className="w-1 h-4 bg-cyber-danger mr-2"></span>
                    PRIORITY ALERTS (LIVE)
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-danger opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-danger"></span>
                    </span>
                    <span className="text-xs text-cyber-danger font-mono">REAL-TIME</span>
                </div>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {recentAlerts.length > 0 ? recentAlerts.map((post) => (
                   <div key={post.id} className="flex items-start gap-3 p-3 bg-cyber-900/50 rounded border-l-2 border-cyber-danger hover:bg-cyber-900 transition-colors">
                      <AlertTriangle className="w-5 h-5 text-cyber-danger shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-cyber-400 font-mono">{new Date(post.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[10px] uppercase border border-cyber-700 px-1 rounded text-cyber-500">{post.source}</span>
                        </div>
                        <p className="text-sm text-cyber-100 font-medium truncate">{post.content}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-cyber-danger uppercase font-bold">{post.severity}</span>
                            <span className="text-[10px] text-cyber-accent uppercase">Target: {post.sector}</span>
                        </div>
                      </div>
                      <a href={post.source === 'GitHub' ? post.rawContent : `https://reddit.com/${post.source}/comments/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-cyber-500 hover:text-white">
                          <ExternalLink className="w-4 h-4" />
                      </a>
                   </div>
                )) : (
                    <div className="text-center py-8 text-cyber-500">
                        <p>No critical threats detected in current stream.</p>
                        <p className="text-xs mt-1">System is monitoring global channels.</p>
                    </div>
                )}
              </div>
          </div>
       </div>
    </div>
  );
>>>>>>> 56db3e8247e61c3986066c68fee7e7ea022c0cac
};
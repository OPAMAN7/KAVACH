import React, { useState, useCallback } from 'react';
import {
  ScanSearch, Play, StopCircle, Globe, ChevronDown, ChevronUp,
  AlertTriangle, Info, AlertCircle, CheckCircle2, Loader2,
  Download, Search, X, Filter, BarChart2, Clock, Zap,
  RefreshCw, LayoutGrid, List
} from 'lucide-react';
import {
  SF_MODULES, runAllModules, ModuleId, SFResult, SFItem
} from '../services/spiderfootService';

// ─── Risk colour map ──────────────────────────────────────────────────────────
const RISK: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <AlertTriangle className="w-3 h-3" />, label: 'CRITICAL' },
  high:     { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', icon: <AlertCircle   className="w-3 h-3" />, label: 'HIGH' },
  medium:   { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', icon: <Info          className="w-3 h-3" />, label: 'MEDIUM' },
  low:      { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: <Info          className="w-3 h-3" />, label: 'LOW' },
  info:     { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb', icon: <CheckCircle2  className="w-3 h-3" />, label: 'INFO' },
};
const rc = (r?: string) => RISK[r || 'info'] || RISK.info;

const CAT_COLORS: Record<string, string> = {
  DNS: '#2563eb', SSL: '#7c3aed', Domain: '#0891b2', Web: '#16a34a',
  Extractor: '#d97706', Intelligence: '#e8521a', Network: '#9333ea',
};

const CATEGORIES = ['All', ...Array.from(new Set(SF_MODULES.map(m => m.category)))];

// ─── Sub-components ───────────────────────────────────────────────────────────
function RiskPill({ risk }: { risk?: string }) {
  const c = rc(risk);
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {c.icon}{c.label}
    </span>
  );
}

function ResultItem({ item }: { item: SFItem }) {
  const c = rc(item.risk);
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f3f0] last:border-0">
      <RiskPill risk={item.risk} />
      <div className="flex-1 min-w-0">
        <span className="text-[9px] text-[#aaa] font-bold uppercase tracking-wider mr-1">{item.type}:</span>
        <span className="text-[11px] text-[#222] font-mono break-all">{item.value}</span>
        {item.detail && <div className="text-[9px] text-[#888] mt-0.5">{item.detail}</div>}
      </div>
    </div>
  );
}

function ModuleResultCard({ result }: { result: SFResult }) {
  const [open, setOpen] = useState(true);
  const highest = result.data.reduce<string>((best, it) => {
    const order = ['critical','high','medium','low','info'];
    const idx = order.indexOf(it.risk || 'info');
    const bidx = order.indexOf(best);
    return idx < bidx ? (it.risk || 'info') : best;
  }, 'info');
  const c = rc(highest);

  return (
    <div className="border border-[#e8e6e0] rounded-xl overflow-hidden shadow-sm bg-white">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fafaf9] transition-colors">
        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: c.text }} />
        <div className="flex-1 text-left min-w-0">
          <div className="text-xs font-black text-[#222] truncate">{result.label}</div>
          <div className="text-[9px] text-[#aaa] mt-0.5 flex items-center gap-2">
            <span>{result.data.length} findings</span>
            <span className="opacity-50">·</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{result.durationMs}ms</span>
            {result.error && <span className="text-[#dc2626]">· Error: {result.error}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {['critical','high','medium'].map(r => {
            const cnt = result.data.filter(d => d.risk === r).length;
            if (!cnt) return null;
            const rc2 = rc(r);
            return <span key={r} className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: rc2.bg, color: rc2.text, border: `1px solid ${rc2.border}` }}>{cnt}</span>;
          })}
          {open ? <ChevronUp className="w-4 h-4 text-[#bbb]" /> : <ChevronDown className="w-4 h-4 text-[#bbb]" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 max-h-72 overflow-y-auto">
          {result.data.length === 0 && !result.error && (
            <p className="text-[10px] text-[#bbb] py-2 text-center">No findings</p>
          )}
          {result.data.map((item, i) => <ResultItem key={i} item={item} />)}
        </div>
      )}
    </div>
  );
}

function ModuleCheckbox({ mod, checked, onChange, running }: {
  mod: typeof SF_MODULES[0]; checked: boolean; onChange: (v: boolean) => void; running: boolean;
}) {
  const catColor = CAT_COLORS[mod.category] || '#6b7280';
  return (
    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
      checked ? 'border-[#e8521a]/40 bg-[#fff4ee]' : 'border-[#e8e6e0] bg-white hover:border-[#e8521a]/30'
    } ${running ? 'opacity-50 pointer-events-none' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 accent-[#e8521a]" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-[#222]">{mod.label}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: catColor + '20', color: catColor, border: `1px solid ${catColor}40` }}>
            {mod.category}
          </span>
        </div>
        <p className="text-[9px] text-[#aaa] mt-0.5 leading-relaxed">{mod.desc}</p>
      </div>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const SpiderFoot: React.FC = () => {
  const [target, setTarget] = useState('');
  const [selected, setSelected] = useState<Set<ModuleId>>(new Set(SF_MODULES.map(m => m.id)));
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SFResult[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string }>({ done: 0, total: 0, current: '' });
  const [error, setError] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const abortRef = React.useRef(false);

  const toggle = (id: ModuleId, v: boolean) => {
    setSelected(s => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n; });
  };
  const selectAll = () => setSelected(new Set(SF_MODULES.map(m => m.id)));
  const selectNone = () => setSelected(new Set());
  const selectCat = (cat: string) => {
    const ids = SF_MODULES.filter(m => m.category === cat).map(m => m.id);
    setSelected(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
  };

  const visibleMods = catFilter === 'All' ? SF_MODULES : SF_MODULES.filter(m => m.category === catFilter);

  const handleRun = useCallback(async () => {
    const raw = target.trim();
    if (!raw) { setError('Enter a target domain, IP, or URL.'); return; }
    const tgt = raw.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    const ids = [...selected] as ModuleId[];
    if (!ids.length) { setError('Select at least one module.'); return; }

    setError(null); setResults([]); setRunning(true); abortRef.current = false;
    setProgress({ done: 0, total: ids.length, current: 'Initializing…' });

    let done = 0;
    await runAllModules(tgt, ids, (id, result) => {
      if (abortRef.current) return;
      done++;
      setResults(prev => [...prev, result]);
      setProgress({ done, total: ids.length, current: result.label });
    });

    setRunning(false);
    setProgress(p => ({ ...p, current: 'Complete' }));
  }, [target, selected]);

  const handleStop = () => { abortRef.current = true; setRunning(false); };

  // Stats
  const totalFindings = results.reduce((s, r) => s + r.data.length, 0);
  const critCount = results.flatMap(r => r.data).filter(d => d.risk === 'critical').length;
  const highCount = results.flatMap(r => r.data).filter(d => d.risk === 'high').length;

  // Filter results
  const filteredResults = results.filter(r => {
    if (riskFilter === 'all') return true;
    return r.data.some(d => d.risk === riskFilter);
  });

  const exportReport = () => {
    const rows = results.flatMap(r => r.data.map(d =>
      `${r.label}\t${d.type}\t${d.risk || 'info'}\t${d.value}\t${d.detail || ''}`
    )).join('\n');
    const csv = 'Module\tType\tRisk\tValue\tDetail\n' + rows;
    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `kavach-spiderfoot-${target}-${Date.now()}.tsv`; a.click();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white border border-[#e8e6e0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#fff4ee] to-[#fbd5c0] border border-[#fbd5c0] rounded-2xl flex items-center justify-center flex-shrink-0">
            <ScanSearch className="w-7 h-7 text-[#e8521a]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111] tracking-tight">SPIDERFOOT RECON ENGINE</h2>
            <p className="text-[#888] text-sm mt-0.5">
              {SF_MODULES.length} non-API modules · DNS · WHOIS · SSL · Web scraping · Pattern extractors · Network recon
            </p>
          </div>
        </div>

        {/* Target input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
            <input
              value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !running && handleRun()}
              placeholder="example.com / 8.8.8.8 / https://target.org"
              disabled={running}
              className="w-full bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl pl-10 pr-4 py-3 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all font-mono text-sm disabled:opacity-50"
            />
          </div>
          {!running ? (
            <button onClick={handleRun}
              className="bg-[#e8521a] hover:bg-[#c73f0a] text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
              <Play className="w-4 h-4" /> RUN SCAN ({selected.size} modules)
            </button>
          ) : (
            <button onClick={handleStop}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm">
              <StopCircle className="w-4 h-4" /> STOP
            </button>
          )}
        </div>

        {/* Progress */}
        {running && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-[#888] mb-1">
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin text-[#e8521a]" /> {progress.current}</span>
              <span>{progress.done}/{progress.total} modules</span>
            </div>
            <div className="h-1.5 bg-[#f5f5f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#e8521a] rounded-full transition-all duration-300"
                style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center gap-2 text-sm text-[#dc2626] mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Module selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">Module Selection ({selected.size}/{SF_MODULES.length})</span>
            <div className="flex gap-1.5">
              <button onClick={selectAll} className="text-[9px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-2 py-1 rounded font-bold hover:bg-[#16a34a] hover:text-white transition-colors">All</button>
              <button onClick={selectNone} className="text-[9px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] px-2 py-1 rounded font-bold hover:bg-[#dc2626] hover:text-white transition-colors">None</button>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <button key={c} onClick={() => selectCat(c)}
                  className="text-[9px] px-2 py-1 rounded font-bold border transition-colors"
                  style={{ background: (CAT_COLORS[c] || '#888') + '15', color: CAT_COLORS[c] || '#888', borderColor: (CAT_COLORS[c] || '#888') + '40' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Category tab filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`text-[9px] px-2.5 py-1 rounded-full font-bold border transition-all ${catFilter === c ? 'bg-[#e8521a] text-white border-[#e8521a]' : 'bg-white text-[#555] border-[#e8e6e0] hover:border-[#e8521a]'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className={`grid gap-2 max-h-64 overflow-y-auto ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {visibleMods.map(mod => (
              <ModuleCheckbox key={mod.id} mod={mod} checked={selected.has(mod.id as ModuleId)}
                onChange={v => toggle(mod.id as ModuleId, v)} running={running} />
            ))}
          </div>
        </div>
      </div>

      {/* Results panel */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="bg-[#111] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ScanSearch className="w-5 h-5 text-[#e8521a]" />
              <div>
                <div className="text-white font-black text-sm">SCAN RESULTS — {target}</div>
                <div className="text-[#888] text-[10px] font-mono">{results.length} modules · {totalFindings} total findings</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {critCount > 0 && <span className="text-[9px] font-black bg-[#dc2626] text-white px-2 py-1 rounded-full">{critCount} CRITICAL</span>}
              {highCount > 0 && <span className="text-[9px] font-black bg-[#ea580c] text-white px-2 py-1 rounded-full">{highCount} HIGH</span>}
              <button onClick={exportReport} className="flex items-center gap-1.5 bg-[#e8521a] hover:bg-[#c73f0a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                <Download className="w-3 h-3" /> Export TSV
              </button>
              <button onClick={() => { setResults([]); setProgress({ done: 0, total: 0, current: '' }); }}
                className="flex items-center gap-1.5 bg-[#333] hover:bg-[#444] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                <RefreshCw className="w-3 h-3" /> New Scan
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Findings', value: totalFindings, color: '#e8521a' },
              { label: 'Critical', value: critCount, color: '#dc2626' },
              { label: 'High', value: highCount, color: '#ea580c' },
              { label: 'Modules Run', value: results.length, color: '#2563eb' },
              { label: 'With Findings', value: results.filter(r => r.data.length > 0).length, color: '#16a34a' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e8e6e0] rounded-xl p-3 text-center shadow-sm">
                <div className="font-black text-xl" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] text-[#aaa] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Risk filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#888]" />
            <span className="text-[9px] text-[#888] font-bold uppercase">Filter by risk:</span>
            {['all','critical','high','medium','low','info'].map(r => {
              const c = r === 'all' ? { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' } : rc(r);
              return (
                <button key={r} onClick={() => setRiskFilter(r)}
                  className="text-[9px] font-black px-2.5 py-1 rounded-full border transition-all"
                  style={riskFilter === r ? { background: c.text, color: '#fff', borderColor: c.text } : { background: c.bg, color: c.text, borderColor: c.border }}>
                  {r.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Results grid */}
          <div className="space-y-3">
            {filteredResults.map(r => <ModuleResultCard key={r.module} result={r} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !running && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap className="w-4 h-4 text-[#e8521a]" />, title: '32 Non-API Modules', text: 'DNS brute-force, WHOIS, SSL cert, web spider, subdomain takeover, hosting provider detection and more — all zero config.' },
            { icon: <Search className="w-4 h-4 text-[#2563eb]" />, title: 'Pattern Extractors', text: 'Automatically finds emails, phones, hashes, Base64, Bitcoin/ETH addresses, IBANs, credit card numbers, SQL errors in page content.' },
            { icon: <BarChart2 className="w-4 h-4 text-[#16a34a]" />, title: 'Risk Scoring', text: 'Every finding is rated Critical → Info. Export full results as TSV for offline analysis or reporting.' },
          ].map(c => (
            <div key={c.title} className="bg-white border border-[#e8e6e0] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">{c.icon}<h4 className="text-xs font-bold text-[#888] uppercase tracking-wider">{c.title}</h4></div>
              <p className="text-[10px] text-[#aaa] leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

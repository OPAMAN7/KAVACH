import React, { useState } from 'react';
import {
  Search, Users, Globe, ExternalLink, ShieldAlert,
  FileText, Download, AlertCircle, Clock, CheckCircle2, XCircle,
  Zap, Shield, Info, ChevronDown, ChevronUp, RefreshCw, Wifi
} from 'lucide-react';
import { runOSINTScan, ScanReport, PlatformResult, generateUsernameVariations, EmailResult } from '../services/osintService';
import { ScanDoodle } from './ScanDoodle';

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Tech:         { bg:'#f3f0ff', text:'#7c3aed', border:'#ddd6fe', dot:'#7c3aed' },
  Social:       { bg:'#fff4ee', text:'#e8521a', border:'#fbd5c0', dot:'#e8521a' },
  Professional: { bg:'#eff6ff', text:'#2563eb', border:'#bfdbfe', dot:'#2563eb' },
  Media:        { bg:'#fdf2f8', text:'#db2777', border:'#f9a8d4', dot:'#db2777' },
  Creative:     { bg:'#fffbeb', text:'#d97706', border:'#fde68a', dot:'#d97706' },
  Forums:       { bg:'#f0fdf4', text:'#059669', border:'#a7f3d0', dot:'#059669' },
  Messaging:    { bg:'#ecfeff', text:'#0891b2', border:'#a5f3fc', dot:'#0891b2' },
  Gaming:       { bg:'#fef2f2', text:'#dc2626', border:'#fecaca', dot:'#dc2626' },
  Identity:     { bg:'#f8fafc', text:'#475569', border:'#cbd5e1', dot:'#475569' },
  Misc:         { bg:'#f9fafb', text:'#6b7280', border:'#e5e7eb', dot:'#6b7280' },
};
const cs = (cat: string) => CAT[cat] || CAT.Misc;

// ─── Status badge ─────────────────────────────────────────────────────────────
function Badge({ status }: { status: PlatformResult['status'] }) {
  if (status === 'verified')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] uppercase"><CheckCircle2 className="w-2.5 h-2.5"/>API VERIFIED</span>;
  if (status === 'found')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#fffbeb] text-[#d97706] border border-[#fde68a] uppercase"><Wifi className="w-2.5 h-2.5"/>HTTP FOUND</span>;
  if (status === 'not_found')
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] uppercase"><XCircle className="w-2.5 h-2.5"/>NOT FOUND</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb] uppercase"><Clock className="w-2.5 h-2.5"/>UNVERIFIED</span>;
}

// ─── Profile card ─────────────────────────────────────────────────────────────
function ProfileCard({ r }: { r: PlatformResult }) {
  const [open, setOpen] = useState(false);
  const c = cs(r.category);
  const isVerified = r.status === 'verified';
  const isFound = r.status === 'found';
  const isNotFound = r.status === 'not_found';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isVerified ? 'border-[#16a34a]/30 bg-[#f0fdf4]/60' :
      isFound    ? 'border-[#d97706]/30 bg-[#fffbeb]/60' :
      isNotFound ? 'border-[#e5e7eb] bg-[#fafafa] opacity-50' :
                   'border-[#e8e6e0] bg-[#f9f9f7] hover:border-[#e8521a]/40 hover:bg-[#fff4ee]'
    }`}>
      <div className="flex items-start gap-3 p-3.5">
        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: c.dot }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#111] text-sm">{r.platform}</span>
              {(isVerified || isFound) && r.source !== 'generated' && (
                <span title={r.checkMethod}><Zap className="w-3 h-3 text-[#16a34a]" /></span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                {r.category}
              </span>
              <Badge status={r.status} />
            </div>
          </div>

          {!isNotFound && (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1 group">
              <span className="text-[10px] text-[#2563eb] truncate font-mono group-hover:underline">{r.url}</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#bbb] group-hover:text-[#e8521a] flex-shrink-0 transition-colors" />
            </a>
          )}

          {/* Quick stats row */}
          {isVerified && r.profileData && (
            <div className="flex flex-wrap gap-3 mt-1.5">
              {r.profileData.name && <span className="text-[11px] text-[#333] font-semibold">{r.profileData.name}</span>}
              {r.profileData.location && <span className="text-[10px] text-[#888]">📍 {r.profileData.location}</span>}
              {r.profileData.followers !== undefined && <span className="text-[10px] text-[#888]">👥 {r.profileData.followers}</span>}
              {r.profileData.publicRepos !== undefined && <span className="text-[10px] text-[#888]">📦 {r.profileData.publicRepos} repos</span>}
            </div>
          )}
          {isFound && (
            <span className="text-[9px] text-[#d97706] mt-1 block">HTTP 200 via corsproxy.io — visit link to confirm</span>
          )}
          {/* Check method */}
          <span className="text-[8px] text-[#bbb] mt-0.5 block font-mono">{r.checkMethod}</span>
        </div>
        {isVerified && r.profileData && (
          <button onClick={() => setOpen(o => !o)} className="text-[#888] hover:text-[#e8521a] transition-colors flex-shrink-0 mt-1">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded profile data */}
      {open && isVerified && r.profileData && (
        <div className="px-4 pb-4 border-t border-[#d1fae5] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {r.profileData.avatarUrl && (
            <div className="sm:col-span-2 flex items-center gap-3">
              <img src={r.profileData.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full border border-[#d1fae5]" />
              <div>
                {r.profileData.name && <div className="font-bold text-sm">{r.profileData.name}</div>}
                {r.profileData.joinedDate && <div className="text-[10px] text-[#888]">Joined {r.profileData.joinedDate}</div>}
              </div>
            </div>
          )}
          {r.profileData.bio && <div className="sm:col-span-2 text-[11px] text-[#555] italic border-l-2 border-[#16a34a]/30 pl-2">{r.profileData.bio}</div>}
          {r.profileData.email && <Row label="Email" v={r.profileData.email} />}
          {r.profileData.website && <Row label="Website" v={r.profileData.website} link />}
          {r.profileData.followers !== undefined && <Row label="Followers" v={String(r.profileData.followers)} />}
          {r.profileData.following !== undefined && <Row label="Following" v={String(r.profileData.following)} />}
          {r.profileData.publicRepos !== undefined && <Row label="Repos" v={String(r.profileData.publicRepos)} />}
          {r.profileData.extraInfo && Object.entries(r.profileData.extraInfo).map(([k,v]) => (
            <Row key={k} label={k[0].toUpperCase()+k.slice(1)} v={String(v)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, v, link }: { label: string; v: string; link?: boolean }) {
  return (
    <div className="text-[11px]">
      <span className="text-[9px] text-[#888] font-bold uppercase tracking-wide">{label}: </span>
      {link
        ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:underline break-all">{v}</a>
        : <span className="text-[#444] break-all">{v}</span>}
    </div>
  );
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
function downloadPDF(report: ScanReport) {
  const rows = (filter: (r: PlatformResult) => boolean, label: string) =>
    report.results.filter(filter).map(r => `
      <tr>
        <td><strong>${r.platform}</strong><br/><span style="color:#6b7280;font-size:9px">${r.category}</span></td>
        <td style="font-size:9px">${r.status.toUpperCase()}${r.source==='api'?' (API)':r.source==='proxy'?' (PROXY)':' (URL)'}</td>
        <td style="font-size:9px">${r.checkMethod}</td>
        <td><a href="${r.url}" style="color:#2563eb;font-size:8px;word-break:break-all">${r.url}</a></td>
        ${r.profileData?.name ? `<td style="font-size:9px">${r.profileData.name}${r.profileData.location?' · '+r.profileData.location:''}</td>` : '<td></td>'}
      </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>KAVACH OSINT — ${report.username}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:24px}
.hdr{border-bottom:3px solid #e8521a;padding-bottom:12px;margin-bottom:18px}.hdr h1{font-size:18px;font-weight:900;color:#e8521a;letter-spacing:2px}.hdr p{font-size:10px;color:#666;margin-top:3px}
.meta{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}.mc{border:1px solid #e5e7eb;border-radius:6px;padding:10px;text-align:center}.mc .v{font-size:18px;font-weight:900}.mc .l{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px}
.sec{font-size:10px;font-weight:700;color:#e8521a;text-transform:uppercase;letter-spacing:2px;margin:14px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:12px}th{background:#f3f4f6;padding:5px 6px;text-align:left;font-size:9px;text-transform:uppercase;color:#555;border-bottom:1px solid #e5e7eb}
td{padding:4px 6px;border-bottom:1px solid #f3f4f6;vertical-align:top}
.foot{margin-top:18px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:9px;color:#aaa;display:flex;justify-content:space-between}
@media print{body{padding:12px}}</style></head><body>
<div class="hdr"><h1>⚔ KAVACH — DIGITAL FOOTPRINT OSINT REPORT</h1>
<p>Generated: ${new Date(report.scannedAt).toLocaleString()} | Target: ${report.username||'—'} | Email: ${report.email||'—'} | Proxy: corsproxy.io</p></div>
<div class="meta">
  <div class="mc"><div class="v" style="color:#16a34a">${report.verified}</div><div class="l">API Verified</div></div>
  <div class="mc"><div class="v" style="color:#d97706">${report.found}</div><div class="l">HTTP Found</div></div>
  <div class="mc"><div class="v" style="color:#dc2626">${report.notFound}</div><div class="l">Not Found</div></div>
  <div class="mc"><div class="v" style="color:#6b7280">${report.unverified}</div><div class="l">Unverified</div></div>
  <div class="mc"><div class="v">${report.totalPlatforms}</div><div class="l">Total</div></div>
</div>
<div class="sec">✔ API-Verified Profiles (${report.verified})</div>
<table><thead><tr><th>Platform</th><th>Status</th><th>Method</th><th>URL</th><th>Intel</th></tr></thead><tbody>${rows(r=>r.status==='verified','verified')}</tbody></table>
<div class="sec">🔍 HTTP-Found via CORS Proxy (${report.found})</div>
<table><thead><tr><th>Platform</th><th>Status</th><th>Method</th><th>URL</th><th>Intel</th></tr></thead><tbody>${rows(r=>r.status==='found','found')}</tbody></table>
<div class="sec">❌ Not Found (${report.notFound})</div>
<table><thead><tr><th>Platform</th><th>Status</th><th>Method</th><th>URL</th><th>Intel</th></tr></thead><tbody>${rows(r=>r.status==='not_found','not_found')}</tbody></table>
<div class="sec">⏳ Unverified URL-Only (${report.unverified})</div>
<table><thead><tr><th>Platform</th><th>Status</th><th>Method</th><th>URL</th><th>Intel</th></tr></thead><tbody>${rows(r=>r.status==='unverified','unverified')}</tbody></table>
<div class="foot"><span>KAVACH Cyber Intelligence | Digital Footprint OSINT Module | Proxy: corsproxy.io</span><span>Variations: ${report.usernameVariations.join(', ')}</span></div>
</body></html>`;

  const w = window.open('', '_blank', 'width=960,height=700');
  if (!w) return;
  w.document.write(html); w.document.close(); w.focus();
  setTimeout(() => w.print(), 600);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const SocialSearch: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, latest: '' });
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all'|'verified'|'found'|'not_found'|'unverified'>('all');
  const [showCollapsed, setShowCollapsed] = useState<Record<string,boolean>>({ verified:true, found:true, not_found:false, unverified:false });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username && !email) { setError('Enter a username or email.'); return; }
    setLoading(true); setError(null); setReport(null);
    setProgress({ done:0, total:0, latest:'Initializing…' });
    try {
      const data = await runOSINTScan(username, email, (done, total, latest) => setProgress({ done, total, latest }));
      setReport(data);
    } catch (err: any) { setError(err.message || 'Scan failed.'); }
    finally { setLoading(false); }
  };

  const inputClass = 'w-full bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl px-10 py-3 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all font-mono text-sm';

  const cats = report ? ['All',...Array.from(new Set(report.results.map(r=>r.category)))] : ['All'];
  const filtered = report ? report.results.filter(r => (filterCat==='All'||r.category===filterCat) && (filterStatus==='all'||r.status===filterStatus)) : [];

  const groups: { key: PlatformResult['status']; label: string; color: string; icon: React.ReactNode }[] = [
    { key:'verified',   label:`API Verified`,     color:'#16a34a', icon:<CheckCircle2 className="w-3.5 h-3.5"/> },
    { key:'found',      label:`HTTP Found`,        color:'#d97706', icon:<Wifi className="w-3.5 h-3.5"/> },
    { key:'not_found',  label:`Not Found`,         color:'#dc2626', icon:<XCircle className="w-3.5 h-3.5"/> },
    { key:'unverified', label:`URL Only`,          color:'#6b7280', icon:<Clock className="w-3.5 h-3.5"/> },
  ];

  // ── Show animated doodle while scanning ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500">
        <ScanDoodle
          done={progress.done}
          total={progress.total}
          latest={progress.latest}
          username={username}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Search Form */}
      <div className="bg-white border border-[#e8e6e0] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#fff4ee] border border-[#fbd5c0] rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-[#e8521a]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111]">SOCIAL MEDIA INTELLIGENCE</h2>
            <p className="text-[#888] text-sm">Digital Footprint OSINT · API + CORS Proxy + WhatsMyName · {report ? report.totalPlatforms : '500+'} Platforms</p>
          </div>
        </div>

        {/* Tier legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {[
            { label:'Tier 1 — Public API', desc:'GitHub, GitLab, Reddit, HN, Dev.to, Keybase, Gravatar, npm', color:'#16a34a' },
            { label:'Tier 2 — CORS Proxy (status)', desc:'Instagram, Medium, Pinterest, Vimeo, SoundCloud, YouTube…', color:'#d97706' },
            { label:'Tier 3 — CORS Proxy (content)', desc:'Steam, Telegram, TikTok, Twitter/X, Facebook', color:'#f59e0b' },
            { label:'Tier 4 — URL Only', desc:'LinkedIn, Snapchat, Discord and others (auth walls)', color:'#6b7280' },
          ].map(t => (
            <div key={t.label} className="border border-[#e8e6e0] rounded-lg p-2.5 bg-[#fafaf9]">
              <div className="text-[9px] font-black uppercase tracking-wide" style={{ color: t.color }}>{t.label}</div>
              <div className="text-[9px] text-[#aaa] mt-0.5 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#555] uppercase tracking-wider">Username / Handle</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. torvalds" className={inputClass} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#555] uppercase tracking-wider">Email (for Gravatar check)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="e.g. user@example.com" className={inputClass} />
            </div>
          </div>
          <div className="md:col-span-2 pt-1">
            <button type="submit" disabled={loading}
              className="w-full bg-[#e8521a] hover:bg-[#c73f0a] disabled:bg-[#f5f5f0] disabled:text-[#bbb] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
              <><ShieldAlert className="w-4 h-4"/>INITIATE DIGITAL FOOTPRINT SCAN (500+ PLATFORMS)</>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-[#dc2626] text-sm flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 flex-shrink-0"/>{error}
          </div>
        )}
      </div>

      {/* Report */}
      {report && (
        <div className="bg-white border border-[#e8e6e0] rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-[#111] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#e8521a]"/>
              <div>
                <div className="text-white font-black text-sm tracking-widest">KAVACH DIGITAL FOOTPRINT REPORT</div>
                <div className="text-[#888] text-[10px] font-mono mt-0.5">
                  {new Date(report.scannedAt).toLocaleString()} &nbsp;|&nbsp;
                  <span className="text-[#4ade80]">{report.verified} API verified</span> &nbsp;·&nbsp;
                  <span className="text-[#fbbf24]">{report.found} HTTP found</span> &nbsp;·&nbsp;
                  <span className="text-[#f87171]">{report.notFound} not found</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setReport(null)} className="flex items-center gap-1.5 bg-[#333] hover:bg-[#444] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">
                <RefreshCw className="w-3 h-3"/>New Scan
              </button>
              <button onClick={()=>downloadPDF(report)} className="flex items-center gap-2 bg-[#e8521a] hover:bg-[#c73f0a] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow">
                <Download className="w-3.5 h-3.5"/>DOWNLOAD PDF
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 border-b border-[#e8e6e0] bg-[#fafafa]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label:'Target', value:report.username||'—', color:'#e8521a' },
                { label:'API Verified', value:report.verified, color:'#16a34a' },
                { label:'HTTP Found', value:report.found, color:'#d97706' },
                { label:'Not Found', value:report.notFound, color:'#dc2626' },
                { label:'URL Only', value:report.unverified, color:'#6b7280' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-[#e8e6e0] rounded-xl p-3 text-center">
                  <div className="font-black text-xl truncate" style={{color:s.color}}>{s.value}</div>
                  <div className="text-[9px] text-[#888] uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {report.usernameVariations.length>1 && (
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] text-[#888] font-bold uppercase">Variations:</span>
                {report.usernameVariations.map(v=>(
                  <span key={v} className="text-[9px] bg-[#f3f4f6] text-[#555] px-2 py-0.5 rounded-full font-mono border border-[#e5e7eb]">{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="mx-6 mt-4 p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg flex gap-2 text-[11px] text-[#1e40af]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5"/>
            <span>
              <strong>CORS Proxy (corsproxy.io):</strong> Platforms like Instagram, YouTube, Steam, TikTok etc. are checked via real HTTP requests through a CORS proxy.
              HTTP 200 = <span className="text-[#d97706] font-bold">HTTP FOUND</span> (visit to confirm).
              HTTP 404 = <span className="text-[#dc2626] font-bold">NOT FOUND</span>.
              Content scan used for Steam, Telegram, Twitter and Facebook where platforms return 200 even for missing users.
            </span>
          </div>

          {/* Filters */}
          <div className="px-6 pt-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {cats.map(c=>(
                <button key={c} onClick={()=>setFilterCat(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${filterCat===c?'bg-[#e8521a] text-white border-[#e8521a]':'bg-white text-[#555] border-[#e8e6e0] hover:border-[#e8521a]'}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all','verified','found','not_found','unverified'] as const).map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${filterStatus===s?'bg-[#111] text-white border-[#111]':'bg-white text-[#555] border-[#e8e6e0] hover:border-[#111]'}`}>
                  {s==='all'?'All Status':s==='not_found'?'Not Found':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped results */}
          <div className="p-6 space-y-6">
            {groups.map(g => {
              const items = filtered.filter(r => r.status === g.key);
              if (items.length === 0) return null;
              const open = showCollapsed[g.key] !== false;
              return (
                <div key={g.key}>
                  <button className="flex items-center gap-2 mb-3 w-full" onClick={()=>setShowCollapsed(p=>({...p,[g.key]:!open}))}>
                    <span style={{color:g.color}}>{g.icon}</span>
                    <span className="text-xs font-black uppercase tracking-widest" style={{color:g.color}}>
                      {g.label} ({items.length})
                    </span>
                    {open ? <ChevronUp className="w-3.5 h-3.5 ml-auto" style={{color:g.color}}/> : <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{color:g.color}}/>}
                  </button>
                  {open && (
                    <div className={`grid gap-2 ${g.key==='verified'?'grid-cols-1 lg:grid-cols-2':'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                      {items.map((r,i) => <ProfileCard key={i} r={r}/>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 border-t border-[#e8e6e0] pt-4 flex flex-wrap justify-between items-center gap-2">
            <div className="text-[10px] text-[#aaa] font-mono">
              KAVACH · Digital Footprint OSINT · CORS Proxy: corsproxy.io
            </div>
            <button onClick={()=>downloadPDF(report)} className="flex items-center gap-2 bg-[#111] hover:bg-[#222] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">
              <Download className="w-3.5 h-3.5"/>EXPORT PDF
            </button>
          </div>
        </div>
      )}

      {/* ── Email Intelligence Section ──────────────────────────────── */}
      {report?.emailResults && report.emailResults.length > 0 && (
        <div className="bg-white border border-[#e8e6e0] rounded-xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a0533] to-[#2d0a1f] px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#a78bfa]" />
              <div>
                <div className="text-white font-black text-sm tracking-widest">📧 EMAIL INTELLIGENCE</div>
                <div className="text-[#888] text-[10px] font-mono mt-0.5">
                  <span className="text-[#a78bfa]">GHunt-inspired</span> · <span className="text-[#f472b6]">Holehe-inspired</span> · {report.email}
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-[10px] font-bold flex-wrap">
              {(['found','not_found','unverified'] as const).map(s => {
                const count = report.emailResults!.filter(r=>r.status===s).length;
                const colors: Record<string,string> = { found:'#4ade80', not_found:'#f87171', unverified:'#94a3b8' };
                return <span key={s} style={{color:colors[s]}}>{count} {s.replace('_',' ')}</span>;
              })}
            </div>
          </div>

          {/* Tool legend */}
          <div className="px-6 pt-4 flex flex-wrap gap-2">
            {[
              { label:'🔍 GHunt-inspired', desc:'Google account intelligence: Gravatar, Keybase, GitHub commits, PGP key, EmailRep.io', color:'#7c3aed' },
              { label:'🕵️ Holehe-inspired', desc:'Registration detection: Spotify, Duolingo, Twitter, Netflix, Pinterest, Dropbox, Snapchat…', color:'#db2777' },
            ].map(t => (
              <div key={t.label} className="border rounded-lg px-3 py-2 bg-[#fafaf9] flex-1 min-w-[200px]" style={{borderColor:t.color+'33'}}>
                <div className="text-[9px] font-black uppercase tracking-wide" style={{color:t.color}}>{t.label}</div>
                <div className="text-[9px] text-[#aaa] mt-0.5">{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Results grouped by category */}
          <div className="p-6 space-y-5">
            {(['Google Intelligence','Identity Intelligence','Developer Intelligence','Breach Intelligence','Registration Detection'] as const).map(cat => {
              const items = report.emailResults!.filter(r => r.category === cat);
              if (items.length === 0) return null;
              const catColors: Record<string,{c:string;bg:string}> = {
                'Google Intelligence':    {c:'#7c3aed', bg:'#f3f0ff'},
                'Identity Intelligence':  {c:'#0891b2', bg:'#ecfeff'},
                'Developer Intelligence': {c:'#16a34a', bg:'#f0fdf4'},
                'Breach Intelligence':    {c:'#dc2626', bg:'#fef2f2'},
                'Registration Detection': {c:'#db2777', bg:'#fdf2f8'},
              };
              const col = catColors[cat] ?? {c:'#888',bg:'#f9fafb'};
              return (
                <div key={cat}>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3 pb-1 border-b" style={{color:col.c, borderColor:col.c+'33'}}>{cat}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((r, i) => (
                      <div key={i} className="rounded-xl border p-3 transition-all" style={{
                        borderColor: r.status==='found' ? col.c+'66' : '#e5e7eb',
                        background:  r.status==='found' ? col.bg : r.status==='not_found' ? '#fafafa' : '#f9fafb',
                        opacity:     r.status==='not_found' ? 0.55 : 1,
                      }}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-[#111] text-sm">{r.platform}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase flex-shrink-0 ${
                            r.status==='found'     ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' :
                            r.status==='not_found' ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]' :
                                                     'bg-[#f3f4f6] text-[#9ca3af] border border-[#e5e7eb]'
                          }`}>{r.status.replace('_',' ')}</span>
                        </div>
                        {r.url && r.status==='found' && (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#2563eb] hover:underline font-mono truncate block mt-0.5">{r.url}</a>
                        )}
                        {r.data && r.status==='found' && (
                          <div className="mt-1.5 space-y-0.5">
                            {r.data.name && <div className="text-[10px] font-semibold text-[#333]">{r.data.name}</div>}
                            {r.data.bio && <div className="text-[9px] text-[#666] italic truncate">{String(r.data.bio).slice(0,80)}</div>}
                            {r.data.reputation && <div className="text-[9px] text-[#555]">Reputation: <b>{r.data.reputation}</b>{r.data.suspicious?' ⚠️ suspicious':''}</div>}
                            {r.data.credentials_leaked && <div className="text-[9px] text-[#dc2626] font-bold">⚠ Credentials leaked in breach</div>}
                            {r.data.commitCount && <div className="text-[9px] text-[#333]">📦 {r.data.commitCount} commits found</div>}
                            {r.data.repos && r.data.repos.length>0 && <div className="text-[9px] text-[#555] truncate">Repos: {(r.data.repos as string[]).slice(0,3).join(', ')}</div>}
                            {r.data.username && <div className="text-[9px] text-[#555]">@{r.data.username}</div>}
                            {r.data.linkedAccounts && r.data.linkedAccounts.length>0 && <div className="text-[9px] text-[#555]">Linked: {(r.data.linkedAccounts as string[]).join(', ')}</div>}
                          </div>
                        )}
                        <div className="text-[7px] text-[#ccc] mt-1 font-mono">{r.tool.toUpperCase()} · {r.checkMethod}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title:'API Verification', text:'8 platforms verified via public REST APIs with real profile data returned: GitHub, GitLab, Reddit, HackerNews, Dev.to, Keybase, Gravatar, npm.', icon:Shield },
          { title:'WMN + CORS Proxy', text:'500+ platforms checked via WhatsMyName DB and corsproxy.io — real HTTP requests and content probing for accurate found/not-found results.', icon:Wifi },
          { title:'Email Intelligence', text:'GHunt-inspired Google OSINT + Holehe-inspired registration detection across 18 platforms when you provide an email address.', icon:Zap },
        ].map(c=>(
          <div key={c.title} className="bg-white border border-[#e8e6e0] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className="w-3.5 h-3.5 text-[#e8521a]"/>
              <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider">{c.title}</h4>
            </div>
            <p className="text-[10px] text-[#aaa] leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

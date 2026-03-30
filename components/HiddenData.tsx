import React, { useState, useRef, useCallback } from 'react';
import {
  FileSearch, Upload, Globe, AlertTriangle, Info, Download,
  MapPin, User, Calendar, Cpu, Mail, Link2, Server, Shield,
  ChevronDown, ChevronUp, Loader2, X, FileText, Image,
  Hash, Eye, Trash2, Plus, CheckCircle2, XCircle, AlertCircle,
  Layers, Clock, Tag
} from 'lucide-react';
import { analyzeFile, analyzeURL, HiddenDataReport, RiskFlag } from '../services/hiddenDataService';

// ─── Colour helpers ───────────────────────────────────────────────────────────
const RISK_COLORS: Record<RiskFlag['severity'], { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  high:     { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  medium:   { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', icon: <Info className="w-3.5 h-3.5" /> },
  low:      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  PDF:  { bg: '#fef2f2', text: '#dc2626' },
  DOCX: { bg: '#eff6ff', text: '#2563eb' },
  DOC:  { bg: '#eff6ff', text: '#2563eb' },
  XLSX: { bg: '#f0fdf4', text: '#16a34a' },
  PPTX: { bg: '#fff7ed', text: '#ea580c' },
  JPEG: { bg: '#fdf4ff', text: '#9333ea' },
  PNG:  { bg: '#fdf4ff', text: '#9333ea' },
  TIFF: { bg: '#fdf4ff', text: '#9333ea' },
};

function typeColor(t: string) {
  return FILE_TYPE_COLORS[t] || { bg: '#f3f4f6', text: '#6b7280' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ flag }: { flag: RiskFlag }) {
  const c = RISK_COLORS[flag.severity];
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border" style={{ background: c.bg, borderColor: c.border }}>
      <span style={{ color: c.text }} className="flex-shrink-0 mt-0.5">{c.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: c.text, color: '#fff' }}>
            {flag.severity}
          </span>
          <span className="text-[10px] font-bold" style={{ color: c.text }}>{flag.field}</span>
        </div>
        <p className="text-[10px] text-[#555] mt-0.5">{flag.description}</p>
        <code className="text-[9px] text-[#888] bg-white/70 px-1 py-0.5 rounded border border-white/50 mt-0.5 block font-mono truncate max-w-full">
          {flag.value}
        </code>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, icon }: { label: string; value: string | number; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-[#f3f3f0] last:border-0">
      {icon && <span className="text-[#e8521a] flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">{label}</div>
        <div className={`text-[11px] text-[#222] mt-0.5 break-all ${mono ? 'font-mono' : 'font-semibold'}`}>{value}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-[#e8e6e0] rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafaf9] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#e8521a]">{icon}</span>
          <span className="text-xs font-black uppercase tracking-widest text-[#333]">{title}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#bbb]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#bbb]" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function TagList({ items, color = '#e8521a' }: { items: string[]; color?: string }) {
  const [show, setShow] = useState(false);
  const visible = show ? items : items.slice(0, 5);
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {visible.map((item, i) => (
        <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={{ background: color + '15', color, borderColor: color + '40' }}>
          {item}
        </span>
      ))}
      {items.length > 5 && (
        <button onClick={() => setShow(s => !s)} className="text-[9px] text-[#888] hover:text-[#e8521a] underline transition-colors">
          {show ? 'Show less' : `+${items.length - 5} more`}
        </button>
      )}
    </div>
  );
}

// ─── Report card ─────────────────────────────────────────────────────────────
function ReportCard({ report, onRemove }: { report: HiddenDataReport; onRemove: () => void }) {
  const { meta } = report;
  const tc = typeColor(meta.fileType);
  const critCount = (meta.riskFlags || []).filter(f => f.severity === 'critical').length;
  const highCount = (meta.riskFlags || []).filter(f => f.severity === 'high').length;
  const [expanded, setExpanded] = useState(true);

  const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

  return (
    <div className="bg-white border border-[#e8e6e0] rounded-2xl shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="bg-[#111] px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: tc.bg, border: `1px solid ${tc.text}30` }}>
            <FileSearch className="w-5 h-5" style={{ color: tc.text }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-black text-sm truncate max-w-[200px]" title={meta.fileName}>
                {meta.fileName}
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.text }}>
                {meta.fileType}
              </span>
            </div>
            <div className="text-[#888] text-[10px] font-mono mt-0.5">
              {formatBytes(meta.fileSize)} · {new Date(report.extractedAt).toLocaleTimeString()}
              {report.source === 'url' && <span className="ml-1">· URL</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {critCount > 0 && (
            <span className="text-[9px] font-black bg-[#dc2626] text-white px-2 py-0.5 rounded-full">
              {critCount} CRITICAL
            </span>
          )}
          {highCount > 0 && (
            <span className="text-[9px] font-black bg-[#ea580c] text-white px-2 py-0.5 rounded-full">
              {highCount} HIGH
            </span>
          )}
          <button onClick={() => setExpanded(e => !e)} className="text-[#888] hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onRemove} className="text-[#888] hover:text-[#f87171] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary stats bar */}
      <div className="grid grid-cols-4 divide-x divide-[#f3f3f0] bg-[#fafaf9] border-b border-[#e8e6e0]">
        {[
          { label: 'Risk Flags', value: (meta.riskFlags || []).length, color: critCount > 0 ? '#dc2626' : highCount > 0 ? '#ea580c' : '#16a34a' },
          { label: 'Emails', value: (meta.embeddedEmails || []).length, color: '#2563eb' },
          { label: 'Paths', value: (meta.embeddedPaths || []).length, color: '#9333ea' },
          { label: 'IPs', value: (meta.embeddedIPs || []).length, color: '#0891b2' },
        ].map(s => (
          <div key={s.label} className="py-2 px-3 text-center">
            <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-[#aaa] uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-3">

          {/* Risk Flags */}
          {(meta.riskFlags || []).length > 0 && (
            <Section title={`Risk Intelligence  (${meta.riskFlags!.length})`} icon={<Shield className="w-4 h-4" />} defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {meta.riskFlags!.map((f, i) => <RiskBadge key={i} flag={f} />)}
              </div>
            </Section>
          )}

          {/* Identity fields */}
          {(meta.author || meta.lastModifiedBy || meta.creator || meta.title || meta.subject) && (
            <Section title="Document Identity" icon={<User className="w-4 h-4" />}>
              {meta.author && <MetaRow label="Author / Creator" value={meta.author} icon={<User className="w-3 h-3" />} />}
              {meta.lastModifiedBy && meta.lastModifiedBy !== meta.author && (
                <MetaRow label="Last Modified By" value={meta.lastModifiedBy} icon={<User className="w-3 h-3" />} />
              )}
              {meta.title && <MetaRow label="Title" value={meta.title} icon={<FileText className="w-3 h-3" />} />}
              {meta.subject && <MetaRow label="Subject" value={meta.subject} icon={<Tag className="w-3 h-3" />} />}
              {meta.description && <MetaRow label="Description" value={meta.description} />}
              {meta.category && <MetaRow label="Category" value={meta.category} />}
              {meta.language && <MetaRow label="Language" value={meta.language} />}
              {meta.revisionNumber && <MetaRow label="Revision #" value={meta.revisionNumber} />}
              {(meta.keywords || []).length > 0 && (
                <div className="py-2 border-b border-[#f3f3f0] last:border-0">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider mb-1">Keywords</div>
                  <TagList items={meta.keywords!} color="#e8521a" />
                </div>
              )}
            </Section>
          )}

          {/* Timestamps */}
          {(meta.createdAt || meta.modifiedAt || meta.lastPrinted || meta.totalEditingTime) && (
            <Section title="Timeline" icon={<Calendar className="w-4 h-4" />}>
              {meta.createdAt && <MetaRow label="Created At" value={meta.createdAt} icon={<Calendar className="w-3 h-3" />} mono />}
              {meta.modifiedAt && <MetaRow label="Modified At" value={meta.modifiedAt} icon={<Clock className="w-3 h-3" />} mono />}
              {meta.lastPrinted && <MetaRow label="Last Printed" value={meta.lastPrinted} mono />}
              {meta.totalEditingTime && <MetaRow label="Total Editing Time" value={`${meta.totalEditingTime} min`} />}
            </Section>
          )}

          {/* Software / OS */}
          {(meta.softwareGenerator || meta.applicationVersion || meta.osHint || meta.producer || meta.creator) && (
            <Section title="Software Fingerprint" icon={<Cpu className="w-4 h-4" />}>
              {meta.softwareGenerator && <MetaRow label="Generator / Creator Tool" value={meta.softwareGenerator} icon={<Cpu className="w-3 h-3" />} />}
              {meta.applicationVersion && <MetaRow label="Version" value={meta.applicationVersion} mono />}
              {meta.producer && <MetaRow label="PDF Producer" value={meta.producer} />}
              {meta.osHint && <MetaRow label="OS Hint" value={meta.osHint} />}
            </Section>
          )}

          {/* Stats */}
          {(meta.pageCount || meta.wordCount || meta.charCount || meta.slideCount) && (
            <Section title="Document Stats" icon={<Hash className="w-4 h-4" />} defaultOpen={false}>
              {meta.pageCount !== undefined && <MetaRow label="Pages / Slides" value={meta.pageCount} />}
              {meta.slideCount !== undefined && <MetaRow label="Slides" value={meta.slideCount} />}
              {meta.wordCount !== undefined && <MetaRow label="Word Count" value={meta.wordCount.toLocaleString()} />}
              {meta.charCount !== undefined && <MetaRow label="Character Count" value={meta.charCount.toLocaleString()} />}
              {meta.paragraphCount !== undefined && <MetaRow label="Paragraphs" value={meta.paragraphCount} />}
              {meta.lineCount !== undefined && <MetaRow label="Lines" value={meta.lineCount} />}
            </Section>
          )}

          {/* GPS & Camera EXIF */}
          {(meta.gpsLat !== undefined || meta.cameraModel || meta.imageWidth) && (
            <Section title="EXIF / Camera Data" icon={<Image className="w-4 h-4" />}>
              {meta.gpsLat !== undefined && meta.gpsLng !== undefined && (
                <div className="py-2 border-b border-[#f3f3f0]">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider mb-1">GPS Coordinates</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#dc2626]">
                      {meta.gpsLat.toFixed(6)}, {meta.gpsLng.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${meta.gpsLat},${meta.gpsLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] px-2 py-0.5 rounded-full hover:bg-[#2563eb] hover:text-white transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5" /> View on Maps
                    </a>
                  </div>
                  {meta.gpsAlt !== undefined && (
                    <div className="text-[10px] text-[#888] mt-0.5">Altitude: {meta.gpsAlt.toFixed(1)}m</div>
                  )}
                </div>
              )}
              {meta.cameraMake && <MetaRow label="Camera Make" value={meta.cameraMake} />}
              {meta.cameraModel && <MetaRow label="Camera Model" value={meta.cameraModel} />}
              {meta.imageWidth && meta.imageHeight && <MetaRow label="Dimensions" value={`${meta.imageWidth} × ${meta.imageHeight} px`} />}
              {meta.exposureTime && <MetaRow label="Exposure Time" value={meta.exposureTime} mono />}
              {meta.fNumber && <MetaRow label="Aperture" value={meta.fNumber} mono />}
              {meta.isoSpeed && <MetaRow label="ISO Speed" value={meta.isoSpeed} />}
              {meta.focalLength && <MetaRow label="Focal Length" value={meta.focalLength} />}
              {meta.flashUsed && <MetaRow label="Flash" value={meta.flashUsed} />}
              {meta.colorSpace && <MetaRow label="Color Space" value={meta.colorSpace} />}
              {meta.createdAt && <MetaRow label="Capture Time" value={meta.createdAt} mono />}
            </Section>
          )}

          {/* Network Intel */}
          {((meta.embeddedEmails?.length ||
            meta.embeddedUrls?.length ||
            meta.embeddedIPs?.length ||
            meta.embeddedPaths?.length ||
            meta.internalServers?.length) ?? 0) > 0 && (
            <Section title="Embedded Network Intelligence" icon={<Server className="w-4 h-4" />} defaultOpen={false}>
              {(meta.internalServers || []).length > 0 && (
                <div className="py-2 border-b border-[#f3f3f0]">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">Internal Servers</div>
                  <TagList items={meta.internalServers!} color="#dc2626" />
                </div>
              )}
              {(meta.embeddedEmails || []).length > 0 && (
                <div className="py-2 border-b border-[#f3f3f0]">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">Email Addresses ({meta.embeddedEmails!.length})</div>
                  <TagList items={meta.embeddedEmails!} color="#2563eb" />
                </div>
              )}
              {(meta.embeddedIPs || []).length > 0 && (
                <div className="py-2 border-b border-[#f3f3f0]">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">IP Addresses ({meta.embeddedIPs!.length})</div>
                  <TagList items={meta.embeddedIPs!} color="#0891b2" />
                </div>
              )}
              {(meta.embeddedUrls || []).length > 0 && (
                <div className="py-2 border-b border-[#f3f3f0]">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">Embedded URLs ({meta.embeddedUrls!.length})</div>
                  <TagList items={meta.embeddedUrls!} color="#16a34a" />
                </div>
              )}
              {(meta.embeddedPaths || []).length > 0 && (
                <div className="py-2">
                  <div className="text-[9px] text-[#aaa] uppercase font-bold tracking-wider">File System Paths ({meta.embeddedPaths!.length})</div>
                  <TagList items={meta.embeddedPaths!} color="#9333ea" />
                </div>
              )}
            </Section>
          )}

          {/* Raw chunks */}
          {(meta.rawChunks || []).length > 0 && (
            <Section title="Raw Metadata Chunks" icon={<Eye className="w-4 h-4" />} defaultOpen={false}>
              <div className="mt-2 space-y-1">
                {meta.rawChunks!.map((c, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono bg-[#f9f9f7] border border-[#e8e6e0] rounded p-2">
                    <span className="text-[#888] flex-shrink-0">{c.label}:</span>
                    <span className="text-[#444] break-all">{c.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Export */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => exportReport(report)}
              className="flex items-center gap-2 bg-[#111] hover:bg-[#222] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PDF / HTML export ────────────────────────────────────────────────────────

function exportReport(report: HiddenDataReport) {
  const { meta } = report;
  const flags = (meta.riskFlags || []);
  const riskRows = flags.map(f => `
    <tr>
      <td><span class="badge badge-${f.severity}">${f.severity.toUpperCase()}</span></td>
      <td><strong>${escHtml(f.field)}</strong></td>
      <td>${escHtml(f.description)}</td>
      <td class="mono">${escHtml(f.value)}</td>
    </tr>`).join('');

  const metaRows = [
    ['File Name', meta.fileName],
    ['File Type', meta.fileType],
    ['File Size', `${(meta.fileSize / 1024).toFixed(1)} KB`],
    ['Author', meta.author],
    ['Last Modified By', meta.lastModifiedBy],
    ['Title', meta.title],
    ['Subject', meta.subject],
    ['Software', meta.softwareGenerator],
    ['Producer', meta.producer],
    ['Created At', meta.createdAt],
    ['Modified At', meta.modifiedAt],
    ['GPS', meta.gpsLat !== undefined ? `${meta.gpsLat?.toFixed(6)}, ${meta.gpsLng?.toFixed(6)}` : undefined],
    ['Camera', meta.cameraModel ? `${meta.cameraMake || ''} ${meta.cameraModel}` : undefined],
    ['OS Hint', meta.osHint],
    ['Language', meta.language],
    ['Revision', meta.revisionNumber],
  ].filter(([, v]) => v).map(([l, v]) => `<tr><td><strong>${l}</strong></td><td class="mono">${escHtml(String(v))}</td></tr>`).join('');

  const emailRows = (meta.embeddedEmails || []).map(e => `<li class="mono">${escHtml(e)}</li>`).join('');
  const ipRows = (meta.embeddedIPs || []).map(e => `<li class="mono">${escHtml(e)}</li>`).join('');
  const pathRows = (meta.embeddedPaths || []).map(e => `<li class="mono">${escHtml(e)}</li>`).join('');
  const urlRows = (meta.embeddedUrls || []).map(e => `<li><a href="${escHtml(e)}">${escHtml(e)}</a></li>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>KAVACH HIDDEN DATA — ${escHtml(meta.fileName)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;padding:24px;font-size:11px}
.hdr{border-bottom:3px solid #e8521a;padding-bottom:12px;margin-bottom:16px}
.hdr h1{font-size:16px;font-weight:900;color:#e8521a;letter-spacing:2px}
.hdr p{font-size:9px;color:#666;margin-top:3px}
h2{font-size:10px;font-weight:700;color:#e8521a;text-transform:uppercase;letter-spacing:2px;margin:14px 0 6px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th{background:#f3f4f6;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase;color:#555;border-bottom:1px solid #e5e7eb}
td{padding:3px 6px;border-bottom:1px solid #f3f4f6;vertical-align:top}
.mono{font-family:monospace;font-size:9px;word-break:break-all}
.badge{display:inline-block;padding:1px 5px;border-radius:99px;font-size:8px;font-weight:900;color:#fff}
.badge-critical{background:#dc2626}.badge-high{background:#ea580c}.badge-medium{background:#ca8a04}.badge-low{background:#16a34a}
ul{padding-left:16px;margin:4px 0}li{font-size:9px;margin:1px 0}
.foot{margin-top:16px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:8px;color:#aaa;display:flex;justify-content:space-between}
@media print{body{padding:12px}}
</style></head><body>
<div class="hdr">
  <h1>⚔ KAVACH — HIDDEN DATA INTELLIGENCE REPORT</h1>
  <p>Generated: ${new Date(report.extractedAt).toLocaleString()} | File: ${escHtml(meta.fileName)} | Source: ${escHtml(report.sourceLabel)}</p>
</div>
<h2>Risk Intelligence (${flags.length} flags)</h2>
<table><thead><tr><th>Severity</th><th>Field</th><th>Description</th><th>Value</th></tr></thead><tbody>${riskRows}</tbody></table>
<h2>Document Metadata</h2>
<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${metaRows}</tbody></table>
${emailRows ? `<h2>Embedded Emails</h2><ul>${emailRows}</ul>` : ''}
${ipRows ? `<h2>Embedded IPs</h2><ul>${ipRows}</ul>` : ''}
${pathRows ? `<h2>File System Paths</h2><ul>${pathRows}</ul>` : ''}
${urlRows ? `<h2>Embedded URLs</h2><ul>${urlRows}</ul>` : ''}
<div class="foot"><span>KAVACH Cyber Intelligence | Hidden Data Module (FOCA-style)</span><span>kavach.local</span></div>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const HiddenData: React.FC = () => {
  const [reports, setReports] = useState<HiddenDataReport[]>([]);
  const [loading, setLoading] = useState<{ id: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [activeMode, setActiveMode] = useState<'upload' | 'url'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const arr = Array.from(files);
    for (const file of arr) {
      const lid = Math.random().toString(36).slice(2);
      setLoading({ id: lid, label: file.name });
      try {
        const report = await analyzeFile(file);
        setReports(r => [report, ...r]);
      } catch (e: any) {
        setError(`Failed to analyze ${file.name}: ${e.message}`);
      }
    }
    setLoading(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleUrlAnalyze = async () => {
    let raw = urlInput.trim();
    if (!raw) { setError('Enter a document URL to analyze.'); return; }
    // Auto-prepend https:// if missing
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) raw = 'https://' + raw;
    setError(null);
    const lid = Math.random().toString(36).slice(2);
    setLoading({ id: lid, label: raw });
    try {
      const report = await analyzeURL(raw);
      setReports(r => [report, ...r]);
      setUrlInput('');
    } catch (e: any) {
      const msg = e.message || 'Network error';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Could not fetch the document. Make sure the URL points directly to a file (PDF, DOCX, JPEG, etc.) and is publicly accessible. CORS proxy: corsproxy.io');
      } else {
        setError(`Analysis failed: ${msg}`);
      }
    }
    setLoading(null);
  };

  const SUPPORTED_TYPES = [
    { ext: 'PDF', color: '#dc2626', desc: 'XMP + Info dict' },
    { ext: 'DOCX', color: '#2563eb', desc: 'core.xml, app.xml' },
    { ext: 'XLSX', color: '#16a34a', desc: 'core.xml, app.xml' },
    { ext: 'PPTX', color: '#ea580c', desc: 'core.xml, app.xml' },
    { ext: 'ODT', color: '#7c3aed', desc: 'ODF metadata' },
    { ext: 'JPEG', color: '#9333ea', desc: 'EXIF + GPS' },
    { ext: 'PNG', color: '#0891b2', desc: 'tEXt chunks' },
    { ext: 'TIFF', color: '#d97706', desc: 'IFD + GPS EXIF' },
    { ext: 'ANY', color: '#6b7280', desc: 'Generic scanning' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Hero header */}
      <div className="bg-white border border-[#e8e6e0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#fff4ee] to-[#fbd5c0] border border-[#fbd5c0] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileSearch className="w-7 h-7 text-[#e8521a]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111] tracking-tight">HIDDEN DATA INTELLIGENCE</h2>
            <p className="text-[#888] text-sm mt-0.5">
              FOCA-style metadata extractor · Uncover hidden author names, GPS coordinates, software fingerprints, embedded paths &amp; network intelligence
            </p>
          </div>
        </div>

        {/* Supported types */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {SUPPORTED_TYPES.map(t => (
            <span key={t.ext} className="text-[9px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1"
              style={{ background: t.color + '15', color: t.color, borderColor: t.color + '40' }}>
              <Layers className="w-2.5 h-2.5" /> {t.ext}
              <span className="text-[8px] font-normal opacity-70">· {t.desc}</span>
            </span>
          ))}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'upload' as const, label: 'Upload File', icon: <Upload className="w-3.5 h-3.5" /> },
            { id: 'url' as const, label: 'Analyze URL', icon: <Globe className="w-3.5 h-3.5" /> },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeMode === m.id
                  ? 'bg-[#e8521a] text-white border-[#e8521a] shadow-sm'
                  : 'bg-[#f5f5f0] text-[#555] border-[#e8e6e0] hover:border-[#e8521a] hover:text-[#e8521a]'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Upload drop zone */}
        {activeMode === 'upload' && (
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              dragging
                ? 'border-[#e8521a] bg-[#fff4ee] scale-[1.01]'
                : 'border-[#e8e6e0] bg-[#fafaf9] hover:border-[#e8521a] hover:bg-[#fff4ee]'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.odt,.ods,.odp,.jpg,.jpeg,.png,.tif,.tiff,.gif,.svg,.zip,.rar"
              className="hidden"
              onChange={e => e.target.files && processFiles(e.target.files)}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-[#e8521a] animate-spin" />
                <p className="text-sm font-semibold text-[#e8521a]">Extracting metadata from {loading.label}…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-white border-2 border-dashed border-[#fbd5c0] rounded-2xl flex items-center justify-center shadow-sm">
                  <Upload className="w-8 h-8 text-[#e8521a]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#333]">Drop files here or click to browse</p>
                  <p className="text-[11px] text-[#aaa] mt-1">PDF, DOCX, XLSX, PPTX, ODT, JPEG, PNG, TIFF — multiple files supported</p>
                </div>
                <span className="text-[10px] bg-[#e8521a] text-white px-4 py-1.5 rounded-full font-bold shadow-sm">
                  + ADD FILES
                </span>
              </div>
            )}
          </div>
        )}

        {/* URL mode */}
        {activeMode === 'url' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlAnalyze()}
                  placeholder="https://example.com/report.pdf"
                  className="w-full bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl pl-10 pr-4 py-3 text-[#111] placeholder-[#bbb] focus:border-[#e8521a] focus:outline-none focus:bg-white transition-all font-mono text-sm"
                />
              </div>
              <button
                onClick={handleUrlAnalyze}
                disabled={!!loading}
                className="bg-[#e8521a] hover:bg-[#c73f0a] disabled:bg-[#f5f5f0] disabled:text-[#bbb] text-white font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching…</>
                  : <><FileSearch className="w-4 h-4" /> ANALYZE</>
                }
              </button>
            </div>
            {/* Help examples */}
            <div className="p-3 bg-[#f5f5f0] border border-[#e8e6e0] rounded-xl">
              <p className="text-[9px] text-[#888] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" /> URL must point directly to a document file — examples:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'https://www.w3.org/WAI/WCAG21/wcag21.pdf',
                  'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
                ].map(ex => (
                  <button key={ex} onClick={() => setUrlInput(ex)}
                    className="text-[8px] font-mono text-[#2563eb] hover:text-[#e8521a] bg-white border border-[#e8e6e0] px-2 py-1 rounded truncate max-w-[280px] transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[#aaa] mt-1.5">Fetched via corsproxy.io · https:// auto-prepended if missing · Direct file links only</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center gap-2 text-sm text-[#dc2626]">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <User className="w-4 h-4 text-[#e8521a]" />,
            title: 'Identity Leaks',
            text: 'Extracts author names, last-modified-by fields and username hints from embedded file paths — even if stripped from the visible document.',
          },
          {
            icon: <MapPin className="w-4 h-4 text-[#dc2626]" />,
            title: 'GPS & EXIF Data',
            text: 'JPEG/TIFF images can embed exact GPS coordinates, camera model, exposure settings and timestamp. Click "View on Maps" to see the location.',
          },
          {
            icon: <Server className="w-4 h-4 text-[#9333ea]" />,
            title: 'Network Intelligence',
            text: 'Scans document content for internal server names, IP addresses, email addresses and UNC paths that reveal internal infrastructure.',
          },
        ].map(c => (
          <div key={c.title} className="bg-white border border-[#e8e6e0] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              {c.icon}
              <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider">{c.title}</h4>
            </div>
            <p className="text-[10px] text-[#aaa] leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Reports */}
      {reports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#e8521a]" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#333]">
                Analysis Results ({reports.length})
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveMode('upload')}
                className="flex items-center gap-1.5 text-xs bg-[#f5f5f0] hover:bg-[#fff4ee] border border-[#e8e6e0] hover:border-[#fbd5c0] text-[#555] hover:text-[#e8521a] px-3 py-1.5 rounded-lg transition-all font-semibold"
              >
                <Plus className="w-3 h-3" /> Add More
              </button>
              <button
                onClick={() => setReports([])}
                className="flex items-center gap-1.5 text-xs bg-[#fef2f2] hover:bg-[#fee2e2] border border-[#fecaca] text-[#dc2626] px-3 py-1.5 rounded-lg transition-all font-semibold"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            </div>
          </div>

          {reports.map(r => (
            <ReportCard
              key={r.id}
              report={r}
              onRemove={() => setReports(prev => prev.filter(x => x.id !== r.id))}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {reports.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[#e8e6e0] rounded-2xl bg-white text-center">
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-2xl flex items-center justify-center mb-4">
            <FileSearch className="w-8 h-8 text-[#ccc]" />
          </div>
          <h3 className="text-sm font-bold text-[#888] mb-1">No files analyzed yet</h3>
          <p className="text-[11px] text-[#bbb]">Upload files or enter a document URL to begin extraction</p>
        </div>
      )}
    </div>
  );
};

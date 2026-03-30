import React, { useEffect, useState, useRef } from 'react';

const MESSAGES = [
  'Sweeping the open web…',
  'Scanning social media platforms…',
  'Checking developer communities…',
  'Cross-referencing forum profiles…',
  'Probing gaming networks…',
  'Searching creative portfolios…',
  'Verifying professional networks…',
  'Querying OSINT databases…',
  'Checking video platforms…',
  'Scanning messaging apps…',
  'Probing music & audio platforms…',
  'Looking through dating sites…',
  'Investigating niche communities…',
  'Cross-referencing identity services…',
  'Sweeping international networks…',
  'Indexing discovered footprints…',
  'Analyzing CORS proxy responses…',
  'Validating HTTP signatures…',
  'Running WhatsMyName database…',
  'Building your digital footprint map…',
];

interface Props {
  done: number;
  total: number;
  latest: string;
  username: string;
}

export const ScanDoodle: React.FC<Props> = ({ done, total, latest, username }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const elapsedStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '520px',
      padding: '40px 24px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #fff9f7 0%, #fff4ee 50%, #fef3e8 100%)',
      borderRadius: '20px',
      border: '1px solid #fbd5c0',
    }}>
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.4); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes orbit-1 {
          from { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        @keyframes orbit-2 {
          from { transform: rotate(120deg) translateX(120px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(120px) rotate(-480deg); }
        }
        @keyframes orbit-3 {
          from { transform: rotate(240deg) translateX(70px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(70px) rotate(-600deg); }
        }
        @keyframes orbit-4 {
          from { transform: rotate(60deg) translateX(145px) rotate(-60deg); }
          to   { transform: rotate(420deg) translateX(145px) rotate(-420deg); }
        }
        @keyframes orbit-5 {
          from { transform: rotate(180deg) translateX(105px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(105px) rotate(-540deg); }
        }
        @keyframes orbit-6 {
          from { transform: rotate(300deg) translateX(130px) rotate(-300deg); }
          to   { transform: rotate(660deg) translateX(130px) rotate(-660deg); }
        }
        @keyframes float-up {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes msg-fade {
          0%   { opacity: 0; transform: translateY(6px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,82,26,0.3); }
          50%       { box-shadow: 0 0 0 16px rgba(232,82,26,0); }
        }
        .doodle-node { animation: float-up 3s ease-in-out infinite; }
        .doodle-node:nth-child(2) { animation-delay: -0.6s; }
        .doodle-node:nth-child(3) { animation-delay: -1.2s; }
        .doodle-node:nth-child(4) { animation-delay: -1.8s; }
        .doodle-node:nth-child(5) { animation-delay: -2.4s; }
        .doodle-node:nth-child(6) { animation-delay: -0.3s; }
      `}</style>

      {/* ── Globe + radar ───────────────────────────── */}
      <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 32, flexShrink: 0 }}>

        {/* Pulse rings */}
        {[0, 0.8, 1.6].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute', inset: '50%',
            width: 80, height: 80,
            marginLeft: -40, marginTop: -40,
            borderRadius: '50%',
            border: '2px solid rgba(232,82,26,0.4)',
            animation: `pulse-ring 2.4s ${delay}s ease-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Globe SVG */}
        <svg viewBox="0 0 200 200" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          animation: 'float-up 4s ease-in-out infinite',
        }}>
          {/* Background circle */}
          <circle cx="100" cy="100" r="58" fill="#fff4ee" stroke="#e8521a" strokeWidth="2.5"/>
          {/* Latitude lines */}
          <ellipse cx="100" cy="100" rx="58" ry="20" fill="none" stroke="#e8521a" strokeWidth="1" opacity="0.3"/>
          <ellipse cx="100" cy="100" rx="58" ry="38" fill="none" stroke="#e8521a" strokeWidth="1" opacity="0.2"/>
          {/* Longitude lines */}
          <ellipse cx="100" cy="100" rx="22" ry="58" fill="none" stroke="#e8521a" strokeWidth="1" opacity="0.3"/>
          <ellipse cx="100" cy="100" rx="44" ry="58" fill="none" stroke="#e8521a" strokeWidth="1" opacity="0.2"/>
          {/* Vertical & horizontal cross */}
          <line x1="42" y1="100" x2="158" y2="100" stroke="#e8521a" strokeWidth="1" opacity="0.25"/>
          <line x1="100" y1="42" x2="100" y2="158" stroke="#e8521a" strokeWidth="1" opacity="0.25"/>
          {/* Globe outline */}
          <circle cx="100" cy="100" r="58" fill="none" stroke="#e8521a" strokeWidth="2.5"/>
        </svg>

        {/* Radar sweep arm */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 58, height: 2,
          transformOrigin: '0 50%',
          animation: 'radar-sweep 3s linear infinite',
          background: 'linear-gradient(90deg, rgba(232,82,26,0.9), transparent)',
          borderRadius: 2,
        }}/>

        {/* Center dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 10, height: 10,
          marginLeft: -5, marginTop: -5,
          borderRadius: '50%',
          background: '#e8521a',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }}/>

        {/* Orbiting platform dots */}
        {[
          { anim: 'orbit-1', dur: '5s',  color: '#7c3aed', label: '𝕏' },
          { anim: 'orbit-2', dur: '7s',  color: '#e8521a', label: '▶' },
          { anim: 'orbit-3', dur: '4s',  color: '#2563eb', label: 'in' },
          { anim: 'orbit-4', dur: '9s',  color: '#16a34a', label: 'gh' },
          { anim: 'orbit-5', dur: '6s',  color: '#dc2626', label: 'yt' },
          { anim: 'orbit-6', dur: '8s',  color: '#0891b2', label: '✈' },
        ].map((o, i) => (
          <div key={i} className="doodle-node" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 24, height: 24,
            marginLeft: -12, marginTop: -12,
            borderRadius: '50%',
            background: o.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, color: '#fff', fontWeight: 900,
            animation: `${o.anim} ${o.dur} linear infinite`,
            boxShadow: `0 2px 8px ${o.color}66`,
          }}>
            {o.label}
          </div>
        ))}
      </div>

      {/* ── Title ───────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: '#e8521a', textTransform: 'uppercase', marginBottom: 6 }}>
          ⚔ KAVACH DEEP SCAN
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#111', letterSpacing: -0.5 }}>
          Searching the Internet
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4, fontFamily: 'monospace' }}>
          Target: <span style={{ color: '#e8521a', fontWeight: 700 }}>@{username || '—'}</span>
        </div>
      </div>

      {/* ── Animated message ───────────────────────────── */}
      <div style={{ height: 28, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <span key={msgIdx} style={{
          fontSize: 12, color: '#555', fontStyle: 'italic',
          animation: 'msg-fade 3s ease-in-out 1',
        }}>
          {MESSAGES[msgIdx]}
        </span>
      </div>

      {/* ── Progress bar ───────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 12 }}>
        <div style={{
          height: 8,
          background: '#f5f5f0',
          borderRadius: 99,
          overflow: 'hidden',
          border: '1px solid #e8e6e0',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #e8521a, #f59e0b)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(232,82,26,0.4)',
          }}/>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Checked', value: done.toLocaleString(), color: '#e8521a' },
          { label: 'Total Sites', value: total > 0 ? total.toLocaleString() : '…', color: '#7c3aed' },
          { label: 'Progress', value: `${pct}%`, color: '#16a34a' },
          { label: 'Elapsed', value: elapsedStr, color: '#0891b2' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Latest site ───────────────────────────── */}
      {latest && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #e8e6e0',
          borderRadius: 99, padding: '6px 16px',
          marginBottom: 16,
        }}>
          {/* blinking dots */}
          {[0, 200, 400].map(d => (
            <div key={d} style={{
              width: 5, height: 5, borderRadius: '50%', background: '#e8521a',
              animation: `dot-blink 1s ${d}ms ease-in-out infinite`,
            }}/>
          ))}
          <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
            Scanning: <b style={{ color: '#e8521a' }}>{latest}</b>
          </span>
        </div>
      )}

      {/* ── Footer note ───────────────────────────── */}
      <div style={{
        fontSize: 10, color: '#ccc', textAlign: 'center', maxWidth: 340, lineHeight: 1.6
      }}>
        Scanning <b style={{ color: '#aaa' }}>500+ platforms</b> via WhatsMyName database + direct API verification.
        This may take 3–5 minutes. Please do not close this tab.
      </div>
    </div>
  );
};

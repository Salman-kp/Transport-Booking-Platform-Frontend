"use client";

import { motion } from 'framer-motion';

/* ── Bar Chart ────────────────────────────────────────────────────── */
export const BarChart = ({ bars, height = 140, color = '#10b981' }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  const bw = 34, gap = 12, pad = 8;
  const totalW = bars.length * (bw + gap) + pad;
  
  return (
    <svg viewBox={`0 0 ${totalW} ${height + 20}`} className="w-full" style={{ height: height + 20 }}>
      {[0, 0.5, 1].map((r, i) => (
        <line key={i} x1={pad} x2={totalW} y1={height - r * (height - 16)} y2={height - r * (height - 16)}
          stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {bars.map((bar, i) => {
        const bh = Math.max((bar.value / max) * (height - 16), 2);
        const x = pad + i * (bw + gap);
        return (
          <g key={i}>
            <motion.rect 
              initial={{ height: 0, y: height }}
              animate={{ height: bh, y: height - bh }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              x={x} width={bw} rx="5" fill={bar.color || color} opacity="0.85" 
            />
            <text x={x + bw / 2} y={height - bh - 5} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="700">{bar.value}</text>
            <text x={x + bw / 2} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{bar.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ── Area Chart ───────────────────────────────────────────────────── */
export const AreaChart = ({ points, height = 100, color = '#10b981', fill = '#d1fae5' }) => {
  if (!points || !points.length) return null;
  const max = Math.max(...points.map(p => p.value), 1);
  const w = 100 / (points.length - 1 || 1);
  const toX = i => i * w;
  const toY = v => height - (v / max) * (height - 12) - 4;
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)} ${toY(p.value)}`).join(' ');
  const area = `${line} L${toX(points.length - 1)} ${height} L0 ${height}Z`;
  const gid = `g${color.replace('#', '')}`;
  
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.7" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d={area} fill={`url(#${gid})`} 
      />
      <motion.path 
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d={line} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" 
      />
      {points.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.5" fill={color} />
      ))}
    </svg>
  );
};

/* ── Donut Ring ───────────────────────────────────────────────────── */
export const DonutRing = ({ value, total, color, size = 56 }) => {
  const pct = total > 0 ? value / total : 0;
  const r = 20; const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" width={size} height={size}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
      <motion.circle 
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - pct * c }}
        transition={{ duration: 1, ease: "easeOut" }}
        cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={c} 
        strokeLinecap="round" transform="rotate(-90 28 28)" 
      />
      <text x="28" y="32" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e293b">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
};

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { busApi } from '@/lib/busApi';
import { IndianRupee, Users, Bus, Plane, TrendingUp, BarChart3 } from 'lucide-react';

/* ── Shared SVG Primitives ─────────────────────────────────────────── */

const BarChart = ({ bars, height = 140 }) => {
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
            <rect x={x} y={height - bh} width={bw} height={bh} rx="5" fill={bar.color || '#10b981'} opacity="0.85">
              <animate attributeName="height" from="0" to={bh} dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
              <animate attributeName="y" from={height} to={height - bh} dur="0.9s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
            </rect>
            <text x={x + bw / 2} y={height - bh - 5} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="700">{bar.value}</text>
            <text x={x + bw / 2} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{bar.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

const AreaChart = ({ points, height = 100, color, fill }) => {
  if (!points.length) return null;
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
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.4" fill={color} />)}
    </svg>
  );
};

const DonutRing = ({ value, total, color, size = 56 }) => {
  const pct = total > 0 ? value / total : 0;
  const r = 20; const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" width={size} height={size}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={c} strokeDashoffset={c - pct * c}
        strokeLinecap="round" transform="rotate(-90 28 28)" className="transition-all duration-700" />
      <text x="28" y="32" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1e293b">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
};

/* ── Mock flight / airline data ─────────────────────────────────────── */
const FLIGHT_DATA = { total_revenue: 145000, total_bookings: 340 };
const MOCK_AIRLINES = [
  { name: 'Emirates', code: 'EK', bookings: 145, cancels: 12 },
  { name: 'Qatar Airways', code: 'QR', bookings: 98, cancels: 5 },
  { name: 'Lufthansa', code: 'LH', bookings: 67, cancels: 14 },
  { name: 'British Airways', code: 'BA', bookings: 52, cancels: 3 },
];
const MOCK_WEEKLY = [28, 35, 42, 38, 55, 62, 47];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ── Main Component ─────────────────────────────────────────────────── */
export default function OverviewAnalysis() {
  const [busRevenue, setBusRevenue] = useState(null);
  const [operators, setOperators] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [revData, opData, bookData] = await Promise.all([
          busApi.admin.getRevenueAnalytics(),
          busApi.admin.getOperatorAnalytics(),
          busApi.admin.getBookings(1, 20),
        ]);
        if (revData?.success) setBusRevenue(revData.data);
        if (opData?.success) setOperators(opData.data || []);
        if (bookData?.success) setBusBookings(bookData.data?.bookings || []);
      } catch (e) {
        console.error('Overview fetch error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        {[...Array(3)].map((_, i) => <div key={i} className="h-52 bg-slate-100 rounded-2xl" />)}
      </div>
    );
  }

  const busRev = parseFloat(busRevenue?.total_revenue || 0);
  const busBk = parseInt(busRevenue?.total_bookings || 0);
  const totalRev = busRev + FLIGHT_DATA.total_revenue;
  const totalBk = busBk + FLIGHT_DATA.total_bookings;

  // Bus 7-day trend from created_at
  const busWeekly = DAYS.map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return busBookings.filter(b => new Date(b.created_at).toDateString() === d.toDateString()).length;
  });

  // Operator bars
  const opBars = operators.slice(0, 6).map(op => ({
    label: (op.name || 'Op').split(' ')[0],
    value: op.total_bookings || 0,
    color: '#10b981',
  }));

  // Airline bars
  const airlineBars = MOCK_AIRLINES.map(a => ({
    label: a.code,
    value: a.bookings,
    color: '#6366f1',
  }));

  const kpis = [
    { label: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, icon: <IndianRupee size={18} />, color: 'emerald', sub: 'Bus + Flight' },
    { label: 'Total Bookings', value: totalBk.toLocaleString(), icon: <Users size={18} />, color: 'blue', sub: `${busBk} bus · ${FLIGHT_DATA.total_bookings} flight` },
    { label: 'Bus Revenue', value: `₹${busRev.toLocaleString()}`, icon: <Bus size={18} />, color: 'teal', sub: 'Live data' },
    { label: 'Flight Revenue', value: `₹${FLIGHT_DATA.total_revenue.toLocaleString()}`, icon: <Plane size={18} />, color: 'indigo', sub: 'Sample data' },
  ];

  return (
    <div className="space-y-6 mt-8">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-${k.color}-600 bg-${k.color}-50`}>{k.icon}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-${k.color}-50 text-${k.color}-600 uppercase tracking-widest`}>{k.sub}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{k.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Booking Share: Bus vs Flight ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Platform Booking Split</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bus vs Flight share of total bookings & revenue</p>
          </div>
          <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><TrendingUp size={16} /></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Bookings split */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <DonutRing value={busBk} total={totalBk} color="#10b981" size={88} />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Bus size={12} /> Bus Bookings</span>
                  <span className="text-xs font-black text-emerald-600">{busBk}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${totalBk > 0 ? (busBk / totalBk) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Plane size={12} /> Flight Bookings</span>
                  <span className="text-xs font-black text-indigo-600">{FLIGHT_DATA.total_bookings}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${totalBk > 0 ? (FLIGHT_DATA.total_bookings / totalBk) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue split */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <DonutRing value={busRev} total={totalRev} color="#f59e0b" size={88} />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Bus size={12} /> Bus Revenue</span>
                  <span className="text-xs font-black text-amber-600">${busRev.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${totalRev > 0 ? (busRev / totalRev) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Plane size={12} /> Flight Revenue</span>
                  <span className="text-xs font-black text-violet-600">${FLIGHT_DATA.total_revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-violet-400 transition-all duration-700"
                    style={{ width: `${totalRev > 0 ? (FLIGHT_DATA.total_revenue / totalRev) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Bar Charts: Operator vs Airline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bus Operators */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Bus Operator Bookings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirmed bookings per operator</p>
            </div>
            <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><BarChart3 size={15} /></span>
          </div>
          {opBars.length > 0
            ? <BarChart bars={opBars} height={140} />
            : <p className="text-center text-slate-400 text-sm py-10 italic">No operator data yet.</p>
          }
          <div className="flex items-center gap-2 mt-3">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bus Bookings (Live)</span>
          </div>
        </motion.div>

        {/* Flight Airlines */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Airline Bookings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bookings per airline (sample data)</p>
            </div>
            <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600"><BarChart3 size={15} /></span>
          </div>
          <BarChart bars={airlineBars} height={140} />
          <div className="flex items-center gap-2 mt-3">
            <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flight Bookings (Sample)</span>
          </div>
        </motion.div>
      </div>

      {/* ── 7-Day Trends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bus Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-0.5">Bus Booking Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Last 7 days</p>
          <AreaChart points={busWeekly.map((v, i) => ({ value: v, label: DAYS[i] }))}
            height={90} color="#10b981" fill="#d1fae5" />
          <div className="flex justify-between mt-2">
            {DAYS.map(d => <span key={d} className="text-[9px] font-bold text-slate-400">{d}</span>)}
          </div>
        </motion.div>

        {/* Flight Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-0.5">Flight Booking Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Last 7 days (sample)</p>
          <AreaChart points={MOCK_WEEKLY.map((v, i) => ({ value: v, label: DAYS[i] }))}
            height={90} color="#6366f1" fill="#e0e7ff" />
          <div className="flex justify-between mt-2">
            {DAYS.map(d => <span key={d} className="text-[9px] font-bold text-slate-400">{d}</span>)}
          </div>
        </motion.div>
      </div>

      {/* ── Airline Success Rate Donuts ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-black text-slate-900">Airline Success Rates</h3>
            <p className="text-xs text-slate-400 mt-0.5">Confirmed vs cancelled ratio per airline</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Sample</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {MOCK_AIRLINES.map((airline, i) => {
            const total = airline.bookings + airline.cancels;
            return (
              <div key={i} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <DonutRing value={airline.bookings} total={total} color="#6366f1" size={56} />
                <p className="text-[11px] font-black text-slate-700 text-center">{airline.name}</p>
                <div className="flex gap-2 text-[9px] font-bold">
                  <span className="text-indigo-600">{airline.bookings} ✓</span>
                  <span className="text-red-400">{airline.cancels} ✗</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Operator Success Rate Donuts ── */}
      {operators.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Bus Operator Success Rates</h3>
              <p className="text-xs text-slate-400 mt-0.5">Confirmed vs cancelled ratio per operator</p>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Live</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {operators.map((op, i) => {
              const total = (op.total_bookings || 0) + (op.total_cancellations || 0);
              return (
                <div key={i} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DonutRing value={op.total_bookings || 0} total={total || 1} color="#10b981" size={56} />
                  <p className="text-[10px] font-black text-slate-700 text-center leading-tight">{op.name}</p>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="text-emerald-600">{op.total_bookings || 0} ✓</span>
                    <span className="text-red-400">{op.total_cancellations || 0} ✗</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

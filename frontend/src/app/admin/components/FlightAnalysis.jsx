import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, TrendingUp, Users, IndianRupee, Calendar, BarChart3, Info } from 'lucide-react';

/* ─── Shared SVG chart primitives (duplicated locally for isolation) ── */

const BarChart = ({ bars, height = 160 }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${bars.length * 52} ${height}`} className="w-full h-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i} x1="0" x2={bars.length * 52} y1={height - r * (height - 20)} y2={height - r * (height - 20)}
            stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {bars.map((bar, i) => {
          const barH = ((bar.value / max) * (height - 20));
          const x = i * 52 + 10;
          return (
            <g key={i}>
              <rect x={x} y={height - barH - 4} width={32} height={barH}
                rx="6" fill={bar.color || '#6366f1'} opacity="0.9">
                <animate attributeName="height" from="0" to={barH} dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
                <animate attributeName="y" from={height - 4} to={height - barH - 4} dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" />
              </rect>
              <text x={x + 16} y={height - barH - 8} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">{bar.value}</text>
              <text x={x + 16} y={height + 12} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">{bar.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const AreaChart = ({ points, height = 100, color = '#6366f1', fill = '#e0e7ff' }) => {
  if (!points.length) return null;
  const max = Math.max(...points.map(p => p.value), 1);
  const w = 100 / (points.length - 1 || 1);
  const toX = i => i * w;
  const toY = v => height - (v / max) * (height - 16) - 4;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1)} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradFlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.8" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#gradFlight)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.2" fill={color} />)}
    </svg>
  );
};

const DonutRing = ({ value, total, color = '#6366f1' }) => {
  const pct = total > 0 ? value / total : 0;
  const r = 18; const c = 2 * Math.PI * r;
  const offset = c - pct * c;
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <circle cx="24" cy="24" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
      <circle cx="24" cy="24" r={r} fill="transparent" stroke={color} strokeWidth="6"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 24 24)" className="transition-all duration-700" />
      <text x="24" y="27" textAnchor="middle" fontSize="8" fontWeight="800" fill="#1e293b">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
};

/* ─── Mock data (flight service not yet integrated) ─── */
const MOCK_AIRLINES = [
  { id: 1, name: 'Emirates', code: 'EK', total_bookings: 145, total_cancellations: 12, revenue: 128_450 },
  { id: 2, name: 'Qatar Airways', code: 'QR', total_bookings: 98, total_cancellations: 5, revenue: 87_200 },
  { id: 3, name: 'Lufthansa', code: 'LH', total_bookings: 67, total_cancellations: 14, revenue: 59_800 },
  { id: 4, name: 'British Airways', code: 'BA', total_bookings: 52, total_cancellations: 3, revenue: 46_100 },
  { id: 5, name: 'Air India', code: 'AI', total_bookings: 38, total_cancellations: 7, revenue: 31_600 },
];

const MOCK_UPCOMING = [
  { id: 101, departure_at: new Date(Date.now() + 3_600_000).toISOString(), flight: { flight_number: 'EK-502', airline: { name: 'Emirates' } }, origin: 'DXB', destination: 'LHR', status: 'ON TIME' },
  { id: 102, departure_at: new Date(Date.now() + 86_400_000).toISOString(), flight: { flight_number: 'QR-100', airline: { name: 'Qatar Airways' } }, origin: 'DOH', destination: 'JFK', status: 'ON TIME' },
  { id: 103, departure_at: new Date(Date.now() + 172_800_000).toISOString(), flight: { flight_number: 'LH-400', airline: { name: 'Lufthansa' } }, origin: 'FRA', destination: 'SIN', status: 'DELAYED' },
  { id: 104, departure_at: new Date(Date.now() + 259_200_000).toISOString(), flight: { flight_number: 'BA-031', airline: { name: 'British Airways' } }, origin: 'LHR', destination: 'BOM', status: 'ON TIME' },
  { id: 105, departure_at: new Date(Date.now() + 345_600_000).toISOString(), flight: { flight_number: 'AI-120', airline: { name: 'Air India' } }, origin: 'DEL', destination: 'SYD', status: 'CANCELLED' },
];

const MOCK_WEEKLY = [
  { label: 'Mon', value: 32 },
  { label: 'Tue', value: 28 },
  { label: 'Wed', value: 45 },
  { label: 'Thu', value: 38 },
  { label: 'Fri', value: 62 },
  { label: 'Sat', value: 55 },
  { label: 'Sun', value: 41 },
];

/* ─── Main Component ───────────────────────────────────────────────── */
export default function FlightAnalysis() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const topAirline = MOCK_AIRLINES[0];
  const totalBookings = MOCK_AIRLINES.reduce((s, a) => s + a.total_bookings, 0);
  const totalRevenue = MOCK_AIRLINES.reduce((s, a) => s + a.revenue, 0);
  const totalCancels = MOCK_AIRLINES.reduce((s, a) => s + a.total_cancellations, 0);
  const successRate = Math.round((totalBookings / (totalBookings + totalCancels)) * 100);

  const bookingBars = MOCK_AIRLINES.map(a => ({ label: a.code, value: a.total_bookings, color: '#6366f1' }));
  const revenueBars = MOCK_AIRLINES.map(a => ({ label: a.code, value: Math.round(a.revenue / 1000), color: '#f59e0b' }));

  const statusColor = (s) => {
    if (s === 'ON TIME') return 'bg-emerald-100 text-emerald-700';
    if (s === 'DELAYED') return 'bg-amber-100 text-amber-700';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-600';
    return 'bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Notice Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <Info size={16} className="text-indigo-500 flex-shrink-0" />
        <p className="text-indigo-700 text-sm font-medium">
          Flight analytics are currently displayed with <span className="font-black">sample data</span>. Live backend integration is pending.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, label: 'Total Bookings', value: totalBookings, color: 'indigo', trend: '+18%' },
          { icon: <IndianRupee size={18} />, label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'amber', trend: '+11%' },
          { icon: <TrendingUp size={18} />, label: 'Success Rate', value: `${successRate}%`, color: 'emerald', trend: '+2%' },
          { icon: <Plane size={18} />, label: 'Active Airlines', value: MOCK_AIRLINES.length, color: 'violet', trend: 'Live' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-${kpi.color}-600 bg-${kpi.color}-50`}>
                {kpi.icon}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-${kpi.color}-50 text-${kpi.color}-600`}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Top Airline Hero ── */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-7 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative z-10">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
            ✈️ Top Performing Airline
          </span>
          <h2 className="text-3xl font-black mb-1">{topAirline.name}</h2>
          <p className="text-white/70 text-sm">Leading with {topAirline.total_bookings} confirmed bookings this period.</p>
        </div>
        <div className="flex items-center gap-8 relative z-10">
          {[
            { val: topAirline.total_bookings, lbl: 'Bookings' },
            { val: `₹${(topAirline.revenue / 1000).toFixed(0)}K`, lbl: 'Revenue' },
            { val: topAirline.total_cancellations, lbl: 'Cancels' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black">{s.val}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{s.lbl}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings per Airline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Bookings by Airline</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Confirmed bookings per airline</p>
            </div>
            <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <BarChart3 size={16} />
            </span>
          </div>
          <BarChart bars={bookingBars} height={160} />
          <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed Bookings</span>
          </div>
        </motion.div>

        {/* Revenue per Airline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Revenue by Airline</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Revenue in thousands (USD)</p>
            </div>
            <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <BarChart3 size={16} />
            </span>
          </div>
          <BarChart bars={revenueBars} height={160} />
          <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue ($K)</span>
          </div>
        </motion.div>
      </div>

      {/* ── Weekly Trend + Airline Donuts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly trend area chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-1">Weekly Booking Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Sample weekly distribution</p>
          <AreaChart points={MOCK_WEEKLY} height={100} color="#6366f1" fill="#e0e7ff" />
          <div className="flex justify-between mt-2">
            {MOCK_WEEKLY.map((p, i) => <span key={i} className="text-[9px] font-bold text-slate-400">{p.label}</span>)}
          </div>
        </motion.div>

        {/* Airline success rate donuts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-5">Airline Success Rate</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MOCK_AIRLINES.map((airline) => {
              const total = airline.total_bookings + airline.total_cancellations;
              return (
                <div key={airline.id} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DonutRing value={airline.total_bookings} total={total} color="#6366f1" />
                  <p className="text-[11px] font-black text-slate-700 text-center leading-tight">{airline.name}</p>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="text-indigo-600">{airline.total_bookings} ✓</span>
                    <span className="text-red-400">{airline.total_cancellations} ✗</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Upcoming Flights Table ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">Upcoming Scheduled Flights</h3>
            <p className="text-xs text-slate-400">Next 5 departures</p>
          </div>
          <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Calendar size={15} />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {['Date & Time', 'Airline', 'Flight No.', 'Route', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_UPCOMING.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(trip.departure_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(trip.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{trip.flight?.airline?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{trip.flight?.flight_number}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                      <span>{trip.origin}</span>
                      <Plane size={12} className="text-slate-300 rotate-90" />
                      <span>{trip.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${statusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

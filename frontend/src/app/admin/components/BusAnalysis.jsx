import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { busApi } from '@/lib/busApi';
import { TrendingUp, Bus, Users, IndianRupee, Calendar, ChevronRight, BarChart3 } from 'lucide-react';

/* ─── Shared SVG chart primitives ─────────────────────────────────── */

// Animated Bar Chart
const BarChart = ({ bars, height = 160, yLabel = '' }) => {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${bars.length * 52} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid lines */}
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
                rx="6" fill={bar.color || '#10b981'} opacity="0.9" className="transition-all duration-700">
                <animate attributeName="height" from="0" to={barH} dur="0.8s" fill="freeze" calcMode="spline"
                  keySplines="0.4 0 0.2 1" />
                <animate attributeName="y" from={height - 4} to={height - barH - 4} dur="0.8s" fill="freeze"
                  calcMode="spline" keySplines="0.4 0 0.2 1" />
              </rect>
              <text x={x + 16} y={height - barH - 8} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">
                {bar.value}
              </text>
              <text x={x + 16} y={height + 12} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Animated Line/Area Chart
const AreaChart = ({ points, height = 120, color = '#10b981', fill = '#d1fae5' }) => {
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
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.8" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.value)} r="1.2" fill={color} />
      ))}
    </svg>
  );
};

// Mini doughnut for each operator
const DonutRing = ({ value, total, color = '#10b981' }) => {
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

/* ─── Main Component ───────────────────────────────────────────────── */
export default function BusAnalysis() {
  const [operators, setOperators] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [opData, tripData, bookData, revData] = await Promise.all([
          busApi.admin.getOperatorAnalytics(),
          busApi.admin.getUpcomingTrips(5),
          busApi.admin.getBookings(1, 5),
          busApi.admin.getRevenueAnalytics(),
        ]);
        if (opData?.success) setOperators(opData.data || []);
        if (tripData?.success) setUpcoming(tripData.data || []);
        if (bookData?.success) setBookings(bookData.data?.bookings || []);
        if (revData?.success) setRevenue(revData.data);
      } catch (err) {
        console.error('Failed to fetch bus analysis', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const requestDelete = (id) => setDeleteConfirmId(id);
  const cancelDelete = () => setDeleteConfirmId(null);

  const confirmDelete = async (id) => {
    setDeleteConfirmId(null);
    try {
      const res = await busApi.admin.deleteInstance(id);
      if (res?.success || res) setUpcoming(prev => prev.filter(t => t.id !== id));
    } catch (err) { console.error('Delete failed', err); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SCHEDULED' ? 'DISABLED' : 'SCHEDULED';
    try {
      await busApi.admin.updateInstanceStatus(id, newStatus);
      setUpcoming(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error('Status update failed', err); }
  };

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
        <div className="h-72 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  const topOperator = [...operators].sort((a, b) => b.total_bookings - a.total_bookings)[0];
  const totalBookings = operators.reduce((s, o) => s + (o.total_bookings || 0), 0);
  const totalCancels = operators.reduce((s, o) => s + (o.total_cancellations || 0), 0);
  const successRate = totalBookings > 0 ? Math.round((totalBookings / (totalBookings + totalCancels)) * 100) : 0;

  // Derive bar chart data from operators
  const operatorBars = operators.slice(0, 6).map(op => ({
    label: op.name?.split(' ')[0] || 'Op',
    value: op.total_bookings || 0,
    color: '#10b981',
  }));

  // Cancellations bars
  const cancelBars = operators.slice(0, 6).map(op => ({
    label: op.name?.split(' ')[0] || 'Op',
    value: op.total_cancellations || 0,
    color: '#f87171',
  }));

  // Simulated daily trend from bookings created_at
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      value: bookings.filter(b => new Date(b.created_at).toDateString() === d.toDateString()).length,
    };
  });

  return (
    <div className="space-y-6 mt-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, label: 'Total Bookings', value: revenue?.total_bookings ?? totalBookings, color: 'emerald', trend: '+12%' },
          { icon: <IndianRupee size={18} />, label: 'Total Revenue', value: `₹${parseFloat(revenue?.total_revenue || 0).toLocaleString()}`, color: 'blue', trend: '+8%' },
          { icon: <TrendingUp size={18} />, label: 'Success Rate', value: `${successRate}%`, color: 'violet', trend: '+3%' },
          { icon: <Bus size={18} />, label: 'Active Operators', value: operators.length, color: 'amber', trend: 'Live' },
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

      {/* ── Top Operator Hero ── */}
      {topOperator && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-7 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
              🏆 Top Performing Operator
            </span>
            <h2 className="text-3xl font-black mb-1">{topOperator.name}</h2>
            <p className="text-white/70 text-sm">Leading with {topOperator.total_bookings} confirmed bookings this period.</p>
          </div>
          <div className="flex items-center gap-8 relative z-10">
            {[
              { val: topOperator.total_bookings, lbl: 'Bookings' },
              { val: `${Math.round((topOperator.total_bookings / (topOperator.total_bookings + (topOperator.total_cancellations || 0) || 1)) * 100)}%`, lbl: 'Success' },
              { val: topOperator.total_cancellations || 0, lbl: 'Cancels' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black">{s.val}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{s.lbl}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings per Operator Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Bookings by Operator</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Confirmed bookings per operator</p>
            </div>
            <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <BarChart3 size={16} />
            </span>
          </div>
          {operatorBars.length > 0
            ? <BarChart bars={operatorBars} height={160} />
            : <p className="text-slate-400 text-sm text-center py-10 italic">No operator data available.</p>
          }
          <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed Bookings</span>
          </div>
        </motion.div>

        {/* Cancellations per Operator Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Cancellations by Operator</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Cancellation volume per operator</p>
            </div>
            <span className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
              <BarChart3 size={16} />
            </span>
          </div>
          {cancelBars.length > 0
            ? <BarChart bars={cancelBars} height={160} />
            : <p className="text-slate-400 text-sm text-center py-10 italic">No data available.</p>
          }
          <div className="flex items-center gap-2 mt-4">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cancellations</span>
          </div>
        </motion.div>
      </div>

      {/* ── Booking Trend + Operator Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-day trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-1">7-Day Booking Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Based on booking created_at timestamps</p>
          <AreaChart points={last7} height={100} color="#10b981" fill="#d1fae5" />
          <div className="flex justify-between mt-2">
            {last7.map((p, i) => (
              <span key={i} className="text-[9px] font-bold text-slate-400">{p.label}</span>
            ))}
          </div>
        </motion.div>

        {/* Operator Donut Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-5">Operator Success Rate</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {operators.map((op) => {
              const total = (op.total_bookings || 0) + (op.total_cancellations || 0);
              return (
                <div key={op.id} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <DonutRing value={op.total_bookings || 0} total={total || 1} color="#10b981" />
                  <p className="text-[11px] font-black text-slate-700 text-center leading-tight">{op.name}</p>
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="text-emerald-600">{op.total_bookings || 0} ✓</span>
                    <span className="text-red-400">{op.total_cancellations || 0} ✗</span>
                  </div>
                </div>
              );
            })}
            {operators.length === 0 && (
              <p className="col-span-3 text-slate-400 text-sm text-center py-8 italic">No operator data.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Upcoming Trips ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">Upcoming Scheduled Trips</h3>
            <p className="text-xs text-slate-400">Next 5 departures</p>
          </div>
          <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Calendar size={15} />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left bg-slate-50/50">
                {['Date & Time', 'Operator', 'Bus Number', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcoming.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm italic">No upcoming trips scheduled.</td></tr>
              )}
              {upcoming.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(trip.departure_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(trip.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{trip.bus?.operator?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{trip.bus?.bus_number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${trip.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggleStatus(trip.id, trip.status)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                        title={trip.status === 'SCHEDULED' ? 'Disable' : 'Enable'}>
                        <span className="material-symbols-outlined text-[17px]">
                          {trip.status === 'SCHEDULED' ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                      {deleteConfirmId === trip.id ? (
                        <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg">
                          <button onClick={() => confirmDelete(trip.id)} className="text-xs font-bold text-red-600 hover:underline">Confirm</button>
                          <span className="text-slate-300">|</span>
                          <button onClick={cancelDelete} className="text-xs font-bold text-slate-500 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => requestDelete(trip.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      )}
                    </div>
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

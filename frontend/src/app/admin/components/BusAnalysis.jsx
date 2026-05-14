import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { busApi } from '@/lib/busApi';
import { TrendingUp, Bus, Users, IndianRupee, Calendar, ChevronRight, ChevronLeft, BarChart3, XCircle } from 'lucide-react';

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
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.8" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
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


// Profit Loss Chart (Daily - Shows Max, hover shows all details)
const ProfitLossChart = ({ bars, height = 160, onBarClick }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const max = Math.max(...bars.map(b => Math.max(b.spend || 0, b.profit || 0, b.loss || 0)), 1);
  const svgW = Math.max(bars.length * 60, 400);
  return (
    <div className="w-full overflow-x-auto relative" style={{ height: height + 30 }}>
      <svg viewBox={`0 0 ${svgW} ${height + 30}`} className="h-full min-w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i} x1="0" x2={svgW} y1={height - r * (height - 20)} y2={height - r * (height - 20)} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {bars.map((bar, i) => {
          const maxVal = Math.max(bar.spend || 0, bar.profit || 0, bar.loss || 0);
          let color = '#3b82f6';
          if (maxVal === bar.loss && bar.loss > 0) color = '#ef4444';
          else if (maxVal === bar.profit && bar.profit > 0) color = '#10b981';

          const barH = ((maxVal / max) * (height - 20));
          const x = i * 60 + 20;
          const isHovered = hoveredIdx === i;
          return (
            <g key={i}
              onClick={() => onBarClick && onBarClick(bar)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={onBarClick ? 'cursor-pointer transition-opacity' : ''}
              style={{ filter: bar.isSelected ? 'brightness(0.7) drop-shadow(0px 0px 4px rgba(16,185,129,0.5))' : 'none' }}
            >
              <rect x={x} y={height - barH - 4} width={36} height={barH} rx="6" fill={color} opacity={isHovered ? 1 : 0.9} />
              {!isHovered && (
                <text x={x + 18} y={height - barH - 8} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">
                  ₹{maxVal}
                </text>
              )}
              <text x={x + 18} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">
                {bar.label}
              </text>
              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect x={x - 28} y={0} width={92} height={68} rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
                  <text x={x + 18} y={18} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="800">
                    Spend: ₹{bar.spend || 0}
                  </text>
                  <text x={x + 18} y={36} textAnchor="middle" fontSize="10" fill="#10b981" fontWeight="800">
                    Profit: ₹{bar.profit || 0}
                  </text>
                  <text x={x + 18} y={54} textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="800">
                    Loss: ₹{bar.loss || 0}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Triple Bar Chart (Instance - Shows 3 separate bars)
const TripleBarChart = ({ bars, height = 160, onBarClick }) => {
  const max = Math.max(...bars.flatMap(b => [b.spend || 0, b.profit || 0, b.loss || 0]), 1);
  return (
    <div className="w-full overflow-x-auto" style={{ height: height + 30 }}>
      <svg viewBox={`0 0 ${Math.max(bars.length * 80, 400)} ${height + 30}`} className="h-full min-w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i} x1="0" x2={Math.max(bars.length * 80, 400)} y1={height - r * (height - 20)} y2={height - r * (height - 20)} stroke="#f1f5f9" strokeWidth="1" />
        ))}
        {bars.map((bar, i) => {
          const gx = i * 80 + 20;
          const sH = Math.max(((bar.spend || 0) / max) * (height - 20), 4);
          const pH = Math.max(((bar.profit || 0) / max) * (height - 20), 4);
          const lH = Math.max(((bar.loss || 0) / max) * (height - 20), 4);
          return (
            <g key={i} onClick={() => onBarClick && onBarClick(bar)} className={onBarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} style={{ filter: bar.isSelected ? 'brightness(0.7) drop-shadow(0px 0px 4px rgba(16,185,129,0.5))' : 'none' }}>
              <rect x={gx} y={height - sH - 4} width={14} height={sH} rx="3" fill="#3b82f6" opacity="0.9" />
              <text x={gx + 7} y={height - sH - 8} textAnchor="middle" fontSize="7" fill="#3b82f6" fontWeight="700">
                ₹{bar.spend || 0}
              </text>
              <rect x={gx + 16} y={height - pH - 4} width={14} height={pH} rx="3" fill="#10b981" opacity="0.9" />
              <text x={gx + 23} y={height - pH - 8} textAnchor="middle" fontSize="7" fill="#10b981" fontWeight="700">
                ₹{bar.profit || 0}
              </text>
              <rect x={gx + 32} y={height - lH - 4} width={14} height={lH} rx="3" fill="#ef4444" opacity="0.9" />
              <text x={gx + 39} y={height - lH - 8} textAnchor="middle" fontSize="7" fill="#ef4444" fontWeight="700">
                ₹{bar.loss || 0}
              </text>
              <text x={gx + 23} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
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
  const [dailyAccounting, setDailyAccounting] = useState([]);
  const [instanceAccounting, setInstanceAccounting] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [instanceBookings, setInstanceBookings] = useState([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now.toISOString());
  const bookingsPerPage = 10;
  const [dailyMonth, setDailyMonth] = useState(now.getMonth() + 1);
  const [dailyYear, setDailyYear] = useState(now.getFullYear());
  const [cancelModal, setCancelModal] = useState({ open: false, bookingId: null, reason: '', loading: false, result: null });

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
        const upcomingTrips = tripData?.data || [];
        if (tripData?.success) setUpcoming(upcomingTrips);
        if (bookData?.success) setBookings(bookData.data?.bookings || []);
        if (revData?.success) setRevenue(revData.data);
      } catch (err) {
        console.error('Failed to fetch initial bus analysis', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Daily Accounting
  useEffect(() => {
    const fetchDailyAccounting = async () => {
      try {
        const data = await busApi.admin.getDailyAccountingAnalytics(dailyMonth, dailyYear);
        if (data && data.length > 0) {
          setDailyAccounting(data);
        } else {
          setDailyAccounting([]);
        }
      } catch (err) {
        console.error('Failed to fetch daily accounting', err);
      }
    };
    fetchDailyAccounting();
  }, [dailyMonth, dailyYear]);

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



  useEffect(() => {
    if (!selectedDate) return;

    const fetchInstancesForDate = async () => {
      try {
        const d = new Date(selectedDate);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        // Fetch all accounting records for that specific date directly
        const accResults = await busApi.admin.getInstanceAccountingAnalytics(day, month, year);
        setInstanceAccounting(accResults || []);
      } catch (err) {
        console.error("Failed to fetch instance accounting for date", err);
        setInstanceAccounting([]);
      }
    };

    fetchInstancesForDate();
  }, [selectedDate]);

  const handleDateClick = (bar) => {
    if (bar.rawDate) {
      setSelectedDate(bar.rawDate);
      setSelectedInstance(null);
    }
  };

  const fetchInstanceBookings = async (instanceId) => {
    try {
      const res = await busApi.admin.getInstanceBookings(instanceId);
      setInstanceBookings(res || []);
      setBookingsPage(1);
    } catch (err) {
      console.error('Failed to fetch instance bookings', err);
    }
  };

  const handleInstanceClick = (bar) => {
    if (bar.instanceId) {
      setSelectedInstance(bar.instanceId);
      fetchInstanceBookings(bar.instanceId);
    }
  };

  const openCancelModal = (bookingId) => {
    setCancelModal({ open: true, bookingId, reason: '', loading: false, result: null });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, bookingId: null, reason: '', loading: false, result: null });
  };

  const handleCancelBooking = async () => {
    if (!cancelModal.reason.trim()) return;
    setCancelModal(prev => ({ ...prev, loading: true }));
    try {
      await busApi.admin.cancelBooking(cancelModal.bookingId, cancelModal.reason);
      setCancelModal(prev => ({ ...prev, loading: false, result: 'success' }));
      if (selectedInstance) fetchInstanceBookings(selectedInstance);
    } catch (err) {
      setCancelModal(prev => ({ ...prev, loading: false, result: 'error', errorMsg: err.response?.data?.message || err.message }));
    }
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


  // Generate bars for the selected month
  const daysInMonth = new Date(dailyYear, dailyMonth, 0).getDate();
  const monthlyBars = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const match = dailyAccounting.find(d => {
      const date = new Date(d.date);
      return date.getDate() === day && date.getMonth() + 1 === dailyMonth && date.getFullYear() === dailyYear;
    });

    // Create an artificial date string for selection if none exists
    const dateStr = `${dailyYear}-${String(dailyMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
    const isSelected = selectedDate ? (
      new Date(selectedDate).getDate() === day &&
      new Date(selectedDate).getMonth() + 1 === dailyMonth &&
      new Date(selectedDate).getFullYear() === dailyYear
    ) : false;

    return {
      label: `${day} ${new Date(dailyYear, dailyMonth - 1).toLocaleString('default', { month: 'short' })}`,
      spend: match ? match.total_spend : 0,
      profit: match ? match.total_profit : 0,
      loss: match ? match.total_loss : 0,
      rawDate: match ? match.date : dateStr,
      isSelected
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

      {/* ── Accounting Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Daily Accounting</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Profit/Loss per day</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dailyMonth}
                onChange={(e) => setDailyMonth(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-md py-1 px-2 focus:outline-none focus:border-emerald-500"
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={dailyYear}
                onChange={(e) => setDailyYear(Number(e.target.value))}
                className="text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 rounded-md py-1 px-2 focus:outline-none focus:border-emerald-500"
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 ml-2"><IndianRupee size={16} /></span>
            </div>
          </div>
          <ProfitLossChart
            onBarClick={handleDateClick}
            bars={monthlyBars}
            height={160}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Instances: {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Click a bar group to view bookings</p>
            </div>
            <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Bus size={16} /></span>
          </div>
          {instanceAccounting.length > 0 ? (
            <>
              <TripleBarChart
                onBarClick={handleInstanceClick}
                bars={instanceAccounting.map(t => ({
                  label: t.bus_number || 'N/A',
                  spend: t.spend_amount_total || 0,
                  profit: t.profit_amount || 0,
                  loss: t.loss_amount || 0,
                  instanceId: t.instance_id,
                  isSelected: t.instance_id === selectedInstance
                }))}
                height={160}
              />
              <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Spend</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Profit</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className="text-[9px] font-bold text-slate-400 uppercase">Loss</span></div>
              </div>
            </>
          ) : <p className="text-slate-400 text-sm text-center py-10 italic">No instance accounting data.</p>}
        </motion.div>
      </div>

      {/* Selected Instance Bookings */}
      {selectedInstance && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900">Instance Bookings</h3>
              <p className="text-xs text-slate-400">Manage bookings for the selected trip</p>
            </div>
            <button onClick={() => setSelectedInstance(null)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><XCircle size={18} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">PNR</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Passengers</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instanceBookings.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic text-sm">No bookings found for this instance.</td></tr>}
                {instanceBookings.slice((bookingsPage - 1) * bookingsPerPage, bookingsPage * bookingsPerPage).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{b.pnr}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{b.passengers?.length || 0} Pax</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{b.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {b.status !== 'CANCELLED' && (
                        <button onClick={() => openCancelModal(b.id)} className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {instanceBookings.length > bookingsPerPage && (
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Page {bookingsPage} of {Math.ceil(instanceBookings.length / bookingsPerPage)}</span>
              <div className="flex gap-2">
                <button onClick={() => setBookingsPage(p => Math.max(1, p - 1))} disabled={bookingsPage === 1} className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setBookingsPage(p => Math.min(Math.ceil(instanceBookings.length / bookingsPerPage), p + 1))} disabled={bookingsPage === Math.ceil(instanceBookings.length / bookingsPerPage)} className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
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

      {/* ── Cancel Booking Modal ── */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-red-50 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
                <XCircle size={20} />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Cancel Booking</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {cancelModal.result === 'success' ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={24} className="text-emerald-600" />
                  </div>
                  <p className="text-base font-black text-slate-900">Booking Cancelled!</p>
                  <p className="text-xs text-slate-400 mt-1">The booking has been successfully cancelled.</p>
                  <button onClick={closeCancelModal} className="mt-5 px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">Close</button>
                </div>
              ) : cancelModal.result === 'error' ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <XCircle size={24} className="text-red-500" />
                  </div>
                  <p className="text-base font-black text-slate-900">Cancellation Failed</p>
                  <p className="text-xs text-red-500 mt-1">{cancelModal.errorMsg || 'Something went wrong.'}</p>
                  <button onClick={closeCancelModal} className="mt-5 px-6 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">Close</button>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Reason for Cancellation</label>
                  <textarea
                    value={cancelModal.reason}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter the reason for cancelling this booking..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none transition-all"
                  />
                </>
              )}
            </div>

            {/* Footer */}
            {!cancelModal.result && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  onClick={closeCancelModal}
                  disabled={cancelModal.loading}
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelModal.loading || !cancelModal.reason.trim()}
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelModal.loading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

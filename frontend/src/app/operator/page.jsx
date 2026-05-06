"use client";

import { useState, useEffect, useMemo } from 'react';
import { busApi } from '@/lib/busApi';
import { motion } from 'framer-motion';
import { 
  Loader2, TrendingUp, Users, IndianRupee, 
  Bus, ChevronRight, RefreshCcw,
  BarChart3, PieChart, Clock
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, DonutRing } from './components/OperatorCharts';

export default function OperatorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [analyticsData, bookingsData, tripsData] = await Promise.all([
        busApi.operator.getAnalytics(),
        busApi.operator.getBookings(),
        busApi.operator.getInstances()
      ]);
      setAnalytics(analyticsData);
      setBookings(bookingsData || []);
      setTrips(tripsData || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // --- Chart Data Derivation ---
  const weeklyTrends = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const counts = last7Days.map(day => {
      return bookings.filter(b => {
        const bd = new Date(b.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        return bd === day && b.status === 'CONFIRMED';
      }).length;
    });

    return last7Days.map((label, i) => ({ label, value: counts[i] }));
  }, [bookings]);

  const topBuses = useMemo(() => {
    if (!analytics?.top_instances) return [];
    return analytics.top_instances.map(stat => ({
      label: `${stat.bus_number || 'Unnamed Bus'}`,
      value: stat.count,
      id: stat.bus_instance_id
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Synchronizing Fleet Intelligence</p>
          <p className="text-[9px] text-slate-300 uppercase mt-1 font-medium tracking-widest">Aggregating real-time telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Gross Collection', value: `₹${analytics?.gross_amount?.toLocaleString() || 0}`, icon: <IndianRupee size={18} />, color: 'emerald', sub: 'Total Revenue' },
    { label: 'Net Earnings', value: `₹${analytics?.net_revenue?.toLocaleString() || 0}`, icon: <TrendingUp size={18} />, color: 'blue', sub: 'After Commission' },
    { label: 'Total Base Fare', value: `₹${analytics?.total_base_fare?.toLocaleString() || 0}`, icon: <IndianRupee size={18} />, color: 'indigo', sub: 'Commission Basis' },
    { label: 'Refunds Processed', value: `₹${analytics?.total_refunds?.toLocaleString() || 0}`, icon: <BarChart3 size={18} />, color: 'rose', sub: 'Cancelled Value' },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em] block mb-3">Operational Intelligence</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Operator Dashboard</h1>
        </div>
        <button 
          onClick={fetchAllData}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] tracking-widest uppercase text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={14} className="text-emerald-500" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k, i) => (
          <motion.div 
            key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-${k.color}-600 bg-${k.color}-50 group-hover:scale-110 transition-transform`}>{k.icon}</span>
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full bg-${k.color}-50 text-${k.color}-600 uppercase tracking-widest`}>{k.sub}</span>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{k.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Reservation Velocity Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">Reservation Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Daily confirmed booking distribution</p>
            </div>
            <span className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><BarChart3 size={20} /></span>
          </div>
          
          <div className="mt-4">
            <BarChart bars={weeklyTrends} height={180} />
          </div>
          
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirmed Seats</span>
            </div>
          </div>
        </motion.div>

        {/* Fleet Performance Donut */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">Success Rate</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Confirmed vs Cancelled</p>
            </div>
            <span className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><PieChart size={20} /></span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-6">
            <DonutRing 
              value={bookings.filter(b => b.status === 'CONFIRMED').length} 
              total={bookings.length || 1} 
              color="#10b981" 
              size={120} 
            />
            
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Confirmed</span>
                </div>
                <span className="text-sm font-black text-slate-900">{bookings.filter(b => b.status === 'CONFIRMED').length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Cancelled</span>
                </div>
                <span className="text-sm font-black text-slate-900">{bookings.filter(b => b.status === 'CANCELLED').length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Fleet Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">Fleet Utilization</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Top 5 performing bus routes</p>
            </div>
            <span className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><Bus size={20} /></span>
          </div>

          <div className="space-y-6">
            {topBuses.length > 0 ? (
              topBuses.map((bus, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{bus.label}</span>
                    <span className="text-sm font-black text-emerald-600">{bus.value} Bookings</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(bus.value / Math.max(...topBuses.map(b => b.value))) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center italic text-slate-400 text-sm">No fleet utilization data yet.</div>
            )}
          </div>
        </motion.div>

        {/* Live Trip Tracker (New) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col border border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight">Active Trips</h3>
            <Link href="/operator/bookings" className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">Manage All</Link>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[300px] scrollbar-hide">
            {trips.length > 0 ? (
              trips.slice(0, 10).map((trip, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      trip.status === 'SCHEDULED' ? 'bg-emerald-500/20 text-emerald-400' : 
                      trip.status === 'DELAYED' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      <Bus size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-widest uppercase">
                        {trip.bus?.bus_number}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock size={10} className="text-slate-500" />
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(trip.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="text-slate-700 mx-1">|</span>
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">{trip.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{trip.available_seater + trip.available_sleeper + trip.available_semi_sleeper}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Seats Left</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40 py-10">
                <Bus size={32} />
                <p className="text-xs font-bold uppercase tracking-widest">No active trips scheduled</p>
              </div>
            )}
          </div>

          <Link href="/operator/bookings" className="mt-8 w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20">
            Open Fleet Manifest <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

    </div>
  );
}

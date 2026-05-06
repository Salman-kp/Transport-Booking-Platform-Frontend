"use client";

import { useState, useEffect, useMemo } from 'react';
import { busApi } from '@/lib/busApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Calendar, Users, Search, 
  Receipt, IndianRupee, Trash2, Edit3, 
  CheckCircle2, AlertCircle, XCircle, Clock,
  ArrowRight, Info
} from 'lucide-react';

const STATUS_CONFIG = {
  SCHEDULED: { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
  CANCELLED: { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
  DELAYED: { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle },
};

export default function OperatorFleetManager() {
  const [activeView, setActiveView] = useState('TRIPS'); // TRIPS or BOOKINGS
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Status Update Modal
  const [updatingTrip, setUpdatingTrip] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeView === 'TRIPS') {
        const data = await busApi.operator.getInstances();
        setTrips(data || []);
      } else {
        const data = await busApi.operator.getBookings();
        setBookings(data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync with fleet records');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this trip? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await busApi.operator.deleteInstance(id);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Decommissioning failed. Ensure no active bookings exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!updatingTrip) return;
    
    try {
      setIsUpdating(true);
      await busApi.operator.updateInstanceStatus(updatingTrip.id, status);
      setTrips(trips.map(t => t.id === updatingTrip.id ? { ...t, status } : t));
      setUpdatingTrip(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredData = useMemo(() => {
    const data = activeView === 'TRIPS' ? trips : bookings;
    let filtered = [...data];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (activeView === 'TRIPS') {
        filtered = filtered.filter(t => 
          t.bus?.bus_number?.toLowerCase().includes(s) ||
          t.id?.toLowerCase().includes(s)
        );
      } else {
        filtered = filtered.filter(b => 
          b.pnr?.toLowerCase().includes(s) ||
          b.passengers?.some(p => (p.first_name + ' ' + p.last_name).toLowerCase().includes(s))
        );
      }
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(activeView === 'TRIPS' ? a.travel_date : a.created_at);
      const dateB = new Date(activeView === 'TRIPS' ? b.travel_date : b.created_at);
      return dateB - dateA;
    });
  }, [trips, bookings, activeView, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeView]);

  if (loading && currentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fleet Operations Syncing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-slate-100 pb-8">
        <div>
          <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em] block mb-3">Fleet Command</span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
            {activeView === 'TRIPS' ? 'Trip Schedules' : 'Reservations'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            {activeView === 'TRIPS' ? 'Monitor and manage departure statuses and fleet availability.' : 'Real-time passenger manifests and booking settlements.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder={activeView === 'TRIPS' ? "Search Bus No or ID..." : "Search PNR or Passenger..."}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
            <button
              onClick={() => setActiveView('TRIPS')}
              className={`relative px-6 py-2.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${activeView === 'TRIPS' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {activeView === 'TRIPS' && <motion.div layoutId="viewTab" className="absolute inset-0 bg-slate-900 rounded-xl shadow-md" style={{ zIndex: -1 }} />}
              Trips
            </button>
            <button
              onClick={() => setActiveView('BOOKINGS')}
              className={`relative px-6 py-2.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${activeView === 'BOOKINGS' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {activeView === 'BOOKINGS' && <motion.div layoutId="viewTab" className="absolute inset-0 bg-slate-900 rounded-xl shadow-md" style={{ zIndex: -1 }} />}
              Bookings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {activeView === 'TRIPS' ? (
                  <>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bus / ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Route Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Departure</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capacity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PNR / Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Passenger Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Booked At</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fare Allocation</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-5"></th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold italic uppercase text-xs">
                    No data found in current fleet records.
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                    key={item.id} className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {activeView === 'TRIPS' ? (
                      // TRIPS ROW
                      <>
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 text-sm tracking-[0.1em] uppercase">{item.bus?.bus_number}</div>
                          <div className="text-[9px] text-slate-400 font-bold mt-1 tracking-widest uppercase">ID: {item.id?.substring(0, 8)}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                              {item.bus?.origin_stop?.city || 'Origin'}
                            </div>
                            <ArrowRight size={12} className="text-emerald-500" />
                            <div className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                              {item.bus?.destination_stop?.city || 'Dest'}
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                            {item.bus?.bus_type?.name || 'Standard Fleet'}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <Calendar size={14} className="text-emerald-500" />
                            {new Date(item.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase ml-6">
                            {new Date(item.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-900 uppercase">{item.available_seater + item.available_sleeper + item.available_semi_sleeper}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Avail</p>
                            </div>
                            <div className="h-6 w-px bg-slate-100" />
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase">36</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Cap</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border flex items-center justify-center gap-2 mx-auto w-fit ${
                            STATUS_CONFIG[item.status]?.color || 'bg-slate-50 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setUpdatingTrip(item)}
                              className="p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTrip(item.id)}
                              className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // BOOKINGS ROW (Same as before but polished)
                      <>
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 text-sm tracking-[0.1em] uppercase">{item.pnr}</div>
                          <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Trip: {item.bus_instance?.bus?.bus_number || 'N/A'}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm uppercase">
                                {item.passengers?.[0]?.first_name} {item.passengers?.[0]?.last_name}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.passengers?.length} Total Pax</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <Clock size={14} className="text-emerald-500" />
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-1.5">
                            <IndianRupee size={12} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-900">{item.total_amount?.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {item.passengers?.slice(0, 3).map((p, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded border border-slate-200">
                                {p.seat?.seat_number || 'TBD'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border inline-block ${
                            item.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            item.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                            <Receipt size={18} />
                          </button>
                        </td>
                      </>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {currentItems.length} of {filteredData.length} Records
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-500'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <AnimatePresence>
        {updatingTrip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUpdatingTrip(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Modify Status</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Bus: {updatingTrip.bus?.bus_number}</p>
                  </div>
                  <button onClick={() => setUpdatingTrip(null)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <button
                      key={status}
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(status)}
                      className={`w-full p-6 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${
                        updatingTrip.status === status 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950' 
                          : 'bg-white border-slate-100 hover:border-emerald-500/30 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
                          <config.icon size={20} />
                        </div>
                        <span className="font-black uppercase tracking-widest text-[11px]">{status}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        updatingTrip.status === status ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'
                      }`}>
                        {updatingTrip.status === status && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>

                {isUpdating && (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin h-5 w-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broadcasting Update...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

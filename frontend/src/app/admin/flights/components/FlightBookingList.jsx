"use client";
import { useState, useEffect } from 'react';
import { flightApi } from '@/lib/flightApi';
import { Search, Eye, CheckCircle, XCircle, Clock, Plane, MapPin, Users, Hash, Edit3, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlightBookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await flightApi.admin.getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to load flight bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await flightApi.admin.updateBookingStatus(id, status);
      loadBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, status }));
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.pnr?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    b.status?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'BOARDING': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DEPARTED': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Unified Header with Search - Always Visible */}
        <div className="px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by PNR, Status, or User ID..."
              className="w-full pl-12 pr-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadBookings}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              title="Refresh"
            >
              <Clock size={20} />
            </button>
            <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Bookings</span>
              <p className="text-xl font-black text-emerald-900 leading-none">{filteredBookings.length}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold animate-pulse tracking-tight">Synchronizing Bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400">
            <div className="p-6 bg-slate-50 rounded-full mb-4 border border-slate-100">
              <Hash size={40} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-600 uppercase tracking-tight">No Bookings Found</h3>
            <p className="text-sm font-medium mt-1">We couldn't find any results matching "{search}"</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Info</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Details</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Passengers</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map((booking) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={booking.id}
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-slate-900 tracking-tight">{booking.pnr || 'N/A'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {booking.id?.substring(0, 8) || '---'}...</span>
                          <span className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-widest">User: {booking.user_id?.substring(0, 8) || '---'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Plane size={14} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-700">{booking.flight_instance?.flight?.flight_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                            <span>{booking.flight_instance?.flight?.origin_airport?.city || 'N/A'}</span>
                            <ChevronRight size={10} />
                            <span>{booking.flight_instance?.flight?.destination_airport?.city || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <span className="text-sm font-black text-slate-700">{booking.passengers?.length || 0} Pax</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {booking.passengers?.slice(0, 2).map((p, idx) => (
                            <span key={idx} className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              {p.first_name}
                            </span>
                          ))}
                          {booking.passengers?.length > 2 && (
                            <span className="text-[9px] font-black text-slate-300">+{booking.passengers.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-emerald-600">₹{booking.total_amount?.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{booking.payment_status || 'Paid'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all border border-transparent"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <div className="relative group/actions">
                            <button 
                              className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-emerald-600 transition-all border border-transparent hover:border-slate-100"
                              title="Update Status"
                            >
                              <Edit3 size={18} />
                            </button>
                            
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/actions:flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 min-w-[150px]">
                              {['CONFIRMED', 'CANCELLED', 'BOARDING', 'DEPARTED'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleUpdateStatus(booking.id, status)}
                                  className="px-4 py-2 text-[10px] font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors text-left uppercase tracking-widest"
                                >
                                  Mark {status}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button className="p-2 hover:bg-red-50 rounded-xl text-slate-300 hover:text-red-500 transition-colors border border-transparent">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of {filteredBookings.length}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Details</h2>
                    <p className="text-slate-400 font-medium mt-0.5">PNR: {selectedBooking.pnr}</p>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Details</label>
                      <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm font-black text-slate-700">{selectedBooking.flight_instance?.flight?.flight_number}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                          {selectedBooking.flight_instance?.flight?.origin_airport?.city} ➔ {selectedBooking.flight_instance?.flight?.destination_airport?.city}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Info</label>
                      <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-lg font-black text-emerald-600">₹{selectedBooking.total_amount?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {selectedBooking.payment_status || 'Paid'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passengers ({selectedBooking.passengers?.length})</label>
                    <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {selectedBooking.passengers?.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-700">{p.first_name} {p.last_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.seat_number || 'No Seat'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                  >
                    Cancel Booking
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

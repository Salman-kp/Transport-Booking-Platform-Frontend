"use client";
import { useState, useEffect } from 'react';
import { flightApi } from '@/lib/flightApi';
import { Search, Eye, CheckCircle, XCircle, Clock, Plane, MapPin, User, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FlightBookingList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const updateStatus = async (id, status) => {
    try {
      await flightApi.admin.updateBookingStatus(id, status);
      loadBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, status }));
      }
    } catch (error) {
      alert("Failed to update booking status");
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.pnr?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    b.status?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by PNR, User ID, or Status..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={loadBookings}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Clock size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Synchronizing Bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Hash size={40} className="text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-600">No Bookings Found</h3>
          <p className="text-sm">We couldn't find any bookings matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => (
            <motion.div 
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                    <Plane size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{booking.pnr}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                      Booking ID: {booking.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedBooking(booking)}
                    className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <Eye size={20} />
                  </button>
                  {booking.status === 'PENDING' && (
                    <button 
                      onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                  {booking.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => updateStatus(booking.id, 'CANCELLED')}
                      className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger Count</p>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User size={14} className="text-slate-300" />
                    <span className="text-sm font-black">{booking.passengers?.length || 0} Pax</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight Details</p>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} className="text-slate-300" />
                    <span className="text-sm font-black">
                      {booking.flight_instance?.flight?.flight_number || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                  <span className="text-sm font-black text-emerald-600">₹{booking.total_amount?.toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Date</p>
                  <span className="text-sm font-bold text-slate-600">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 p-8"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Details</h2>
                  <p className="text-slate-400 font-medium">PNR: {selectedBooking.pnr}</p>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                {/* Passengers */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <User size={16} className="text-emerald-600" />
                    Passengers
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedBooking.passengers?.map((p, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{p.gender} • {p.age} Years</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-700">Seat: {p.seat_number || 'Auto'}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{p.seat_class}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flight Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Plane size={16} className="text-emerald-600" />
                    Flight Information
                  </h3>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Airline</p>
                        <p className="text-lg font-black text-slate-900">
                          {selectedBooking.flight_instance?.flight?.airline?.name || 'Unknown Airline'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Flight No</p>
                        <p className="text-lg font-black text-slate-900">
                          {selectedBooking.flight_instance?.flight?.flight_number || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between pt-4 border-t border-emerald-200/50">
                      <div>
                        <p className="text-2xl font-black text-slate-900">
                          {selectedBooking.flight_instance?.flight?.origin_airport?.iata_code}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {new Date(selectedBooking.flight_instance?.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full h-[2px] bg-emerald-200 relative">
                          <Plane size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 rotate-90" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase mt-2 tracking-widest">Non-Stop</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">
                          {selectedBooking.flight_instance?.flight?.destination_airport?.iata_code}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {new Date(selectedBooking.flight_instance?.arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  Close View
                </button>
                {selectedBooking.status === 'PENDING' && (
                  <button 
                    onClick={() => updateStatus(selectedBooking.id, 'CONFIRMED')}
                    className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                  >
                    Confirm Booking
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

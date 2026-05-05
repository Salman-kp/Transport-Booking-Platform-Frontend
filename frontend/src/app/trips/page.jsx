"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Plane,
  Calendar,
  Clock,
  Loader2,
  SearchX,
  ArrowRight,
  CheckCircle2,
  Ticket,
  XCircle,
  AlertCircle,
  ChevronRight,
  Bus,
} from "lucide-react";
import { flightApi } from "@/lib/flightApi";
import { busApi } from "@/lib/busApi";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

export default function MyTripsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [flightBookings, setFlightBookings] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [busDetailsMap, setBusDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelType, setCancelType] = useState('flight');

  const [busFilter, setBusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }

    if (isAuthenticated) {
      const fetchTrips = async () => {
        try {
          setIsLoading(true);
          const [flightRes, busRes] = await Promise.all([
            flightApi.getBookingHistory().catch(() => ({ data: [] })),
            busApi.getBookingHistory().catch(() => ({ data: [] }))
          ]);

          const buses = busRes?.data || busRes || [];
          setFlightBookings(flightRes?.data || flightRes || []);
          setBusBookings(buses);

          // Fetch unique bus instance details
          const uniqueInstanceIds = [...new Set(buses.map(b => b.bus_instance_id).filter(id => !!id))];
          if (uniqueInstanceIds.length > 0) {
            const detailsResults = await Promise.all(
              uniqueInstanceIds.map(id => busApi.getBusDetails(id).catch(() => null))
            );
            
            const detailsMap = {};
            detailsResults.forEach((res, index) => {
              if (res) {
                const data = res.data || res;
                detailsMap[uniqueInstanceIds[index]] = data;
              }
            });
            setBusDetailsMap(detailsMap);
          }
        } catch (err) {
          console.error("Error fetching trips:", err);
          setError("Failed to load your booking history.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchTrips();
    }
  }, [isAuthenticated, authLoading, router]);

  const initiateCancel = (e, bookingId, type = 'flight') => {
    e.stopPropagation();
    setBookingToCancel(bookingId);
    setCancelType(type);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    setShowCancelModal(false);

    try {
      setCancellingId(bookingToCancel);
      if (cancelType === 'flight') {
        const res = await flightApi.cancelBooking(bookingToCancel, "User requested cancellation");
        setFlightBookings(prev => prev.map(b =>
          b.id === bookingToCancel
            ? { ...b, status: 'CANCELLED', refund_status: res.refund_status || 'PENDING', refund_amount: res.refund_amount || 0 }
            : b
        ));
      } else {
        const res = await busApi.cancelBooking(bookingToCancel, "User requested cancellation");
        setBusBookings(prev => prev.map(b =>
          b.id === bookingToCancel
            ? { ...b, status: 'CANCELLED' }
            : b
        ));
      }

      alert("Booking cancelled successfully.");
    } catch (err) {
      console.error("Cancellation failed:", err);
      alert(err.response?.data?.error || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  if (authLoading || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const sortedFlights = [...flightBookings].sort(
    (a, b) => new Date(b.created_at || b.CreatedAt) - new Date(a.created_at || a.CreatedAt)
  );

  const filteredBuses = [...busBookings].filter(booking => {
    const status = booking.status?.toUpperCase();

    if (busFilter === 'cancelled') {
      return status === 'CANCELLED';
    }
    if (busFilter === 'booked') {
      return status === 'CONFIRMED' || status === 'SUCCESS';
    }
    return true; // 'all' or default
  }).sort((a, b) => new Date(b.booked_at || b.created_at || b.CreatedAt) - new Date(a.booked_at || a.created_at || a.CreatedAt));

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case "CONFIRMED":
      case "SUCCESS":
        return (
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-100">
            <CheckCircle2 size={12} fill="currentColor" className="text-emerald-200" /> Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold border border-amber-100">
            Pending Payment
          </span>
        );
      case "CANCELLED":
        return (
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold border border-red-100">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        <header className="mb-12">
          <Link
            href="/buses"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-outline hover:text-primary transition-colors mb-6 group"
          >
            <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Bus Search
          </Link>
          <h1 className="text-5xl font-black text-primary tracking-tight font-['Plus_Jakarta_Sans']">
            My Bookings
          </h1>
          <p className="text-on-surface-variant mt-3 text-lg font-light">
            Manage your transport reservations and upcoming adventures.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-100 font-medium text-center">
            {error}
          </div>
        )}

        {flightBookings.length === 0 && busBookings.length === 0 && !error ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <SearchX size={40} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">
              No bookings found
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              It looks like you haven't booked any trips with us yet. Ready for
              your next journey?
            </p>
            <Link
              href="/"
              className="bg-primary text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-primary/20 transition-transform active:scale-95 flex items-center gap-2 uppercase text-xs tracking-widest"
            >
              Start Exploring <ArrowRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {/* Flight Bookings Section */}
            {sortedFlights.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                    <Plane className="text-primary" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-primary font-['Plus_Jakarta_Sans'] tracking-tight">Flight Reservations</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sortedFlights.map((booking, idx) => {
                    const flightDate = new Date(booking.departure_time || booking.booked_at);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => router.push(`/trips/${booking.id}`)}
                        className="bg-white rounded-3xl overflow-hidden border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all group cursor-pointer h-full flex flex-col"
                      >
                        <div className="h-32 bg-slate-50 relative overflow-hidden flex-shrink-0">
                          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#04152b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                          <div className="absolute inset-0 flex items-center justify-center flex-col z-10 px-6">
                            <div className="flex w-full items-center justify-between text-primary font-black text-2xl tracking-tighter">
                              <span>{booking.origin || "ORIG"}</span>
                              <div className="flex-1 px-4 flex items-center justify-center relative">
                                <div className="w-full h-px bg-outline-variant/50 border-dashed border-t border-outline-variant absolute"></div>
                                <Plane size={20} className="text-primary relative z-10 bg-slate-50 px-1" />
                              </div>
                              <span>{booking.destination || "DEST"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Booking PNR</p>
                              <p className="font-mono text-lg font-bold text-primary">{booking.pnr || "PENDING"}</p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                              <Calendar size={16} className="text-outline" />
                              <span className="font-semibold text-sm">{flightDate.toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock size={16} className="text-outline" />
                              <span className="font-semibold text-sm">{flightDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-dashed border-outline-variant/50 flex items-center justify-between">
                            <span className="text-xs font-bold text-outline uppercase tracking-wider">{booking.passengers?.length || 1} Passenger(s)</span>
                            <span className="text-primary font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">Details <ChevronRight size={16} /></span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bus Bookings Section */}
            {busBookings.length > 0 && (
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <Bus className="text-secondary" size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-primary font-['Plus_Jakarta_Sans'] tracking-tight">Bus Reservations</h2>
                  </div>
                  {/* Bus Filter Chips */}
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {[
                      { id: 'all', label: 'All Bookings' },
                      { id: 'booked', label: 'Booked' },
                      { id: 'cancelled', label: 'Cancelled' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setBusFilter(f.id)}
                        className={`h-9 px-5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${busFilter === f.id
                          ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredBuses.length > 0 ? (
                    filteredBuses.map((booking, idx) => {
                      const instanceDetails = busDetailsMap[booking.bus_instance_id];
                      const busDate = new Date(instanceDetails?.departure_at || booking.departure_time || booking.booked_at || booking.created_at);
                      const arrivalDate = instanceDetails?.arrival_at ? new Date(instanceDetails.arrival_at) : (booking.arrival_time ? new Date(booking.arrival_time) : null);

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => router.push(`/buses/confirmation?booking_id=${booking.id}`)}
                          className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col md:flex-row cursor-pointer group"
                        >
                          <div className="p-8 flex-grow">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <p className="text-2xl font-bold text-primary mb-1 font-['Plus_Jakarta_Sans']">
                                  {busDetailsMap[booking.bus_instance_id]?.bus?.operator?.name || booking.operator_name || 'Bus Operator'}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-black tracking-widest uppercase">
                                    {busDetailsMap[booking.bus_instance_id]?.bus?.bus_number || 'BUS'}
                                  </span>
                                  <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-black">
                                    {busDetailsMap[booking.bus_instance_id]?.bus?.bus_type?.name || booking.bus_type || 'A/C Sleeper'}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="flex items-center justify-between mb-8 relative">
                              <div className="flex flex-col">
                                <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                                  {busDetailsMap[booking.bus_instance_id]?.departure_at 
                                    ? new Date(busDetailsMap[booking.bus_instance_id].departure_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
                                    : busDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}
                                </span>
                                <span className="text-sm font-bold text-on-surface mt-1">
                                  {busDetailsMap[booking.bus_instance_id]?.bus?.origin_stop?.city || booking.origin || 'Origin'}
                                </span>
                              </div>

                              <div className="flex-grow flex flex-col items-center px-8">
                                <span className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Route</span>
                                <div className="w-full h-[2px] bg-outline-variant/30 relative">
                                  <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-outline-variant"></div>
                                  <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-secondary"></div>
                                </div>
                                <Bus className="text-outline-variant mt-3" size={20} />
                              </div>

                              <div className="flex flex-col text-right">
                                <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
                                  {busDetailsMap[booking.bus_instance_id]?.arrival_at 
                                    ? new Date(busDetailsMap[booking.bus_instance_id].arrival_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
                                    : (arrivalDate ? arrivalDate.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) : '--:--')}
                                </span>
                                <span className="text-sm font-bold text-on-surface mt-1">
                                  {busDetailsMap[booking.bus_instance_id]?.bus?.destination_stop?.city || booking.destination || 'Destination'}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-dashed border-outline-variant/50">
                              <div>
                                <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Date</p>
                                <p className="text-sm font-bold">{busDate.toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Seat(s)</p>
                                <p className="text-sm font-bold">{booking.passengers?.map(p => p.seat_number).join(', ') || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Booking ID</p>
                                <p className="text-sm font-bold font-mono">{booking.pnr || (booking.id && booking.id.toString().slice(0, 8).toUpperCase()) || 'N/A'}</p>
                              </div>
                              <div className="flex items-end justify-end md:justify-start">
                                <button className="text-secondary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                  View Ticket <ChevronRight size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-20 px-6 border border-dashed border-outline-variant/30 rounded-3xl text-center bg-white/50"
                    >
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bus className="text-slate-300" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-primary font-['Plus_Jakarta_Sans'] mb-1">No Bookings Found</h3>
                      <p className="text-on-surface-variant font-light text-sm">You don't have any {busFilter} bus bookings at the moment.</p>
                    </motion.div>
                  )}
                </div>
              </section>
            )}

            {/* Support Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-primary rounded-3xl p-10 text-white relative overflow-hidden flex flex-col justify-center shadow-xl shadow-primary/10">
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-3 font-['Plus_Jakarta_Sans']">Upgrade your travel</h3>
                  <p className="text-white/70 mb-8 max-w-sm font-light">Get access to premium lounges and priority boarding on your next trip.</p>
                  <button className="bg-secondary text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-secondary/20">Explore Prime</button>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 pointer-events-none">
                  <CheckCircle2 size={240} />
                </div>
              </div>
              <div className="bg-white rounded-3xl p-10 flex flex-col justify-between border border-outline-variant/30 shadow-sm">
                <div>
                  <AlertCircle className="text-secondary mb-4" size={32} />
                  <h4 className="font-bold text-primary text-xl">Need Help?</h4>
                  <p className="text-sm text-on-surface-variant mt-2 font-light">Our support is available 24/7 for your transport bookings.</p>
                </div>
                <button className="text-secondary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mt-8 hover:gap-3 transition-all">
                  Contact Us <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border border-outline-variant/20"
          >
            <div className="flex items-center gap-4 text-red-600 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold text-primary tracking-tight">Cancel Booking?</h3>
            </div>
            <p className="text-on-surface-variant mb-10 leading-relaxed font-light">
              Are you sure you want to cancel this {cancelType} booking? This action cannot be undone, and cancellation fees may apply.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                className="flex-1 py-4 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-outline bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-4 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                Yes, Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

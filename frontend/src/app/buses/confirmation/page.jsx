'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore, useAuthStore } from '@/lib/store';
import { busApi } from '@/lib/busApi';

export default function BusConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const busActiveBooking = useBookingStore(state => state.busActiveBooking);
  const activeBooking = useBookingStore(state => state.activeBooking);
  const user = useAuthStore(state => state.user);
  const clearBusBookingFlow = useBookingStore(state => state.clearBusBookingFlow);

  const [bookingData, setBookingData] = useState(busActiveBooking || activeBooking);
  const [busDetails, setBusDetails] = useState(null);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [eTicket, setETicket] = useState(null);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState(1); // 1: confirm, 2: reason
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchAllDetails = async () => {
      const id = bookingId || bookingData?.id;
      if (!id) {
        if (bookingData) setLoading(false);
        else setTimeout(() => { if (!bookingId && !useBookingStore.getState().busActiveBooking) setLoading(false); }, 1000);
        return;
      }

      try {
        setLoading(true);
        // 1. Get Booking Details
        const rawBooking = await busApi.getBookingById(id);
        const booking = rawBooking?.booking || rawBooking?.data || rawBooking;
        setBookingData(booking);

        const instanceId = booking?.bus_instance_id || booking?.bus_instance?.id;

        // 2. Fetch Ticket (QR) immediately
        busApi.getTicket(id).then(setETicket).catch(err => console.error('Ticket fetch failed:', err));

        if (instanceId) {
          // 3. Get Bus, Boarding and Dropping Details in parallel for exact times
          const [details, bPoints, dPoints] = await Promise.all([
            busApi.getBusDetails(instanceId).catch(() => null),
            busApi.getBoardingPoints(instanceId).catch(() => []),
            busApi.getDroppingPoints(instanceId).catch(() => [])
          ]);

          if (details) setBusDetails(details?.data || details);
          setBoardingPoints(Array.isArray(bPoints) ? bPoints : bPoints?.data || []);
          setDroppingPoints(Array.isArray(dPoints) ? dPoints : dPoints?.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [bookingId, bookingData?.id]);

  const selectedBoarding = useMemo(() => {
    if (!bookingData || !boardingPoints.length) return null;
    const bId = bookingData.boarding_point_id || (bookingData.boarding_point?.id);
    // The backend string boarding_point doesn't have an ID, so we need to match carefully
    // If the booking response has boarding_point_id (it should if mapped correctly), use it.
    return boardingPoints.find(p => String(p.id) === String(bId)) || boardingPoints[0];
  }, [bookingData, boardingPoints]);

  const selectedDropping = useMemo(() => {
    if (!bookingData || !droppingPoints.length) return null;
    const dId = bookingData.dropping_point_id || (bookingData.dropping_point?.id);
    return droppingPoints.find(p => String(p.id) === String(dId)) || droppingPoints[droppingPoints.length - 1];
  }, [bookingData, droppingPoints]);

  const handleCancelBooking = async () => {
    if (!bookingData?.id || !cancelReason) return;
    setIsCancelling(true);
    try {
      const res = await busApi.cancelBooking(bookingData.id, cancelReason);
      const updated = res?.data || res;
      setBookingData(prev => ({ ...prev, ...updated }));
      setShowCancelModal(false);
      // Refresh ticket to show refund info
      const ticket = await busApi.getTicket(bookingData.id);
      setETicket(ticket);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      router.replace('/');
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, [router]);

  if (loading) {
    return (
      <main className="pt-40 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-outline">Synchronizing Ticket Details...</p>
      </main>
    );
  }

  if (!bookingData) {
    return (
      <main className="pt-32 px-6 md:px-12 max-w-[900px] mx-auto text-center">
        <h1 className="text-4xl font-headline text-primary mb-6">Reservation Not Found</h1>
        <button onClick={() => router.push('/buses')} className="bg-primary text-white px-10 py-4 font-label text-xs uppercase tracking-widest">
          Start New Search
        </button>
      </main>
    );
  }

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) : '--:--';
  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) : 'N/A';

  const isCancelled = bookingData.status === 'CANCELLED';

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-32 md:pb-20 pt-24 font-['Plus_Jakarta_Sans']">
      <main className="max-w-[1280px] mx-auto p-4 md:p-8">
        <div className="flex justify-start mb-8">
          <button
            onClick={() => { clearBusBookingFlow(); router.push('/trips'); }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-outline hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to My Trips
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-dashed border-gray-100 relative">
                {isCancelled && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] border-8 border-red-500/20 text-red-500/20 px-12 py-4 text-6xl font-black rounded-3xl pointer-events-none select-none z-0">
                    CANCELLED
                  </div>
                )}

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-primary tracking-tight">{bookingData.operator_name || busDetails?.bus?.operator?.name || 'Bus Operator'}</h2>
                    <p className="text-sm text-on-surface-variant mt-1 font-medium">{bookingData.bus_type || busDetails?.bus?.bus_type?.name || 'A/C Sleeper'}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-surface-container-high text-on-surface-variant px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase">
                      {bookingData.pnr || 'TNEO'}
                    </span>
                    <p className="mt-2 text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-50">BOOKING ID</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-4 relative z-10">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Departure</p>
                    <h3 className="text-4xl font-black text-primary tracking-tighter">
                      {formatTime(selectedBoarding?.pickup_time || bookingData.departure_at)}
                    </h3>
                    <p className="text-lg font-bold text-on-surface mt-1">{selectedBoarding?.city || bookingData.origin || 'Origin'}</p>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">{selectedBoarding?.stop_name || bookingData.boarding_point || 'Boarding Station'}</p>
                    <p className="text-[10px] font-black text-outline-variant mt-2 uppercase tracking-widest">
                      {formatDate(selectedBoarding?.pickup_time || bookingData.departure_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-shrink-0 w-full md:w-auto">
                    <span className="material-symbols-outlined text-secondary text-2xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
                    <span className="text-[10px] font-black text-on-secondary-container bg-secondary-container/50 px-4 py-1.5 rounded-full uppercase tracking-widest">
                      {busDetails?.duration || 'Journey'}
                    </span>
                  </div>

                  <div className="flex-1 text-left md:text-right">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Arrival</p>
                    <h3 className="text-4xl font-black text-primary tracking-tighter">
                      {formatTime(selectedDropping?.drop_time || bookingData.arrival_at)}
                    </h3>
                    <p className="text-lg font-bold text-on-surface mt-1">{selectedDropping?.city || bookingData.destination || 'Destination'}</p>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">{selectedDropping?.stop_name || bookingData.dropping_point || 'Dropping Station'}</p>
                    <p className="text-[10px] font-black text-outline-variant mt-2 uppercase tracking-widest">
                      {formatDate(selectedDropping?.drop_time || bookingData.arrival_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6">Passenger Details</h4>
                  <div className="space-y-6">
                    {bookingData.passengers?.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-5 group">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                          <span className="material-symbols-outlined text-2xl">person</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-on-surface tracking-tight">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mt-0.5">
                            {p.passenger_type?.toUpperCase()} · Seat {p.seat_number}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-12">
                  <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    {eTicket?.qr_code_url ? (
                      <img alt="Ticket QR Code" className="w-32 h-32" src={eTicket.qr_code_url} />
                    ) : (
                      <div className="w-32 h-32 bg-slate-50 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-slate-200 text-4xl">qr_code_2</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Scan at Boarding</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h4 className="text-xl font-bold text-primary tracking-tight mb-6">Fare Breakdown</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Base Fare</span>
                  <span className={`text-on-surface font-bold ${isCancelled ? 'line-through opacity-50' : ''}`}>
                    ₹{(bookingData.base_fare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Taxes (GST)</span>
                  <span className={`text-on-surface font-bold ${isCancelled ? 'line-through opacity-50' : ''}`}>
                    ₹{(bookingData.taxes || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {bookingData.service_fee > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Service Fee</span>
                    <span className={`text-on-surface font-bold ${isCancelled ? 'line-through opacity-50' : ''}`}>
                      ₹{bookingData.service_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-dashed border-gray-100 flex justify-between items-center">
                  <span className="text-base font-bold text-on-surface uppercase tracking-wider">Total Amount Paid</span>
                  <span className={`text-3xl font-black text-secondary tracking-tighter ${isCancelled ? 'line-through opacity-50' : ''}`}>
                    ₹{(bookingData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isCancelled && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-6 bg-emerald-50 rounded-2xl border border-emerald-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Refund Amount</span>
                      <span className="text-2xl font-black text-emerald-600">₹{(bookingData.refund_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Refund Status</span>
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                        {bookingData.refund_status || 'PENDING'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm p-8">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-6">Booking Actions</h4>
              <div className="space-y-4">
                {!isCancelled && (
                  <button
                    onClick={() => { setCancelStep(1); setShowCancelModal(true); }}
                    className="w-full border border-red-100 text-red-500 font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-red-50 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">cancel</span>
                    Cancel Booking
                  </button>
                )}

                  <button
                    onClick={() => {
                      const instanceId = bookingData.bus_instance_id || bookingData.bus_instance?.id;
                      router.push(`/buses/tracker?pnr=${bookingData.pnr}${instanceId ? `&instance_id=${instanceId}` : ''}`);
                    }}
                    className="w-full bg-[#04152b] text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                  >
                  <span className="material-symbols-outlined text-xl">my_location</span>
                  Track Bus
                </button>
              </div>
            </div>

            <div className="bg-surface-container-low border border-gray-100 rounded-2xl p-8">
              <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-5">Cancellation Policy</h4>
              <ul className="space-y-4">
                {[{ time: 'Standard Refund Policy 120 hours', fee: '90% Fee' },{ time: 'Mid-tier Refund Policy 48 hours', fee: '60% Fee' }, { time: 'Last Minute Refund Policy  24 hours', fee: '25% Fee' }, { time: 'No Refund Policy 0-24 hours', fee: 'No Refund' }].map((item, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">{item.time}</span>
                    <span className="text-xs font-bold text-secondary">{item.fee}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-[480px] rounded-[2.5rem] shadow-2xl p-10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16"></div>

              <div className="relative z-10">
                {cancelStep === 1 ? (
                  <>
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-8">
                      <span className="material-symbols-outlined text-4xl">warning</span>
                    </div>
                    <h3 className="text-3xl font-black text-primary tracking-tighter mb-4">Cancel Booking?</h3>
                    <p className="text-on-surface-variant font-medium leading-relaxed mb-10">
                      Are you sure you want to cancel your journey? This action cannot be undone and cancellation charges may apply as per policy.
                    </p>
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => setCancelStep(2)}
                        className="w-full bg-red-500 text-white font-bold py-5 rounded-2xl hover:brightness-110 transition-all active:scale-98"
                      >
                        Confirm Cancellation
                      </button>
                      <button
                        onClick={() => setShowCancelModal(false)}
                        className="w-full bg-slate-50 text-primary font-bold py-5 rounded-2xl hover:bg-slate-100 transition-all"
                      >
                        Keep My Booking
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mb-8">
                      <span className="material-symbols-outlined text-4xl">edit_note</span>
                    </div>
                    <h3 className="text-3xl font-black text-primary tracking-tighter mb-4">Reason for Cancellation</h3>
                    <p className="text-on-surface-variant font-medium mb-8 text-sm">Please provide a reason to help us improve our service.</p>

                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Changed my plans, Medical emergency..."
                      className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 focus:border-primary focus:outline-none transition-all mb-8 font-medium text-primary placeholder:text-outline-variant/50"
                    />

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={handleCancelBooking}
                        disabled={!cancelReason || isCancelling}
                        className="w-full bg-primary text-white font-bold py-5 rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isCancelling && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {isCancelling ? 'Processing...' : 'Finalize Cancellation'}
                      </button>
                      <button
                        onClick={() => setCancelStep(1)}
                        className="w-full bg-slate-50 text-primary font-bold py-5 rounded-2xl hover:bg-slate-100 transition-all"
                      >
                        Go Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useBookingStore, useAuthStore } from '@/lib/store';
import { busApi } from '@/lib/busApi';
import { useBusSocket } from '@/hooks/useBusSocket';
import BusSessionExpiryModal from '@/components/buses/BusSessionExpiryModal';

export default function BusPassengerDetailsPage() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const busSelectedInstance = useBookingStore(state => state.busSelectedInstance);
  const selectedFare = useBookingStore(state => state.selectedFare);
  const busSelectedFare = useBookingStore(state => state.busSelectedFare);
  const busSelectedSeats = useBookingStore(state => state.busSelectedSeats);
  const busSearchQuery = useBookingStore(state => state.busSearchQuery);
  const setBusActiveBooking = useBookingStore(state => state.setBusActiveBooking);
  const setActiveBooking = useBookingStore(state => state.setActiveBooking);

  const busBoardingPoint = useBookingStore(state => state.busBoardingPoint);
  const busDroppingPoint = useBookingStore(state => state.busDroppingPoint);
  const setBusBoardingPoint = useBookingStore(state => state.setBusBoardingPoint);
  const setBusDroppingPoint = useBookingStore(state => state.setBusDroppingPoint);

  const activeFare = busSelectedFare || selectedFare;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);

  useBusSocket(user?.id, (msg) => {
    if (msg.type === 'SESSION_EXPIRED' || msg.event === 'SESSION_EXPIRED') {
      setShowExpiryModal(true);
    }
  });

  useEffect(() => { 
    setMounted(true); 
    if (busSelectedInstance?.id) {
      const fetchPoints = async () => {
        try {
          const [bp, dp] = await Promise.all([
            busApi.getBoardingPoints(busSelectedInstance.id),
            busApi.getDroppingPoints(busSelectedInstance.id)
          ]);
          setBoardingPoints(bp);
          setDroppingPoints(dp);
          if (bp.length > 0 && !busBoardingPoint) setBusBoardingPoint(bp[0]);
          if (dp.length > 0 && !busDroppingPoint) setBusDroppingPoint(dp[dp.length - 1]);
        } catch (err) {
          console.error("Failed to fetch points", err);
        }
      };
      fetchPoints();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busSelectedInstance]);

  const adults = busSearchQuery?.adults || 1;
  const children = busSearchQuery?.children || 0;
  const infants = busSearchQuery?.infants || 0;

  const initialTravelers = useMemo(() => {
    const arr = [];
    for (let i = 0; i < adults; i++) arr.push({ type: 'adult', first_name: '', last_name: '', dob: '', gender: 'male', id_type: 'PASSPORT', id_number: '' });
    for (let i = 0; i < children; i++) arr.push({ type: 'child', first_name: '', last_name: '', dob: '', gender: 'male', id_type: 'PASSPORT', id_number: '' });
    for (let i = 0; i < infants; i++) arr.push({ type: 'infant', first_name: '', last_name: '', dob: '', gender: 'male', id_type: 'PASSPORT', id_number: '' });
    return arr;
  }, [adults, children, infants]);

  const [travelers, setTravelers] = useState(initialTravelers);

  const updateTraveler = (index, field, value) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!busSelectedInstance?.id) {
      setError('No bus selected. Please restart your search.');
      return;
    }
    if (!activeFare) {
      setError('No fare selected. Please choose a fare first.');
      return;
    }
    if (!busBoardingPoint || !busDroppingPoint) {
      setError('Please select both boarding and dropping points.');
      return;
    }

    const { isAuthenticated, setAuthModalOpen } = useAuthStore.getState();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let seatIdx = 0;
      const passengersPayload = travelers.map((t) => {
        const p = {
          first_name: t.first_name,
          last_name: t.last_name,
          date_of_birth: t.dob,
          gender: t.gender.toLowerCase(),
          passenger_type: t.type === 'infant' ? 'child' : t.type.toLowerCase(),
          id_type: t.id_type,
          id_number: t.id_number,
        };

        if (t.type !== 'infant' && busSelectedSeats[seatIdx]) {
          const seatId = busSelectedSeats[seatIdx].id || busSelectedSeats[seatIdx].seat_id;
          if (seatId) p.seat_id = seatId;
          seatIdx++;
        }

        return p;
      });

      const payload = {
        bus_instance_id: busSelectedInstance.id,
        fare_type_id: activeFare.id || activeFare.fare_type_id,
        boarding_point_id: busBoardingPoint.id,
        dropping_point_id: busDroppingPoint.id,
        passengers: passengersPayload,
      };

      const bookingResponse = await busApi.createBooking(payload);
      const booking = bookingResponse;
      setBusActiveBooking(booking);
      setActiveBooking(booking); // shared reference for review page
      router.push('/buses/review');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Booking failed. Please check all fields and try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (mounted && !busSelectedInstance) {
    return (
      <main className="pt-32 px-6 md:px-12 max-w-[900px] mx-auto text-center">
        <h1 className="text-3xl font-headline text-primary mb-4">Session Expired</h1>
        <p className="text-on-surface-variant mb-8">Your bus or fare selection is missing. Please start a new search.</p>
        <button
          onClick={() => router.push('/buses')}
          className="bg-primary text-white px-8 py-3 rounded-lg font-label text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
        >
          Search Buses
        </button>
      </main>
    );
  }

  return (
    <main className="pt-24 md:pt-40 pb-32 px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-20">

      <div className="w-full lg:w-[60%] space-y-20">
        <section className="space-y-6">
          <span className="text-secondary font-label text-xs font-bold uppercase tracking-[0.4em] block">Step 04 — Traveler Information</span>
          <h1 className="text-5xl md:text-7xl font-headline font-normal tracking-tight text-primary leading-tight">
            Who is <span className="italic font-light">traveling?</span>
          </h1>
          <p className="text-on-surface-variant text-lg font-light max-w-xl">
            Please enter passenger names exactly as they appear on official travel documents to ensure a smooth journey.
          </p>
        </section>

        <form onSubmit={handleContinue} className="space-y-16">
          {/* Boarding & Dropping Points Section */}
          <section className="bg-surface-container-low p-10 editorial-shadow space-y-12 border border-outline-variant/10">
             <h2 className="text-2xl font-headline text-primary">Route Access Points</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline">Boarding Point</label>
                  <select 
                    className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary font-headline text-lg text-primary appearance-none cursor-pointer py-2"
                    value={busBoardingPoint?.id || ''}
                    onChange={(e) => setBusBoardingPoint(boardingPoints.find(p => p.id === e.target.value))}
                  >
                    {boardingPoints.map(p => (
                      <option key={p.id} value={p.id}>{p.stop_name} ({new Date(p.pickup_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</option>
                    ))}
                  </select>
                  {busBoardingPoint?.landmark && <p className="text-[10px] text-outline/60 italic">Landmark: {busBoardingPoint.landmark}</p>}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline text-right block">Dropping Point</label>
                  <select 
                    className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary font-headline text-lg text-primary appearance-none cursor-pointer py-2 text-right"
                    value={busDroppingPoint?.id || ''}
                    onChange={(e) => setBusDroppingPoint(droppingPoints.find(p => p.id === e.target.value))}
                  >
                    {droppingPoints.map(p => (
                      <option key={p.id} value={p.id}>{p.stop_name} ({new Date(p.drop_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</option>
                    ))}
                  </select>
                  {busDroppingPoint?.landmark && <p className="text-[10px] text-outline/60 italic text-right">Landmark: {busDroppingPoint.landmark}</p>}
                </div>
             </div>
          </section>

          {travelers.map((traveler, index) => {
            let seatNumber = '--';
            if (traveler.type !== 'infant') {
              const nonInfantIdx = travelers.slice(0, index).filter(t => t.type !== 'infant').length;
              seatNumber = busSelectedSeats[nonInfantIdx]?.seat_number || '--';
            }

            return (
              <section key={index} className="bg-surface-container-lowest p-10 editorial-shadow space-y-12 border border-outline-variant/10">
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-8">
                  <h2 className="text-2xl font-headline text-primary">
                    Traveler {index + 1} ({traveler.type.charAt(0).toUpperCase() + traveler.type.slice(1)})
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-label font-bold text-secondary uppercase tracking-widest">
                      {traveler.type === 'infant' ? 'In-Lap' : `Seat ${seatNumber}`}
                    </p>
                    <span className="material-symbols-outlined text-secondary text-3xl">
                      {traveler.type === 'infant' ? 'child_care' : 'person'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {[
                    { label: 'Given Name', field: 'first_name', placeholder: 'John', type: 'text' },
                    { label: 'Surname', field: 'last_name', placeholder: 'Doe', type: 'text' },
                    { label: 'Date of Birth', field: 'dob', placeholder: '', type: 'date' },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field} className="space-y-2 group">
                      <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline group-focus-within:text-secondary transition-colors">{label}</label>
                      <input
                        required
                        className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary transition-all px-0 py-3 font-headline text-xl text-primary placeholder:text-outline-variant/50"
                        placeholder={placeholder}
                        type={type}
                        value={traveler[field]}
                        onChange={(e) => updateTraveler(index, field, e.target.value)}
                      />
                    </div>
                  ))}

                  <div className="space-y-2 group">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline group-focus-within:text-secondary transition-colors">Gender</label>
                    <select
                      className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary transition-all px-0 py-3 font-headline text-xl text-primary appearance-none cursor-pointer"
                      value={traveler.gender}
                      onChange={(e) => updateTraveler(index, 'gender', e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline group-focus-within:text-secondary transition-colors">ID Type</label>
                    <select
                      className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary transition-all px-0 py-3 font-headline text-xl text-primary appearance-none cursor-pointer"
                      value={traveler.id_type}
                      onChange={(e) => updateTraveler(index, 'id_type', e.target.value)}
                    >
                      <option value="PASSPORT">Passport</option>
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                    </select>
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-outline group-focus-within:text-secondary transition-colors">Identification Number</label>
                    <input
                      required
                      className="w-full bg-transparent border-none border-b border-outline-variant/30 focus:ring-0 focus:border-secondary transition-all px-0 py-3 font-headline text-xl text-primary placeholder:text-outline-variant/50"
                      placeholder="Enter Document ID"
                      type="text"
                      value={traveler.id_number}
                      onChange={(e) => updateTraveler(index, 'id_number', e.target.value)}
                    />
                  </div>
                </div>
              </section>
            );
          })}

          <button
            type="submit"
            disabled={loading}
            className={`group w-full md:w-auto bg-primary text-white px-20 py-6 font-label text-xs font-black uppercase tracking-[0.4em] hover:bg-secondary hover:text-on-secondary-fixed-variant transition-all duration-500 flex items-center justify-center gap-4 ${loading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {loading ? 'Preparing your booking...' : 'Confirm All Details'}
            {!loading && <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">east</span>}
          </button>
        </form>
      </div>

      {/* Summary Sidebar */}
      <aside className="w-full lg:w-[40%]">
        <div className="sticky top-32 space-y-10">
          <div className="bg-surface-container-low p-10 editorial-shadow space-y-10">
            <h3 className="font-headline text-3xl">Booking Summary</h3>

            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-2">Itinerary</p>
                  <p className="font-headline text-2xl text-primary">{busSelectedInstance?.bus?.origin_stop?.city || busSelectedInstance?.origin} to {busSelectedInstance?.bus?.destination_stop?.city || busSelectedInstance?.destination}</p>
                  <p className="text-sm font-light text-on-surface-variant mt-1">{busSelectedInstance?.bus?.operator?.name || 'Bus Operator'} · {busSelectedInstance?.bus?.bus_number || busSelectedInstance?.bus_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Selected Fare</p>
                  <p className="font-headline text-xl text-primary">{activeFare?.name || activeFare?.seat_class}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-y border-outline-variant/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-2">Bus Type</p>
                  <p className="font-headline text-xl text-primary">{activeFare?.seat_class || busSelectedInstance?.bus_type || 'AC'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-2">Seats Assigned</p>
                  <p className="font-headline text-xl text-secondary">
                    {busSelectedSeats?.length > 0 ? busSelectedSeats.map(s => s.seat_number).join(', ') : '--'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-light">Base Fares ({travelers.length} Travelers)</span>
                  <span className="text-primary font-medium">₹{((activeFare?.price || 0) * travelers.length).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-light">Seat Fees</span>
                  <span className="text-primary font-medium">₹{(busSelectedSeats?.reduce((acc, s) => acc + (s.extra_charge || 0), 0) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-6 border-t border-outline-variant/20">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary">Total Amount</span>
                  <span className="text-5xl font-headline text-primary tracking-tighter">
                    ₹{((activeFare?.price || 0) * travelers.length + (busSelectedSeats?.reduce((acc, s) => acc + (s.extra_charge || 0), 0) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error/5 border border-error/10 text-error text-xs font-bold text-center">
                {error}
              </div>
            )}
          </div>

          <div className="p-10 border border-outline-variant/10 space-y-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">verified_user</span>
              <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Travel Assurance</p>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed font-light">
              Your booking is protected by our fulfillment engine. Seats are held for a limited duration during this booking phase.
            </p>
          </div>
        </div>
      </aside>

      <BusSessionExpiryModal isOpen={showExpiryModal} onClose={() => setShowExpiryModal(false)} />
    </main>
  );
}


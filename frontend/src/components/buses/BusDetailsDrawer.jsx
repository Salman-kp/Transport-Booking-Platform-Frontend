'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { busApi } from '@/lib/busApi';
import { useAuthStore, useBookingStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Search, Icon } from 'lucide-react';
import { steeringWheel } from '@lucide/lab';

/**
 * SeatIcon - A realistic representation of a bus seat (Seater or Sleeper).
 */
function SeatIcon({ seat, type, onSelect, selected, genderCategory, price }) {
  if (!seat) return <div className={`w-8 h-8 opacity-0`} />;

  const isBooked = !seat.is_available;
  const isSleeper = type === 'SLEEPER';
  const isLadies = genderCategory === 'WOMEN';
  const isMen = genderCategory === 'MEN';

  // Dynamic styling
  let borderColor = 'border-green-600';
  let bgColor = 'bg-white';
  let iconColor = 'text-green-600';

  if (selected) {
    borderColor = 'border-green-600';
    bgColor = 'bg-green-600';
    iconColor = 'text-white';
  } else if (isBooked) {
    borderColor = 'border-gray-200';
    bgColor = 'bg-gray-100';
    iconColor = 'text-gray-300';
  } else if (isLadies) {
    borderColor = 'border-pink-500';
    iconColor = 'text-pink-500';
  } else if (isMen) {
    borderColor = 'border-blue-500';
    iconColor = 'text-blue-500';
  }

  return (
    <button
      onClick={() => !isBooked && onSelect(seat)}
      disabled={isBooked}
      className={`flex flex-col items-center gap-1 group transition-all active:scale-95 ${isBooked ? 'cursor-not-allowed opacity-80' : 'hover:-translate-y-0.5'}`}
      title={`${seat.seat_number} - ${seat.category}`}
    >
      <div className={`relative ${isSleeper ? 'w-8 h-14' : 'w-8 h-8'} border-2 rounded-lg transition-all flex items-center justify-center shadow-sm ${borderColor} ${bgColor}`}>
        {isBooked ? (
          <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Sold</span>
        ) : (
          <div className="flex items-center justify-center">
            {isLadies || isMen || isSleeper ? (
              <span className={`material-symbols-outlined ${isSleeper ? 'text-lg' : 'text-sm'} ${iconColor}`}>
                {isLadies ? 'person_3' : 'person'}
              </span>
            ) : (
              <div className={`w-4 h-4 border-b-2 rounded-sm ${selected ? 'border-white/40' : 'border-gray-200'}`} />
            )}
          </div>
        )}

        {selected && (
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
        )}
      </div>
      <span className={`text-[8px] font-black transition-colors tracking-tighter ${selected ? 'text-green-700' : 'text-gray-500'}`}>
        ₹{price}
      </span>
      <span className="text-[7px] font-bold text-gray-400 uppercase">{seat.seat_number}</span>
    </button>
  );
}

/**
 * BusDetailsDrawer - A slide-up drawer for bus details.
 */
export default function BusDetailsDrawer({ isOpen, onClose, bus }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('Select seats');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // --- Shared Booking State (Defined first to avoid ReferenceErrors) ---
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [boardingPoint, setBoardingPoint] = useState(null);
  const [droppingPoint, setDroppingPoint] = useState(null);
  const [passengersData, setPassengersData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const setBusActiveBooking = useBookingStore(state => state.setBusActiveBooking);
  const setActiveBooking = useBookingStore(state => state.setActiveBooking);
  const setBusSelectedInstance = useBookingStore(state => state.setBusSelectedInstance);
  const router = useRouter();

  // --- Exact Time/Date Formatters (No Timezone Shifting) ---
  const fmt24 = (iso) => {
    if (!iso) return '--:--';
    if (typeof iso !== 'string') return iso;
    if (iso.includes('T')) return iso.split('T')[1].substring(0, 5);
    return iso.substring(0, 5);
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    if (typeof iso !== 'string') return iso;
    if (iso.includes('T')) {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso.split('T')[0];

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Using UTC methods ensures we show exactly what the backend sent without local shifting
      const dayName = days[d.getUTCDay()];
      const dayNum = String(d.getUTCDate()).padStart(2, '0');
      const monthName = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();

      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
    return iso;
  };

  // Prevention for accidental refresh/navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (selectedSeats.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedSeats.length]);

  const handleCloseAttempt = () => {
    if (selectedSeats.length > 0) {
      setShowBackWarning(true);
    } else {
      onClose();
    }
  };

  const handleTabChange = (tab) => {
    if (tab === 'Board/Drop point' && selectedSeats.length === 0) {
      setErrorMessage('Please select a seat first to proceed');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (tab === 'Passenger Info' && selectedSeats.length === 0) {
      setErrorMessage('Please select a seat first to proceed');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (tab === 'Passenger Info' && (!boardingPoint || !droppingPoint)) {
      setErrorMessage('Select boarding and dropping points to continue');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setActiveTab(tab);
    setErrorMessage(null);
  };

  const handlePassengerChange = (seatId, field, value) => {
    setPassengersData(prev => ({
      ...prev,
      [seatId]: {
        ...(prev[seatId] || {}),
        [field]: value
      }
    }));
  };

  // --- Data State ---
  const [seats, setSeats] = useState([]);
  const [fares, setFares] = useState([]);
  const [seatLayout, setSeatLayout] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('policies');

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (isSubmitting) return;

    // Validate that all fields are filled inline
    const errors = {};
    let hasError = false;

    for (let i = 0; i < selectedSeats.length; i++) {
      const seat = selectedSeats[i];
      const p = passengersData[seat.seat_id] || {};
      const isMen = seat.category === 'MEN';
      const isWomen = seat.category === 'WOMEN';
      const resolvedGender = isMen ? 'MEN' : isWomen ? 'WOMEN' : p.gender;

      const seatErrors = {};
      const nameRegex = /^[A-Za-z\s]+$/;
      const minDob = new Date('1926-01-01');
      const maxDob = new Date();

      if (!p.first_name?.trim() || !nameRegex.test(p.first_name)) seatErrors.first_name = true;
      if (!p.last_name?.trim() || !nameRegex.test(p.last_name)) seatErrors.last_name = true;

      const pDob = p.date_of_birth ? new Date(p.date_of_birth) : null;
      if (!p.date_of_birth || (pDob && (pDob < minDob || pDob > maxDob))) seatErrors.date_of_birth = true;
      if (!resolvedGender) seatErrors.gender = true;
      if (!p.id_type) seatErrors.id_type = true;
      if (!p.id_number?.trim()) seatErrors.id_number = true;

      if (Object.keys(seatErrors).length > 0) {
        errors[seat.seat_id] = seatErrors;
        hasError = true;
      }
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsSubmitting(true);

    // Construct payload according to backend API requirements
    const payload = {
      bus_instance_id: bus.id,
      fare_type_id: selectedSeats[0]?.fare_id, // Assuming same fare type for all, or handle accordingly
      boarding_point_id: boardingPoint?.id,
      dropping_point_id: droppingPoint?.id,
      passengers: selectedSeats.map(seat => {
        const p = passengersData[seat.seat_id] || {};
        const isMen = seat.category === 'MEN';
        const isWomen = seat.category === 'WOMEN';

        return {
          seat_id: seat.seat_id,
          first_name: p.first_name.trim(),
          last_name: p.last_name.trim(),
          date_of_birth: p.date_of_birth,
          gender: isMen ? 'MEN' : isWomen ? 'WOMEN' : (p.gender || 'MEN'),
          passenger_type: p.passenger_type || 'adult',
          id_type: p.id_type,
          id_number: p.id_number.trim()
        };
      })
    };

    try {
      // busApi.createBooking already unwraps to the booking object directly
      const booking = await busApi.createBooking(payload);
      console.log('Booking API response:', booking);

      if (booking && booking.id) {
        setBusActiveBooking(booking);
        setActiveBooking(booking);
        setBusSelectedInstance(bus);
        document.body.style.overflow = 'auto'; // Reset scroll lock from drawer
        router.push('/buses/review');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to create booking. Please try again.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Categorize Seats Memo (The Source of Truth) ---
  const categorizedSeats = useMemo(() => {
    if (!seats.length) return [];

    // Sort seats alphanumerically as fallback order
    const sorted = [...seats].sort((a, b) => {
      const matchA = a.seat_number.match(/(\d+)([a-zA-Z]*)/);
      const matchB = b.seat_number.match(/(\d+)([a-zA-Z]*)/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[1]);
        const numB = parseInt(matchB[1]);
        if (numA !== numB) return numA - numB;
        if (matchA[2] && matchB[2]) {
          return matchA[2].localeCompare(matchB[2]);
        }
      }
      return a.seat_number.localeCompare(b.seat_number);
    });

    return sorted.map(seat => {
      let seatPrice = seat.extra_charge || 0;
      let matchedFareId = null;

      // Fares logic
      if (seat.seat_type?.toLowerCase() === 'sleeper') {
        const flexi = fares.find(f => f.seat_type?.toLowerCase() === 'sleeper' && f.name?.toUpperCase() === 'FLEXI');
        const generalSleeper = fares.find(f => f.seat_type?.toLowerCase() === 'sleeper' && f.name?.toUpperCase() === 'GENERAL');
        const anySleeper = fares.find(f => f.seat_type?.toLowerCase() === 'sleeper');

        const fare = seat.berth_type?.toUpperCase() === 'LOWER'
          ? (flexi || generalSleeper || anySleeper)
          : (generalSleeper || flexi || anySleeper);

        if (fare) {
          seatPrice += fare.price;
          matchedFareId = fare.id;
        }
      } else {
        // Seater or semi_sleeper
        const fare = fares.find(f => f.name === 'GENERAL' && f.seat_type !== 'sleeper') || fares.find(f => f.name === 'GENERAL') || fares[0];
        if (fare) {
          seatPrice += fare.price;
          matchedFareId = fare.id;
        }
      }

      let parsedRow = null;
      let parsedLetter = null;
      // Match S1A, 1A, L1A etc.
      const match = seat.seat_number.match(/^([A-Za-z]*)(\d+)([A-Za-z]+)$/);
      if (match) {
        parsedRow = parseInt(match[2], 10);
        parsedLetter = match[3].toUpperCase();
      } else {
        // try another format like "12B"
        const match2 = seat.seat_number.match(/^(\d+)([A-Za-z]+)$/);
        if (match2) {
          parsedRow = parseInt(match2[1], 10);
          parsedLetter = match2[2].toUpperCase();
        }
      }

      return {
        ...seat,
        price: seatPrice || seat.price || 0,
        fare_id: matchedFareId,
        parsedRow,
        parsedLetter,
        category: seat.category || 'GENERAL'
      };
    });
  }, [seats, fares]);

  const decksToRender = useMemo(() => {
    const decks = [];
    const layout = seatLayout || bus?.bus?.bus_type?.seat_layout || {};
    const defaultConfig = { rows: 8, left_columns: 2, right_columns: 2 };

    // Use whatever layout config is available as a base
    const baseConfig = layout.sleeper || layout.seater || layout.semi_sleeper || defaultConfig;

    // Detect unique decks from actual data
    const uniqueDecks = ['LOWER', 'UPPER'].filter(d =>
      categorizedSeats.some(s => (s.berth_type?.toUpperCase() || 'LOWER') === d)
    );

    uniqueDecks.forEach(d => {
      const deckSeats = categorizedSeats.filter(s => (s.berth_type?.toUpperCase() || 'LOWER') === d);
      const isSleeperDeck = deckSeats.filter(s => s.seat_type?.toLowerCase() === 'sleeper').length > deckSeats.length / 2;

      decks.push({
        type: isSleeperDeck ? 'SLEEPER' : 'SEATER',
        config: (isSleeperDeck ? layout.sleeper : (layout.seater || layout.semi_sleeper)) || baseConfig,
        deck: d,
        label: d === 'LOWER' ? 'LOWER DECK' : 'UPPER DECK'
      });
    });

    if (decks.length === 0) {
      decks.push({ type: 'SEATER', config: defaultConfig, deck: 'LOWER', label: 'LAYOUT' });
    }

    return decks;
  }, [seatLayout, bus?.bus?.bus_type?.seat_layout, categorizedSeats]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setSelectedSeats([]); // Clear selection when drawer closes
      }, 300);
      document.body.style.overflow = 'auto';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !bus?.id) return;

    const fetchData = async () => {
      try {
        setLoadingSeats(true);
        const [seatsData, faresData, bPoints, dPoints, rData] = await Promise.all([
          busApi.getSeats(bus.id),
          busApi.getFares(bus.id),
          busApi.getBoardingPoints(bus.id),
          busApi.getDroppingPoints(bus.id),
          busApi.getRoute(bus.id)
        ]);

        const fetchedSeats = Array.isArray(seatsData) ? seatsData : seatsData?.seats || [];
        setSeats(fetchedSeats);
        setSeatLayout(seatsData?.seat_layout || null);

        const fetchedFares = Array.isArray(faresData) ? faresData : faresData?.data || faresData?.fares || [];
        setFares(fetchedFares);

        setBoardingPoints(Array.isArray(bPoints) ? bPoints : bPoints?.data || []);
        setDroppingPoints(Array.isArray(dPoints) ? dPoints : dPoints?.data || []);
        setRouteData(Array.isArray(rData) ? rData : rData?.data || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchData();
  }, [isOpen, bus?.id]);

  // Filter points by user's search
  const filteredBoardingPoints = useMemo(() => {
    if (!bus) return [];
    const origin = bus.origin?.toLowerCase() || '';
    return boardingPoints.filter(p =>
      p.city?.toLowerCase().includes(origin) ||
      p.stop_name?.toLowerCase().includes(origin) ||
      origin.includes(p.city?.toLowerCase())
    );
  }, [boardingPoints, bus?.origin]);

  const filteredDroppingPoints = useMemo(() => {
    if (!bus) return [];
    const dest = bus.destination?.toLowerCase() || '';
    return droppingPoints.filter(p =>
      p.city?.toLowerCase().includes(dest) ||
      p.stop_name?.toLowerCase().includes(dest) ||
      dest.includes(p.city?.toLowerCase())
    );
  }, [droppingPoints, bus?.destination]);

  // Removed auto-select useEffect to enforce manual selection of points

  const toggleSeat = (seat) => {
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.seat_number === seat.seat_number);
      if (isSelected) {
        return prev.filter(s => s.seat_number !== seat.seat_number);
      } else {
        // Enforce single fare_type_id per booking to match backend limitation
        if (prev.length > 0 && prev[0].fare_id !== seat.fare_id) {
          setErrorMessage('You can only book seats of the same fare type in a single booking.');
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }

        const selection = {
          seat_id: seat.id,
          seat_number: seat.seat_number,
          fare_id: seat.fare_id,
          bus_instance_id: bus.id,
          boarding_id: boardingPoint?.id || null,
          dropping_id: droppingPoint?.id || null,
          price: seat.price,
          category: seat.category || 'GENERAL'
        };
        return [...prev, selection];
      }
    });
  };

  if (!shouldRender || !bus) return null;

  const busInfo = bus.bus || {};
  const operatorName = busInfo.operator?.name || bus.operator_name || 'Bus Operator';

  // CSS for High-Visibility Slide Bar Scrollbar
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f8fafc;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
      border: 3px solid #f8fafc;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;

  return (
    <div className={`fixed top-16 md:top-20 inset-x-0 bottom-0 z-[45] flex flex-col transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <style>{scrollbarStyles}</style>
      <div className="flex-1 bg-black/10 backdrop-blur-[1px] absolute inset-0 -z-10" onClick={handleCloseAttempt} />

      <div className={`flex-1 bg-surface-bright shadow-[0_-8px_40px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-out transform ${isAnimating ? 'translate-y-0' : 'translate-y-full'}`}>

        <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-30">
          <button onClick={handleCloseAttempt} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-primary border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-black text-primary uppercase tracking-tight truncate">
                {bus.origin || bus.bus?.origin_stop?.city || 'Origin'}
              </h2>
              <span className="material-symbols-outlined text-xs text-outline">trending_flat</span>
              <h2 className="text-[15px] font-black text-primary uppercase tracking-tight truncate">
                {bus.destination || bus.bus?.destination_stop?.city || 'Destination'}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] font-bold text-outline truncate max-w-[150px]">
                {bus.bus?.origin_stop?.name}
              </p>
              <div className="w-1 h-1 rounded-full bg-gray-200" />
              <p className="text-[10px] font-bold text-outline truncate max-w-[150px]">
                {bus.bus?.destination_stop?.name}
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right flex-shrink-0">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{operatorName}</p>
            <p className="text-[9px] font-bold text-outline uppercase leading-none">{busInfo.bus_type?.name}</p>
          </div>
        </header>

        <div className="flex justify-center border-b border-gray-100 bg-white">
          <div className="flex gap-8">
            {['Select seats', 'Board/Drop point', 'Passenger Info'].map((tab, idx) => {
              const isLocked = (tab === 'Board/Drop point' || tab === 'Passenger Info') && selectedSeats.length === 0;
              const isInfoLocked = tab === 'Passenger Info' && (!boardingPoint || !droppingPoint);

              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  disabled={isLocked || (tab === 'Passenger Info' && isInfoLocked)}
                  className={`py-3 relative ${activeTab === tab ? 'text-primary' : 'text-outline'} ${isLocked || isInfoLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="text-[9.5px] uppercase font-bold tracking-widest">{idx + 1}. {tab}</span>
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 bg-surface relative min-h-0">
          <div className="absolute inset-0">
            {activeTab === 'Select seats' && (
              <div className="flex flex-col lg:flex-row h-full">
                {/* Left Side: Seat Map */}
                <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-slate-50/30 border-r border-gray-100 custom-scrollbar">
                  <div className="p-8 flex flex-col items-center">
                    {loadingSeats ? (
                      <div className="py-20 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-[9px] font-bold text-outline uppercase">Loading Map...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-10 w-full pb-40">
                        <div className="flex flex-row gap-8 items-start justify-center flex-wrap lg:flex-nowrap">
                          {decksToRender.map((deckInfo, deckIdx) => {
                            const { type, config, deck, label } = deckInfo;
                            const { rows = 0, left_columns = 0, right_columns = 0 } = config;
                            const colsPerRow = left_columns + right_columns;

                            const deckSeats = categorizedSeats.filter(s => {
                              const sBerth = s.berth_type?.toUpperCase() || 'LOWER';
                              return sBerth === deck;
                            });

                            // Map seats to grid to avoid duplicates
                            const grid = Array(rows * colsPerRow).fill(null);
                            const unassignedSeats = [];

                            deckSeats.forEach(seat => {
                              if (seat.parsedRow && seat.parsedLetter) {
                                const r = seat.parsedRow - 1;
                                const c = seat.parsedLetter.charCodeAt(0) - 65;
                                if (r >= 0 && r < rows && c >= 0 && c < colsPerRow) {
                                  const idx = r * colsPerRow + c;
                                  if (!grid[idx]) grid[idx] = seat;
                                  else unassignedSeats.push(seat);
                                } else {
                                  unassignedSeats.push(seat);
                                }
                              } else {
                                unassignedSeats.push(seat);
                              }
                            });

                            // Fill gaps with unassigned seats
                            for (let i = 0; i < grid.length && unassignedSeats.length > 0; i++) {
                              if (!grid[i]) grid[i] = unassignedSeats.shift();
                            }

                            return (
                              <div key={`${type}-${deck}-${deckIdx}`} className="flex flex-col items-center w-full max-w-[340px]">
                                <div className="flex justify-between w-full px-4 mb-4">
                                  <span className="text-[9px] font-black text-gray-300">FRONT</span>
                                  {decksToRender.length > 1 && (
                                    <h4 className="text-[10px] font-black text-primary uppercase bg-primary/5 px-4 py-1 rounded-full border border-primary/10">{label}</h4>
                                  )}
                                  <span className="text-[9px] font-black text-gray-300">BACK</span>
                                </div>

                                <div className="relative w-full p-2 bg-gray-50 rounded-[44px] border-2 border-gray-200 shadow-md">
                                  {/* Front Windshield */}
                                  <div className="absolute top-0 left-10 right-10 h-2 bg-gray-200 rounded-b-xl z-10 opacity-60 shadow-sm" />

                                  <div className="bg-white p-6 sm:p-8 rounded-[36px] border border-gray-100 shadow-inner relative w-full overflow-hidden">
                                    {/* Steering Wheel / Driver Area */}
                                    {deck === 'LOWER' && (
                                      <div className="absolute top-4 right-8 flex flex-col items-center gap-1 opacity-20">
                                        <Icon iconNode={steeringWheel} className="w-10 h-10" />
                                        <span className="text-[8px] font-black tracking-tighter uppercase">Driver</span>
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-6 pt-10">
                                      {Array.from({ length: rows }).map((_, rIdx) => (
                                        <div key={rIdx} className="flex justify-between items-start">
                                          <div className="flex gap-3">
                                            {Array.from({ length: left_columns }).map((_, cIdx) => {
                                              const colPos = colsPerRow - 1 - cIdx;
                                              const seatData = grid[rIdx * colsPerRow + colPos];
                                              return <SeatIcon key={`left-${cIdx}`} seat={seatData} type={seatData?.seat_type?.toUpperCase() || type} onSelect={toggleSeat} selected={seatData ? selectedSeats.some(s => s.seat_number === seatData.seat_number) : false} genderCategory={seatData?.category} price={seatData?.price} />;
                                            })}
                                          </div>
                                          <div className={type === 'SLEEPER' ? 'w-10' : 'w-8'} />
                                          <div className="flex gap-3">
                                            {Array.from({ length: right_columns }).map((_, cIdx) => {
                                              const colPos = right_columns - 1 - cIdx;
                                              const seatData = grid[rIdx * colsPerRow + colPos];
                                              return <SeatIcon key={`right-${cIdx}`} seat={seatData} type={seatData?.seat_type?.toUpperCase() || type} onSelect={toggleSeat} selected={seatData ? selectedSeats.some(s => s.seat_number === seatData.seat_number) : false} genderCategory={seatData?.category} price={seatData?.price} />;
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Wheel Arches & Mirrors */}
                                  <div className="absolute -left-1.5 top-24 w-2 h-20 bg-gray-400 rounded-full border border-white shadow-sm" />
                                  <div className="absolute -right-1.5 top-24 w-2 h-20 bg-gray-400 rounded-full border border-white shadow-sm" />
                                  <div className="absolute -left-1.5 bottom-24 w-2 h-20 bg-gray-400 rounded-full border border-white shadow-sm" />
                                  <div className="absolute -right-1.5 bottom-24 w-2 h-20 bg-gray-400 rounded-full border border-white shadow-sm" />
                                  {deck === 'LOWER' && (
                                    <>
                                      <div className="absolute -left-4 top-10 w-4 h-1.5 bg-gray-400 rounded-l-full shadow-sm" />
                                      <div className="absolute -right-4 top-10 w-4 h-1.5 bg-gray-400 rounded-r-full shadow-sm" />
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Available Seats Listing based on Category */}
                        {/* <div className="w-full max-w-3xl bg-white p-6 sm:p-10 rounded-[32px] border border-gray-100 shadow-sm mb-4 overflow-hidden text-center">
                          <h4 className="text-[12px] font-black text-primary uppercase tracking-[0.2em] mb-6">Available Seats List</h4>
                          <div className="flex flex-col gap-6 text-left">
                            {[
                              { cat: 'WOMEN', label: 'Women', color: 'text-pink-600', bg: 'bg-pink-50' },
                              { cat: 'MEN', label: 'Men', color: 'text-blue-600', bg: 'bg-blue-50' },
                              { cat: 'GENERAL', label: 'General', color: 'text-green-600', bg: 'bg-green-50' }
                            ].map(({ cat, label, color, bg }) => {
                              const catSeats = categorizedSeats.filter(s => s.category === cat && s.is_available);
                              if (catSeats.length === 0) return null;
                              return (
                                <div key={cat} className={`p-4 rounded-2xl ${bg} border border-white shadow-sm`}>
                                  <h5 className={`text-[11px] font-black uppercase tracking-wider mb-3 ${color}`}>{label} ({catSeats.length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {catSeats.map(s => (
                                      <button 
                                        key={s.id}
                                        onClick={() => toggleSeat(s.seat_number)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${selectedSeats.includes(s.seat_number) ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'}`}
                                      >
                                        {s.seat_number} - ₹{s.price}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div> */}

                        {/* Legend: Know your seat types */}
                        <div className="w-full max-w-3xl bg-white p-6 sm:p-10 rounded-[32px] border border-gray-100 shadow-sm mb-20 overflow-hidden">
                          <h4 className="text-[12px] font-black text-primary uppercase tracking-[0.2em] mb-10 text-center">Know your seat types</h4>

                          <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-gray-50">
                                  <th className="text-left py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seat Types</th>
                                  <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seater</th>
                                  <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sleeper</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {/* Available Female */}
                                <tr>
                                  <td className="py-6 px-4 text-[11px] font-bold text-gray-600">Available only for female (Women)</td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-8 border-2 border-pink-500 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-pink-500 text-sm">person_3</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-14 border-2 border-pink-500 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-pink-500 text-sm">person_3</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {/* Available Male */}
                                <tr>
                                  <td className="py-6 px-4 text-[11px] font-bold text-gray-600">Available only for male (Men)</td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-8 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-500 text-sm">person</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-14 border-2 border-blue-500 rounded-lg flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-500 text-sm">person</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {/* Available General */}
                                <tr>
                                  <td className="py-6 px-4 text-[11px] font-bold text-gray-600">Available (General)</td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-8 border-2 border-green-600 rounded-lg flex items-center justify-center">
                                        <div className="w-4 h-4 border-b-2 border-gray-100 rounded-sm" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-14 border-2 border-green-600 rounded-lg" />
                                    </div>
                                  </td>
                                </tr>

                                {/* Selected */}
                                <tr>
                                  <td className="py-6 px-4 text-[11px] font-bold text-gray-600">Selected by you</td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-14 bg-green-600 rounded-lg flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                                      </div>
                                    </div>
                                  </td>
                                </tr>

                                {/* Already Booked */}
                                <tr>
                                  <td className="py-6 px-4 text-[11px] font-bold text-gray-600">Already booked</td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-[7px] font-black text-gray-400">Sold</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4">
                                    <div className="flex justify-center">
                                      <div className="w-8 h-14 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-[7px] font-black text-gray-400">Sold</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Details Sidebar (Simple Integrated Style) */}
                <div className="w-full lg:w-1/2 flex flex-col h-full p-4 bg-slate-50/50">
                  <div className="flex-1 bg-white flex flex-col h-full rounded-2xl border border-gray-100 overflow-hidden relative">
                    {/* Sticky Tabs Header */}
                    <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6">
                      <div className="flex overflow-x-auto custom-scrollbar no-scrollbar py-3 gap-6">
                        {[
                          { id: 'details', label: 'Details' },
                          { id: 'boarding', label: 'Boarding' },
                          { id: 'dropping', label: 'Dropping' },
                          { id: 'route', label: 'Route' },
                          { id: 'reviews', label: 'Reviews' },
                          { id: 'other', label: 'Policies' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setSidebarTab(tab.id);
                              document.getElementById(`section-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-wider transition-all relative py-1 ${sidebarTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {tab.label}
                            {sidebarTab === tab.id && <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth">
                      {/* Bus Details Section */}
                      <div id="section-details" className="mb-8 scroll-mt-20">
                        <h3 className="text-sm font-bold text-primary mb-4">Bus Details</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Bus Number</p>
                            <p className="text-xs font-medium text-gray-700">{bus.bus?.bus_number || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Manufacturer</p>
                            <p className="text-xs font-medium text-gray-700">{bus.bus?.bus_type?.manufacturer || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Bus Type</p>
                            <p className="text-xs font-medium text-gray-700">{bus.bus?.bus_type?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Climate</p>
                            <p className="text-xs font-medium text-gray-700">{bus.bus?.bus_type?.ac ? 'AC' : 'Non-AC'}</p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-2">
                            {bus.bus?.bus_type?.amenities?.map((amenity, i) => (
                              <span key={i} className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">check</span>
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-50 my-6" />

                      {/* Boarding Points Section */}
                      <div id="section-boarding" className="mb-8 scroll-mt-20">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Boarding Points</h4>
                        <div className="space-y-4">
                          {boardingPoints.map((point, idx) => (
                            <div key={point.id} className="flex gap-4 group">
                              <div className="w-12 flex-shrink-0 text-right">
                                <p className="text-[11px] font-bold text-gray-700">{fmt24(point.pickup_time)}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{fmtDate(point.pickup_time)}</p>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1" />
                                {idx !== boardingPoints.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                              </div>
                              <div className="pb-4">
                                <p className="text-[11px] font-bold text-gray-700 leading-tight">{point.city}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                                  {point.stop_name} {point.landmark && <span className="mx-1 text-gray-200">•</span>} {point.landmark}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dropping Points Section */}
                      <div id="section-dropping" className="mb-8 scroll-mt-20">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Dropping Points</h4>
                        <div className="space-y-4">
                          {droppingPoints.map((point, idx) => (
                            <div key={point.id} className="flex gap-4 group">
                              <div className="w-12 flex-shrink-0 text-right">
                                <p className="text-[11px] font-bold text-gray-700">{fmt24(point.drop_time)}</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">{fmtDate(point.drop_time)}</p>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1" />
                                {idx !== droppingPoints.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                              </div>
                              <div className="pb-4">
                                <p className="text-[11px] font-bold text-gray-700 leading-tight">{point.city}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                                  {point.stop_name} {point.landmark && <span className="mx-1 text-gray-200">•</span>} {point.landmark}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-gray-50 my-6" />

                      {/* Bus Route Section */}
                      <div id="section-route" className="mb-8 scroll-mt-20">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Bus Route</h4>
                        <div className="flex flex-wrap items-center gap-y-3 gap-x-2">
                          {routeData.map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <p className="text-[11px] font-bold text-gray-700 leading-tight">{stop.city || stop.stop_name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                                  {stop.city ? stop.stop_name : ''} {fmt24(stop.time)}
                                </p>
                              </div>
                              {idx !== routeData.length - 1 && (
                                <span className="material-symbols-outlined text-gray-300 text-xs">trending_flat</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Operator Section */}
                      <div id="section-reviews" className="mb-8 scroll-mt-20">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Operator</h4>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                            {bus.bus?.operator?.logo_url ? (
                              <img src={bus.bus.operator.logo_url} alt="Logo" className="w-full h-full object-contain p-1.5" />
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 text-base">directions_bus</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-700">{bus.bus?.operator?.name || operatorName}</p>
                            <p className="text-[10px] text-gray-400">Rating: {bus.bus?.operator?.rating || '4.5'} ★</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Phone</p>
                            <p className="text-[10px] font-medium text-gray-700">{bus.bus?.operator?.contact_phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Email</p>
                            <p className="text-[10px] font-medium text-gray-700 truncate">{bus.bus?.operator?.contact_email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-50 my-6" />

                      {/* Policies Section */}
                      <div id="section-other" className="mb-8 scroll-mt-20">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-4">Policies</h4>
                        <div className="space-y-3">
                          {[
                            { title: 'Luggage', content: 'Up to 5kg per passenger.' },
                            { title: 'Pets', content: 'Not allowed.' },
                            { title: 'Alcohol/Smoking', content: 'Prohibited.' }
                          ].map((policy, idx) => (
                            <div key={idx} className="text-[10px]">
                              <span className="font-bold text-gray-700">{policy.title}: </span>
                              <span className="text-gray-500">{policy.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Board/Drop point' && (
              <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Boarding Points Card */}
                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 bg-white/50">
                      <h3 className="text-[12px] font-black text-primary uppercase tracking-tight">Boarding points</h3>
                      <p className="text-[10px] font-bold text-outline mt-0.5 uppercase tracking-widest">
                        {boardingPoints[0]?.city || bus.origin || 'Origin'}
                      </p>
                    </div>
                    <div className="flex-1">
                      {filteredBoardingPoints.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">No boarding points in {bus.origin}</p>
                        </div>
                      ) : (
                        filteredBoardingPoints.map((point) => (
                          <div
                            key={point.id}
                            onClick={() => setBoardingPoint(point)}
                            className={`w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors ${boardingPoint?.id === point.id ? 'bg-primary/[0.03]' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-black text-gray-700 w-10 text-left">
                                {fmt24(point.pickup_time)}
                              </span>
                              <div className="text-left">
                                <p className="text-[11px] font-black text-primary leading-tight">{point.stop_name}</p>
                                <p className="text-[9px] font-bold text-outline uppercase mt-0.5 tracking-tight">{point.city}</p>
                              </div>
                            </div>
                            {boardingPoint?.id === point.id && (
                              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Dropping Points Card */}
                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 bg-white/50">
                      <h3 className="text-[12px] font-black text-primary uppercase tracking-tight">Dropping points</h3>
                      <p className="text-[10px] font-bold text-outline mt-0.5 uppercase tracking-widest">
                        {droppingPoints[0]?.city || bus.destination || 'Destination'}
                      </p>
                    </div>
                    <div className="flex-1">
                      {filteredDroppingPoints.length === 0 ? (
                        <div className="p-10 text-center">
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest">No dropping points in {bus.destination}</p>
                        </div>
                      ) : (
                        filteredDroppingPoints.map((point) => (
                          <div
                            key={point.id}
                            onClick={() => setDroppingPoint(point)}
                            className={`w-full px-6 py-4 flex items-center justify-between border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors ${droppingPoint?.id === point.id ? 'bg-primary/[0.03]' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-black text-gray-700 w-10 text-left">
                                {fmt24(point.drop_time)}
                              </span>
                              <div className="text-left">
                                <p className="text-[11px] font-black text-primary leading-tight">{point.stop_name}</p>
                                <p className="text-[9px] font-bold text-outline uppercase mt-0.5 tracking-tight">{point.city}</p>
                              </div>
                            </div>
                            {droppingPoint?.id === point.id && (
                              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'Passenger Info' && (
              <div className="h-full bg-slate-50/50 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
                {/* Left Side: Passenger Forms */}
                <div className="w-full lg:w-1/2 h-full overflow-y-auto custom-scrollbar pr-2 pb-32">
                  <div className="space-y-4">
                    {selectedSeats.map((seat, index) => {
                      const isMen = seat.category === 'MEN';
                      const isWomen = seat.category === 'WOMEN';
                      const passenger = passengersData[seat.seat_id] || {};
                      const seatErrors = formErrors[seat.seat_id] || {};

                      const iconColor = isMen ? 'text-blue-500 bg-blue-50' : isWomen ? 'text-pink-500 bg-pink-50' : 'text-gray-500 bg-gray-100';

                      return (
                        <div key={seat.seat_id} className="bg-white rounded-[20px] border border-gray-100 p-4 shadow-sm">
                          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColor}`}>
                              <span className="material-symbols-outlined text-lg">{isWomen ? 'woman' : 'person'}</span>
                            </div>
                            <div>
                              <h4 className="text-[13px] font-black text-primary">Passenger {index + 1}</h4>
                              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-0.5">Seat {seat.seat_number} • {seat.category || 'General'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.first_name ? 'text-red-500' : 'text-outline'}`}>First Name</label>
                              <input
                                type="text"
                                value={passenger.first_name || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'first_name', e.target.value)}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none focus:ring-2 ${seatErrors.first_name ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                                placeholder="First Name"
                              />
                            </div>
                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.last_name ? 'text-red-500' : 'text-outline'}`}>Last Name</label>
                              <input
                                type="text"
                                value={passenger.last_name || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'last_name', e.target.value)}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none focus:ring-2 ${seatErrors.last_name ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                                placeholder="Last Name"
                              />
                            </div>

                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.date_of_birth ? 'text-red-500' : 'text-outline'}`}>Date of Birth</label>
                              <input
                                type="date"
                                min="1926-01-01"
                                max={new Date().toISOString().split('T')[0]}
                                value={passenger.date_of_birth || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'date_of_birth', e.target.value)}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none focus:ring-2 ${seatErrors.date_of_birth ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                              />
                            </div>

                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.gender ? 'text-red-500' : 'text-outline'}`}>Gender</label>
                              <select
                                value={isMen ? 'MEN' : isWomen ? 'WOMEN' : passenger.gender || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'gender', e.target.value)}
                                disabled={isMen || isWomen}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 hover:bg-gray-100/50 transition-colors outline-none cursor-pointer focus:ring-2 ${seatErrors.gender ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                              >
                                <option value="" disabled>Select Gender</option>
                                <option value="MEN">Men</option>
                                <option value="WOMEN">Women</option>
                                <option value="OTHERS">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-outline uppercase mb-1 tracking-widest">Passenger Type</label>
                              <select
                                value={passenger.passenger_type || 'adult'}
                                onChange={e => handlePassengerChange(seat.seat_id, 'passenger_type', e.target.value)}
                                className="w-full text-xs font-bold text-primary border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none cursor-pointer"
                              >
                                <option value="adult">Adult</option>
                                <option value="child">Child</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-50">
                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.id_type ? 'text-red-500' : 'text-outline'}`}>ID Type</label>
                              <select
                                value={passenger.id_type || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'id_type', e.target.value)}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none cursor-pointer focus:ring-2 ${seatErrors.id_type ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                              >
                                <option value="" disabled>Select ID</option>
                                <option value="AADHAAR">Aadhaar Card</option>
                                <option value="PAN">PAN Card</option>
                                <option value="PASSPORT">Passport</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-[9px] font-bold uppercase mb-1 tracking-widest ${seatErrors.id_number ? 'text-red-500' : 'text-outline'}`}>ID Number</label>
                              <input
                                type="text"
                                value={passenger.id_number || ''}
                                onChange={e => handlePassengerChange(seat.seat_id, 'id_number', e.target.value)}
                                className={`w-full text-xs font-bold text-primary border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100/50 transition-colors outline-none focus:ring-2 ${seatErrors.id_number ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-primary/20 focus:border-primary'}`}
                                placeholder="Enter ID Number"
                              />
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Journey Summary */}
                <div className="w-full lg:w-1/2 h-full overflow-y-auto custom-scrollbar pl-2 pb-32 flex flex-col gap-4">
                  {/* Route Summary */}
                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-6">Journey Summary</h3>

                    <div className="relative border-l-2 border-dashed border-gray-200 ml-2 py-1 pl-6 space-y-8">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-white" />
                        <p className="text-[9px] font-black text-outline uppercase tracking-widest leading-none mb-1">Boarding</p>
                        <p className="text-[13px] font-black text-primary leading-tight">{boardingPoint?.stop_name || 'Select Point'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                          {boardingPoint ? `${fmtDate(boardingPoint.pickup_time)} • ${fmt24(boardingPoint.pickup_time)}` : '--:--'}
                          {boardingPoint?.city && ` • ${boardingPoint.city}`}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-white" />
                        <p className="text-[9px] font-black text-outline uppercase tracking-widest leading-none mb-1">Dropping</p>
                        <p className="text-[13px] font-black text-primary leading-tight">{droppingPoint?.stop_name || 'Select Point'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                          {droppingPoint ? `${fmtDate(droppingPoint.drop_time)} • ${fmt24(droppingPoint.drop_time)}` : '--:--'}
                          {droppingPoint?.city && ` • ${droppingPoint.city}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fare Summary */}
                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4">Fare Details</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Selected Seats</span>
                      <span className="text-[12px] font-black text-primary">{selectedSeats.length}</span>
                    </div>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Base Fare</span>
                      <span className="text-[12px] font-black text-primary">₹{selectedSeats.reduce((acc, s) => acc + s.price, 0)}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[11px] font-black text-primary uppercase tracking-widest">Total Amount</span>
                      <span className="text-[18px] font-black text-primary">₹{selectedSeats.reduce((acc, s) => acc + s.price, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Bottom Popup for Progress */}
        {selectedSeats.length > 0 && (
          <>
            {activeTab === 'Select seats' && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[110] flex items-center gap-6 rounded-full animate-in slide-in-from-bottom duration-300 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-black text-primary">₹{selectedSeats.reduce((acc, s) => acc + s.price, 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('Board/Drop point')}
                  className="bg-primary text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Select Boarding & Dropping
                </button>
              </div>
            )}

            {activeTab === 'Board/Drop point' && boardingPoint && droppingPoint && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[110] flex items-center gap-6 rounded-full animate-in slide-in-from-bottom duration-300 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-black text-primary">₹{selectedSeats.reduce((acc, s) => acc + s.price, 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('Passenger Info')}
                  className="bg-primary text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Passenger Info
                </button>
              </div>
            )}

            {activeTab === 'Passenger Info' && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[110] flex items-center gap-6 rounded-full animate-in slide-in-from-bottom duration-300 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-base font-black text-primary">₹{selectedSeats.reduce((acc, s) => acc + s.price, 0)}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg transition-all ${isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed shadow-none'
                    : 'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700 hover:scale-[1.02] active:scale-95'
                    }`}
                >
                  {isSubmitting ? 'Processing...' : 'Complete Booking'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Back Warning Modal */}
        <AnimatePresence>
          {showBackWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Abandon Selection?</h3>
                <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8">
                  Going back will clear your selected seats. Your progress will be lost.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setSelectedSeats([]);
                      setBoardingPoint(null);
                      setDroppingPoint(null);
                      setPassengersData({});
                      setFormErrors({});
                      setActiveTab('Select seats');
                      setShowBackWarning(false);
                      onClose();
                    }}
                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    Yes, Reset & Close
                  </button>
                  <button
                    onClick={() => setShowBackWarning(false)}
                    className="w-full bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all"
                  >
                    No, Stay Here
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Modal */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl text-center border border-gray-100"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl">error</span>
                </div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Notice</h3>
                <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                >
                  Understood
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

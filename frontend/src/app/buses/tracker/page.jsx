'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  UserCheck,
  XCircle,
  Navigation2,
  Ticket,
  Circle,
  MapPinCheckInside,
  Radio,
} from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import { busApi } from '@/lib/busApi';

/* ─── Time helpers ─────────────────────────────────────────────────────── */

function parseStopDate(iso) {
  if (!iso) return new Date(0);
  const cleaned = typeof iso === 'string' ? iso.replace(/Z$/i, '') : iso;
  return new Date(cleaned);
}

function formatTime(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function relativeTime(date, now) {
  const diffMs = date - now;
  const isPast = diffMs < 0;
  const absDiffMin = Math.abs(Math.round(diffMs / 60000));
  
  if (absDiffMin <= 1) return 'arriving now';
  
  const h = Math.floor(absDiffMin / 60);
  const m = absDiffMin % 60;
  
  let str = '';
  if (h > 0) {
    str += `${h} hr `;
  }
  if (m > 0 || h === 0) {
    str += `${m} min`;
  }
  str = str.trim();
  
  return isPast ? `${str} ago` : `in ${str}`;
}

function fmtCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ─── Tracking state derivation ────────────────────────────────────────── */

function deriveTrackingState(stops, now) {
  if (!stops.length) return { stops: [], overallProgress: 0, tripCompleted: false, nextStop: null };

  const times = stops.map(s => parseStopDate(s.time));
  const first = times[0];
  const last = times[times.length - 1];

  if (now < first) {
    return {
      stops: stops.map((s, i) => ({
        ...s,
        status: i === 0 ? 'current' : i === stops.length - 1 ? 'terminal' : 'upcoming',
        displayTime: formatTime(s.time),
        relTime: i === 0 ? relativeTime(first, now) : null,
      })),
      overallProgress: 0,
      tripCompleted: false,
      nextStop: stops[0],
      nextStopTime: first,
    };
  }

  if (now >= last) {
    const annotated = stops.map(s => ({ ...s, status: 'departed', displayTime: formatTime(s.time), relTime: null }));
    annotated[annotated.length - 1].status = 'terminal';
    return { stops: annotated, overallProgress: 100, tripCompleted: true, nextStop: null };
  }

  let nextIdx = times.findIndex(t => t > now);
  if (nextIdx === -1) nextIdx = stops.length - 1;

  const annotated = stops.map((s, i) => {
    let status;
    if (i < nextIdx) status = 'departed';
    else if (i === nextIdx) status = i === stops.length - 1 ? 'terminal' : 'current';
    else if (i === stops.length - 1) status = 'terminal';
    else status = 'upcoming';
    return { ...s, status, displayTime: formatTime(s.time), relTime: i === nextIdx ? relativeTime(times[i], now) : null };
  });

  return {
    stops: annotated,
    overallProgress: Math.min(100, ((now - first) / (last - first)) * 100),
    tripCompleted: false,
    nextStop: stops[nextIdx],
    nextStopTime: times[nextIdx],
  };
}

/* ─── Shared primitives ────────────────────────────────────────────────── */

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E4E7EC] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-[#F2F4F7] text-[#344054]',
    success: 'bg-[#ECFDF3] text-[#027A48]',
    warning: 'bg-[#FFFAEB] text-[#B54708]',
    info: 'bg-[#ECFDF5] text-[#059669]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold leading-none ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

function Btn({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';
  const variants = {
    primary: 'bg-[#059669] text-white hover:bg-[#047857] active:scale-[0.98] focus-visible:ring-[#059669] shadow-sm px-5 py-2.5 text-sm',
    ghost: 'text-[#344054] hover:bg-[#F2F4F7] active:bg-[#E4E7EC] focus-visible:ring-[#667085] px-2.5 py-1.5 text-sm',
    outline: 'border border-[#D0D5DD] text-[#344054] hover:bg-[#F9FAFB] active:scale-[0.98] focus-visible:ring-[#667085] px-3.5 py-2 text-sm',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

/* Stop dot on the vertical rail */
function StopDot({ status }) {
  if (status === 'departed') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#059669] ring-4 ring-[#ECFDF5] flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div className="relative w-8 h-8 rounded-full bg-[#059669] ring-4 ring-[#D1FAE5] flex items-center justify-center flex-shrink-0">
        <span className="absolute inset-0 rounded-full animate-ping bg-[#059669]/30" />
        <Bus size={13} className="text-white relative z-10" strokeWidth={2} />
      </div>
    );
  }
  if (status === 'terminal') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#F2F4F7] border-2 border-dashed border-[#D0D5DD] flex items-center justify-center flex-shrink-0">
        <MapPin size={12} className="text-[#98A2B3]" strokeWidth={2} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white border-2 border-[#D0D5DD] flex items-center justify-center flex-shrink-0">
      <Circle size={8} className="text-[#D0D5DD]" fill="currentColor" />
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

function BusTrackerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busActiveBooking = useBookingStore(state => state.busActiveBooking);

  const [pnrInput, setPnrInput] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('search');
  const [isInsideBus, setIsInsideBus] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [busDetails, setBusDetails] = useState(null);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [now, setNow] = useState(() => new Date());

  const pnrFromStore = busActiveBooking?.pnr || '';

  /* 1 second tick for live countdown */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Auto-track from URL ?pnr= */
  useEffect(() => {
    const urlPnr = searchParams.get('pnr');
    if (urlPnr) {
      setView('loading');
      setPnrInput(urlPnr.toUpperCase());
      handleTrack(null, urlPnr.toUpperCase());
    }
  }, [searchParams]);

  const handleLocationToggle = (e) => {
    if (e.target.checked) {
      if (!('geolocation' in navigator)) { setError('Geolocation not supported.'); return; }
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLocation({ lat: pos.coords.latitude.toFixed(4), lng: pos.coords.longitude.toFixed(4) }); setIsInsideBus(true); },
        () => { setError('Location access denied.'); setIsInsideBus(false); }
      );
    } else {
      setIsInsideBus(false);
      setUserLocation(null);
    }
  };

  const handleTrack = async (e, overridePnr) => {
    if (e) e.preventDefault();
    try {
      setLoading(true); setError('');
      const pnr = (overridePnr || pnrInput.trim() || pnrFromStore).toUpperCase();
      const urlInst = searchParams.get('instance_id');
      const res = await busApi.getBookingByPnr(pnr);
      const bd = res?.data || res;
      setBooking(bd);
      const instanceId = urlInst || bd?.bus_instance_id || bd?.bus_instance?.id;
      if (instanceId) {
        const [det, bp, dp] = await Promise.all([
          busApi.getBusDetails(instanceId).catch(() => null),
          busApi.getBoardingPoints(instanceId).catch(() => []),
          busApi.getDroppingPoints(instanceId).catch(() => []),
        ]);
        if (det) setBusDetails(det?.data || det);
        setBoardingPoints(Array.isArray(bp) ? bp : bp?.data || []);
        setDroppingPoints(Array.isArray(dp) ? dp : dp?.data || []);
      }
      setView('tracking');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found. Please check the PNR.');
      setView('search');
    } finally {
      setLoading(false);
    }
  };

  /* Sorted stops */
  const sortedStops = useMemo(() => [
    ...boardingPoints.map(p => ({ name: p.stop_name, city: p.city, time: p.pickup_time, type: 'boarding', id: p.id })),
    ...droppingPoints.map(p => ({ name: p.stop_name, city: p.city, time: p.drop_time, type: 'dropping', id: p.id })),
  ].sort((a, b) => parseStopDate(a.time) - parseStopDate(b.time)), [boardingPoints, droppingPoints]);

  const tracking = useMemo(() => deriveTrackingState(sortedStops, now), [sortedStops, now]);
  const { stops: displayStops, overallProgress = 0, tripCompleted, nextStop, nextStopTime } = tracking;
  const etaMs = nextStopTime ? Math.max(0, nextStopTime - now) : null;

  const instance = booking?.bus_instance;
  const origin = busDetails?.bus?.origin_stop?.city || instance?.bus?.origin_stop?.city || 'Origin';
  const destination = busDetails?.bus?.destination_stop?.city || instance?.bus?.destination_stop?.city || 'Destination';
  const busType = busDetails?.bus?.bus_type?.name || instance?.bus?.bus_type || 'Intercity Express';

  const pctClamped = Math.min(100, Math.max(0, overallProgress));

  const statusMeta = tripCompleted
    ? { label: 'Trip Completed', color: 'text-[#027A48]' }
    : overallProgress > 0
      ? { label: 'In Transit', color: 'text-[#059669]' }
      : { label: 'Not Yet Departed', color: 'text-[#667085]' };

  /* ── Views ─────────────────────────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-[#F7F8FA] pb-32 pt-20">

      <AnimatePresence mode="wait">

        {/* ── Loading ── */}
        {view === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center pt-40 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#059669] flex items-center justify-center shadow-lg shadow-[#059669]/20">
              <Bus size={26} className="text-white" />
            </div>
            <div className="flex items-center gap-2 text-[#667085] text-sm font-medium">
              <Loader2 size={14} className="animate-spin" />
              Fetching live journey data…
            </div>
          </motion.div>
        )}

        {/* ── Search ── */}
        {view === 'search' && (
          <motion.div key="search"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}
            className="max-w-lg mx-auto px-4">

            {/* Hero */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#059669] px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
                <Radio size={11} />
                Real-time tracking
              </div>
              <h1 className="text-3xl font-bold text-[#101828] tracking-tight">Track your bus</h1>
              <p className="text-[#667085] mt-1.5 text-sm">Enter your PNR to see live stop-by-stop progress.</p>
            </div>

            {/* Form card */}
            <Card className="p-6">
              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-1.5">
                    Booking reference / PNR
                  </label>
                  <div className="relative">
                    <Ticket size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none" />
                    <input
                      type="text"
                      value={pnrInput}
                      onChange={e => setPnrInput(e.target.value.toUpperCase())}
                      placeholder={pnrFromStore || 'e.g. BUS123456'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D0D5DD] bg-white text-[#101828] font-mono text-sm placeholder:text-[#D0D5DD] focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-all"
                    />
                  </div>
                </div>
                <Btn type="submit" variant="primary" disabled={loading} className="w-full py-3 text-sm rounded-xl">
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" /> Fetching…</>
                    : <><Bus size={15} /> Track Bus</>
                  }
                </Btn>
              </form>
            </Card>

            <AnimatePresence>
              {error && (
                <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 flex items-start gap-2.5 bg-[#FFF1F3] border border-[#FECDD6] text-[#C01048] rounded-xl px-4 py-3 text-sm font-medium">
                  <AlertCircle size={15} className="flex-shrink-0 mt-px" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Tracking ── */}
        {view === 'tracking' && (
          <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 space-y-3">

            {/* ── Route header card ── */}
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <Btn variant="ghost" onClick={() => router.push(`/buses/confirmation?booking_id=${booking.id}`)}
                    className="-ml-2 mb-2 text-xs text-[#667085] py-1">
                    <ArrowLeft size={13} /> Back to booking
                  </Btn>
                  <h2 className="text-lg font-bold text-[#101828] leading-snug">
                    {origin}
                    <span className="mx-2 text-[#98A2B3] font-normal">→</span>
                    {destination}
                  </h2>
                  <p className="text-[#667085] text-sm mt-0.5">{busType}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3] mb-1">Status</p>
                  <p className={`text-sm font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
                  <p className="text-[11px] text-[#98A2B3] mt-0.5">{displayStops.length} stops</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-[#98A2B3] mb-1.5">
                  <span className="flex items-center gap-1"><MapPin size={10} />{origin}</span>
                  <span className="flex items-center gap-1">{destination}<MapPinCheckInside size={10} /></span>
                </div>
                <div className="relative h-2 bg-[#F2F4F7] rounded-full overflow-visible">
                  <motion.div className="absolute inset-y-0 left-0 bg-[#059669] rounded-full"
                    animate={{ width: `${pctClamped}%` }} transition={{ duration: 0.8, ease: 'linear' }} />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-2 border-[#059669] shadow-md flex items-center justify-center"
                    animate={{ left: `${pctClamped}%` }} transition={{ duration: 0.8, ease: 'linear' }}>
                    <Bus size={10} className="text-[#059669]" strokeWidth={2.5} />
                  </motion.div>
                </div>
                <p className="text-center text-[11px] text-[#98A2B3] font-medium mt-2">
                  {Math.round(pctClamped)}% complete
                </p>
              </div>
            </Card>

            {/* ── ETA banner ── */}
            <AnimatePresence>
              {nextStop && !tripCompleted && (
                <motion.div key="eta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl bg-[#059669] px-5 py-4 flex items-center justify-between shadow-lg shadow-[#059669]/20">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Navigation2 size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Next stop</p>
                        <p className="text-white font-bold text-base leading-tight">{nextStop.name}</p>
                        <p className="text-white/55 text-xs mt-0.5">{nextStop.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-0.5">ETA</p>
                      {etaMs !== null && etaMs > 60000 ? (
                        <>
                          <p className="text-white font-bold text-3xl leading-none tabular-nums tracking-tight">
                            {fmtCountdown(etaMs)}
                          </p>
                          <p className="text-white/45 text-[9px] uppercase tracking-wider mt-1">hh : mm</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="w-2 h-2 rounded-full bg-[#6CE9A6] animate-pulse" />
                          <p className="text-[#6CE9A6] font-bold text-sm">Arriving now</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Trip complete ── */}
            <AnimatePresence>
              {tripCompleted && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-[#ECFDF3] border border-[#ABEFC6] px-5 py-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFAE6] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-[#079455]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#054F31] text-sm">Trip completed</p>
                    <p className="text-[#067647] text-xs mt-0.5">
                      The bus has reached {destination}. Thank you for travelling!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Timeline card ── */}
            <Card>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F2F4F7]">
                <h3 className="font-bold text-[#101828] text-sm">Itinerary</h3>
                <Badge variant="info"><Clock size={10} />Scheduled times</Badge>
              </div>

              <div className="px-5 py-5 relative">
                {/* Rail */}
                <div className="absolute left-[2.35rem] top-8 bottom-8 w-px bg-[#E4E7EC]" />
                <motion.div className="absolute left-[2.35rem] top-8 w-px bg-[#059669] origin-top"
                  animate={{ height: `calc((100% - 4rem) * ${pctClamped / 100})` }}
                  transition={{ duration: 0.8, ease: 'linear' }} />

                {/* Animated bus icon on rail */}
                {!tripCompleted && (
                  <motion.div
                    className="absolute left-[2.35rem] -translate-x-1/2 z-20 w-6 h-6 rounded-md bg-[#059669] border-2 border-white shadow-lg flex items-center justify-center"
                    animate={{ top: `calc(2rem + (100% - 4rem) * ${pctClamped / 100})` }}
                    style={{ translateY: '-50%' }} transition={{ duration: 0.8, ease: 'linear' }}>
                    <Bus size={11} className="text-white" strokeWidth={2} />
                  </motion.div>
                )}

                <div className="space-y-5">
                  {displayStops.map((stop, index) => {
                    const isDeparted = stop.status === 'departed';
                    const isCurrent = stop.status === 'current';
                    const isTerminal = stop.status === 'terminal';
                    const isUpcoming = stop.status === 'upcoming';
                    const dotStatus = isTerminal && isDeparted ? 'departed' : stop.status;

                    return (
                      <motion.div key={stop.id ?? index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isUpcoming ? 0.42 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-start gap-4 pl-1 relative">

                        {/* Dot */}
                        <div className="relative z-10 mt-0.5 flex-shrink-0">
                          <StopDot status={dotStatus} />
                        </div>

                        {/* Content + time */}
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-3 pb-1">
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm leading-snug truncate
                              ${isCurrent ? 'text-[#059669]' : 'text-[#101828]'}`}>
                              {stop.name}
                            </p>
                            <p className="text-[#667085] text-xs mt-0.5">{stop.city}</p>

                            {/* Status badge */}
                            <div className="mt-2">
                              {isDeparted && !isTerminal && (
                                <Badge variant={stop.type === 'boarding' ? 'success' : 'info'}>
                                  {stop.type === 'boarding'
                                    ? <><Bus size={9} strokeWidth={2.5} />Departed · {stop.displayTime}</>
                                    : <><MapPin size={9} strokeWidth={2.5} />Arrived · {stop.displayTime}</>
                                  }
                                </Badge>
                              )}
                              {isTerminal && isDeparted && (
                                <Badge variant="success">
                                  <CheckCircle2 size={9} strokeWidth={2.5} />Arrived at destination
                                </Badge>
                              )}
                              {isCurrent && (
                                <Badge variant="warning">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#F79009] animate-pulse flex-shrink-0" />
                                  Approaching · {stop.relTime}
                                </Badge>
                              )}
                              {isUpcoming && !isTerminal && (
                                <span className="text-[11px] text-[#98A2B3] font-medium">
                                  Scheduled · {stop.displayTime}
                                </span>
                              )}
                              {isTerminal && !isDeparted && (
                                <span className="text-[11px] text-[#98A2B3] font-medium">
                                  Final destination · {stop.displayTime}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Time */}
                          <div className="text-right flex-shrink-0 pt-px">
                            <p className={`text-base font-bold tabular-nums leading-tight
                              ${isCurrent ? 'text-[#059669]' : isDeparted ? 'text-[#344054]' : 'text-[#98A2B3]'}`}>
                              {stop.displayTime}
                            </p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3] mt-0.5">
                              {stop.type === 'boarding' ? 'Board' : 'Drop'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* ── Inside-bus toggle card ── */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0">
                    <UserCheck size={17} className="text-[#059669]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#101828] text-sm">Are you on this bus?</p>
                    <p className="text-[#667085] text-xs mt-0.5">Help other passengers by sharing your live location</p>
                  </div>
                </div>

                {/* Toggle */}
                <label className="relative cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={isInsideBus} onChange={handleLocationToggle} className="sr-only peer" />
                  <div className="
                    w-11 h-6 rounded-full bg-[#D0D5DD] transition-colors duration-200
                    peer-checked:bg-[#059669]
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:border after:border-white after:rounded-full
                    after:h-5 after:w-5 after:transition-all after:shadow-sm
                    peer-checked:after:translate-x-5
                  " />
                </label>
              </div>

              <AnimatePresence>
                {isInsideBus && (
                  <motion.div key="loc"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#ECFDF5] border-t border-[#A7F3D0]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <span className="absolute inset-0 animate-ping rounded-full bg-[#059669]/25" />
                          <span className="relative block w-2 h-2 rounded-full bg-[#059669]" />
                        </div>
                        <span className="text-[#047857] text-xs font-semibold whitespace-nowrap">Sharing live location</span>
                        {userLocation && (
                          <code className="text-[#047857]/65 text-[11px] bg-white/70 border border-[#A7F3D0] px-2 py-0.5 rounded font-mono hidden sm:block truncate">
                            {userLocation.lat}° N, {userLocation.lng}° E
                          </code>
                        )}
                      </div>
                      <Btn variant="outline"
                        onClick={() => { setIsInsideBus(false); setUserLocation(null); }}
                        className="flex-shrink-0 text-[11px] px-2.5 py-1.5 border-[#A7F3D0] text-[#047857] hover:bg-[#D1FAE5] rounded-lg">
                        <XCircle size={12} /> Stop
                      </Btn>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}

/* ─── Page wrapper ─────────────────────────────────────────────────────── */

export default function BusTrackerPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#059669] flex items-center justify-center shadow-lg shadow-[#059669]/20">
            <Bus size={26} className="text-white" />
          </div>
          <div className="flex items-center gap-2 text-[#667085] text-sm font-medium">
            <Loader2 size={14} className="animate-spin" />
            Loading tracker…
          </div>
        </main>
      }
    >
      <BusTrackerContent />
    </Suspense>
  );
}
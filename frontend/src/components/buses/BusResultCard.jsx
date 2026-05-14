'use client';

/**
 * BusResultCard - A compact, high-fidelity card representing a single bus search result.
 * Features: 4-column layout, dynamic rating colors, 24h format, and hover-reveal amenities.
 */
export default function BusResultCard({ bus, onSelect }) {
  // --- Data Normalization ---
  const busInfo = bus.bus || {};
  const busTypeInfo = busInfo.bus_type || {};
  const operatorInfo = busInfo.operator || {};

  const operatorName = operatorInfo.name || bus.operator_name || 'Bus Operator';
  const busNumber = busInfo.bus_number || bus.bus_number || '';
  const busTypeName = busTypeInfo.name || 'AC';

  const departureAt = bus.departure_at || bus.departure_time;
  const arrivalAt = bus.arrival_at || bus.arrival_time;
  const rating = Number(operatorInfo.rating || bus.rating || 3.6).toFixed(1);
  const amenities = bus.bus_amenities || [];
  const availableSeats = bus.available_count ?? 0;

  // --- Helper Functions ---

  // Dynamic color coding for ratings based on quality thresholds
  const getRatingColor = (r) => {
    const val = parseFloat(r);
    if (val >= 4.5) return 'bg-green-600';
    if (val >= 3.6) return 'bg-[#775a19]'; // Brand secondary/amber
    if (val >= 3.0) return 'bg-orange-500';
    return 'bg-red-600';
  };

  // Exact time extractor (extracts HH:mm exactly as sent from backend)
  const fmt24 = (iso) => {
    if (!iso) return '--:--';
    if (typeof iso !== 'string') return iso;
    
    // If ISO string (e.g., 2026-04-15T21:30:00Z), extract HH:mm part directly
    if (iso.includes('T')) {
      return iso.split('T')[1].substring(0, 5);
    }
    // If already a time string (e.g., 21:30:00), take first 5 chars
    return iso.substring(0, 5);
  };

  // Journey duration calculation
  const durationMinutes = busInfo.duration_minutes || bus.duration_minutes || 0;
  const durH = Math.floor(durationMinutes / 60);
  const durM = durationMinutes % 60;
  const durationStr = durH > 0 ? `${durH}h ${durM}m` : `${durM}m`;

  // --- Pricing Logic ---

  // Calculate starting fare based on the specific seat types provided by this bus
  let startingFare = 0;
  const layout = busTypeInfo.seat_layout || {};
  const providedTypes = [];
  if ((layout.seater?.rows || 0) > 0) providedTypes.push('seater');
  if ((layout.semi_sleeper?.rows || 0) > 0) providedTypes.push('semi_sleeper');
  if ((layout.sleeper?.lower_berths || 0) > 0 || (layout.sleeper?.upper_berths || 0) > 0) providedTypes.push('sleeper');

  if (bus.all_fares && bus.all_fares.length > 0) {
    const relevantFares = bus.all_fares.filter(f => providedTypes.includes((f.seat_type || '').toLowerCase()));
    const fareValues = relevantFares.map(f => f.price || f.amount || f.fare || f.value || 0).filter(p => p > 0);
    startingFare = fareValues.length > 0 ? Math.min(...fareValues) : 0;
  }

  // Fallback to top-level search prices if deep fare fetch failed
  if (startingFare === 0) {
    const prices = [bus.current_price_seater, bus.current_price_semi_sleeper, bus.current_price_sleeper].filter(p => p > 0);
    startingFare = prices.length > 0 ? Math.min(...prices) : (bus.starting_fare || 0);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col">
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

          {/* Column 1: Operator Branding & Bus Identity */}
          <div className="md:col-span-4 flex flex-col">
            <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5">{operatorName} - {busNumber}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{busTypeName}</p>
          </div>

          {/* Column 2: Trust Signals (Rating) */}
          <div className="md:col-span-1 flex justify-center md:justify-start">
            <div className={`${getRatingColor(rating)} text-white px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold shrink-0`}>
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {rating}
            </div>
          </div>

          {/* Column 3: Schedule, Duration & Real-time Availability */}
          <div className="md:col-span-4 flex items-center justify-between px-6 border-x border-gray-50">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 leading-none mb-1">{fmt24(departureAt)}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Departure</p>
            </div>

            <div className="flex flex-col items-center gap-1 px-4">
              <div className="flex items-center gap-1 text-gray-200">
                <div className="w-1 h-1 rounded-full bg-current" />
                <div className="w-6 h-[1px] border-t border-dashed border-current" />
                <div className="w-1 h-1 rounded-full bg-current" />
              </div>
              <p className="text-[9px] text-primary/50 font-bold uppercase tracking-tighter whitespace-nowrap">{durationStr} • {availableSeats} Seats</p>
            </div>

            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 leading-none mb-1">{fmt24(arrivalAt)}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Arrival</p>
            </div>
          </div>

          {/* Column 4: Pricing & Primary Call-to-Action */}
          <div className="md:col-span-3 flex flex-col items-end gap-1">
            <div className="text-right">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Starting from</p>
              <p className="text-xl font-bold text-gray-900 leading-none">₹{startingFare}</p>
            </div>

            <button
              onClick={onSelect}
              className="mt-2 px-6 py-2 bg-primary text-white rounded-full font-bold text-[12px] hover:bg-secondary hover:text-primary transition-all shadow-sm active:scale-[0.98] w-full"
            >
              View seats
            </button>
          </div>
        </div>
      </div>

      {/* Footer Section: Contextual Amenities (Single Line, No Scroll) */}
      <div className="h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300 border-t border-gray-100 overflow-hidden bg-white">
        <div className="px-4 py-2 flex items-center justify-between gap-x-2 whitespace-nowrap">
          {amenities.length > 0 ? (
            amenities.slice(0, 9).map((item, idx) => {
              const iconMap = {
                'WiFi': 'wifi',
                'USB Charging': 'usb',
                'Blanket': 'bed',
                'Reading Light': 'lightbulb',
                'Water Bottle': 'water_full',
                'Live Tracking': 'location_on',
                'Emergency Exit': 'exit_to_app',
                'Charging Point': 'bolt',
                'Pillow': 'bedroll',
                'AC Vent Control': 'air',
                'Reclining Seats': 'airline_seat_recline_normal'
              };
              const icon = iconMap[item] || 'verified';

              return (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  <span className="material-symbols-outlined text-gray-400 text-[10px]">{icon}</span>
                  <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-tighter">{item}</span>
                </div>
              );
            })
          ) : (
            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest px-2">Premium Experience Guaranteed</p>
          )}
        </div>
      </div>
    </div>
  );
}

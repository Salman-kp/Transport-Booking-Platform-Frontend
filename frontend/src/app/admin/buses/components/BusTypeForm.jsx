"use client";
import { useState } from 'react';
import { X, Check, AlertCircle, Settings, Layout, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AMENITY_OPTIONS = ["WiFi", "Water Bottle", "Charging Point", "Blanket", "Reading Light", "Emergency Exit", "Fire Extinguisher", "CCTV", "GPS Tracking"];

const LAYOUT_TEMPLATES = {
  "sleeper": { 
    "sleeper": { "rows": 4, "left_columns": 1, "right_columns": 1 } 
  },
  "semi_sleeper": { 
    "semi_sleeper": { "rows": 8, "left_columns": 2, "right_columns": 2 } 
  },
  "seater": { 
    "seater": { "rows": 8, "left_columns": 2, "right_columns": 3 } 
  },
};

export default function BusTypeForm({ initialData = {}, onSubmit, onCancel, submitting }) {
  const isEdit = !!initialData.id;

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    manufacturer: initialData.manufacturer || '',
    ac: initialData.ac ?? true,
    seat_layout: initialData.seat_layout ? (typeof initialData.seat_layout === 'string' ? initialData.seat_layout : JSON.stringify(initialData.seat_layout, null, 2)) : '',
    amenities: initialData.amenities || [],
  });

  const [selectedType, setSelectedType] = useState(() => {
    if (!initialData.seat_layout) return null;
    const layout = typeof initialData.seat_layout === 'string' ? JSON.parse(initialData.seat_layout) : initialData.seat_layout;
    return Object.keys(layout)[0] || null;
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const toggleAmenity = (amenity) => {
    const current = [...formData.amenities];
    const index = current.indexOf(amenity);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(amenity);
    }
    set('amenities', current);
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Bus type name is required';
    try {
      JSON.parse(formData.seat_layout);
    } catch (err) {
      e.seat_layout = 'Invalid JSON format for seat layout';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const payload = {
      ...formData,
      seat_layout: JSON.parse(formData.seat_layout),
      amenities: formData.amenities,
    };
    onSubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {isEdit ? 'Edit Type' : 'New Bus Type'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Type Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Scania Multi-Axle"
              className={`w-full px-5 py-3 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-slate-700`}
            />
            {errors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-1 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => set('manufacturer', e.target.value)}
              placeholder="e.g. Scania, Volvo, Tata"
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-bold text-slate-700"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 transition-all">
            <input
              type="checkbox"
              checked={formData.ac}
              onChange={(e) => set('ac', e.target.checked)}
              className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Air Conditioned (AC)</p>
            </div>
            <div className={`p-1.5 rounded-lg ${formData.ac ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
              <Zap size={14} fill={formData.ac ? "currentColor" : "none"} />
            </div>
          </label>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Amenities</label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight transition-all border ${
                    formData.amenities.includes(amenity)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Seat Layout</label>
              <div className="flex gap-1.5">
                {Object.keys(LAYOUT_TEMPLATES).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      set('seat_layout', JSON.stringify(LAYOUT_TEMPLATES[type], null, 2));
                      setSelectedType(type);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight border transition-all ${
                      selectedType === type
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={formData.seat_layout}
              onChange={(e) => set('seat_layout', e.target.value)}
              className={`w-full min-h-[100px] px-4 py-3 bg-slate-900 border ${errors.seat_layout ? 'border-red-500' : 'border-slate-800'} rounded-xl focus:outline-none transition-all font-mono text-[10px] text-emerald-400 resize-none`}
              spellCheck="false"
            />
            {errors.seat_layout && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-1 mt-1">{errors.seat_layout}</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-black text-slate-500 hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={14} />
            )}
            Save Type
          </button>
        </div>
      </form>
    </motion.div>
  );
}

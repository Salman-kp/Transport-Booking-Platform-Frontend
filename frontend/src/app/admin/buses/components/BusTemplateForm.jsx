"use client";
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BusTemplateForm({ initialData = {}, dropdowns = {}, onSubmit, onCancel, submitting }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    let hours, minutes;
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      hours = date.getUTCHours();
      minutes = date.getUTCMinutes();
    } else {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const [formData, setFormData] = useState({
    bus_number: initialData.bus_number || '',
    operator_id: initialData.operator_id || '',
    bus_type_id: initialData.bus_type_id || '',
    origin_stop_id: initialData.origin_stop_id || '',
    destination_stop_id: initialData.destination_stop_id || '',
    departure_time: formatTime(initialData.departure_time),
    arrival_time: formatTime(initialData.arrival_time),
    days_of_week: Array.isArray(initialData.days_of_week) 
      ? initialData.days_of_week.map(Number) 
      : (typeof initialData.days_of_week === 'string' 
          ? JSON.parse(initialData.days_of_week || '[]').map(Number) 
          : [])
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.bus_number.trim()) e.bus_number = "Bus number is required";
    if (!formData.operator_id) e.operator_id = "Operator is required";
    if (!formData.bus_type_id) e.bus_type_id = "Bus type is required";
    if (!formData.origin_stop_id) e.origin_stop_id = "Origin is required";
    if (!formData.destination_stop_id) e.destination_stop_id = "Destination is required";
    if (formData.origin_stop_id && formData.origin_stop_id === formData.destination_stop_id) {
      e.destination_stop_id = "Origin and destination cannot be the same";
    }
    if (!formData.departure_time) e.departure_time = "Departure time is required";
    if (!formData.arrival_time) e.arrival_time = "Arrival time is required";
    if (formData.days_of_week.length === 0) e.days_of_week = "Select at least one day";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const formatToISO = (time) => {
      if (!time) return null;
      if (time.includes('T')) return time;
      
      let finalTime = time.trim();
      // Handle AM/PM conversion to 24-hour format
      const match = finalTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const modifier = match[3].toUpperCase();
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        finalTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      return `1970-01-01T${finalTime}:00Z`;
    };

    const payload = {
      bus_number: formData.bus_number,
      operator_id: formData.operator_id,
      bus_type_id: formData.bus_type_id,
      origin_stop_id: formData.origin_stop_id,
      destination_stop_id: formData.destination_stop_id,
      departure_time: formatToISO(formData.departure_time),
      arrival_time: formatToISO(formData.arrival_time),
      // Use stringification for updates to avoid the 'record' error in GORM map-based updates
      days_of_week: initialData.id 
        ? JSON.stringify(formData.days_of_week.map(Number)) 
        : formData.days_of_week.map(Number),
      is_active: initialData.is_active ?? true
    };

    if (initialData.id) {
      payload.id = initialData.id;
    }

    onSubmit(payload);
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const current = prev.days_of_week || [];
      const next = current.includes(day) 
        ? current.filter(d => d !== day) 
        : [...current, day];
      return { ...prev, days_of_week: next.sort((a, b) => a - b) };
    });
    // Clear error if day is selected
    if (errors.days_of_week) setErrors(prev => ({ ...prev, days_of_week: null }));
  };

  const daysLabels = {1:'MON', 2:'TUE', 3:'WED', 4:'THU', 5:'FRI', 6:'SAT', 7:'SUN'};

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{initialData.id ? 'Edit Bus Template' : 'Add New Bus Template'}</h2>
            <p className="text-slate-500 font-medium mt-1">Configure bus route and schedule.</p>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bus Number</label>
              <input className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 ${errors.bus_number ? 'border-red-400' : 'border-slate-200'}`} placeholder="KL-01-AB-1234" value={formData.bus_number} onChange={e => {setFormData({...formData, bus_number: e.target.value}); if(errors.bus_number) setErrors({...errors, bus_number: null})}} />
              {errors.bus_number && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.bus_number}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Operator</label>
              <select className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.operator_id ? 'border-red-400' : 'border-slate-200'}`} value={formData.operator_id} onChange={e => {setFormData({...formData, operator_id: e.target.value}); if(errors.operator_id) setErrors({...errors, operator_id: null})}}>
                <option value="">Select Operator</option>
                {dropdowns.operators?.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
              </select>
              {errors.operator_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.operator_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bus Type</label>
              <select className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.bus_type_id ? 'border-red-400' : 'border-slate-200'}`} value={formData.bus_type_id} onChange={e => {setFormData({...formData, bus_type_id: e.target.value}); if(errors.bus_type_id) setErrors({...errors, bus_type_id: null})}}>
                <option value="">Select Type</option>
                {dropdowns.types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.bus_type_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.bus_type_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Origin Stop</label>
              <select className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.origin_stop_id ? 'border-red-400' : 'border-slate-200'}`} value={formData.origin_stop_id} onChange={e => {setFormData({...formData, origin_stop_id: e.target.value}); if(errors.origin_stop_id) setErrors({...errors, origin_stop_id: null})}}>
                <option value="">Select Origin</option>
                {dropdowns.stops?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
              {errors.origin_stop_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.origin_stop_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Destination Stop</label>
              <select className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.destination_stop_id ? 'border-red-400' : 'border-slate-200'}`} value={formData.destination_stop_id} onChange={e => {setFormData({...formData, destination_stop_id: e.target.value}); if(errors.destination_stop_id) setErrors({...errors, destination_stop_id: null})}}>
                <option value="">Select Destination</option>
                {dropdowns.stops?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
              </select>
              {errors.destination_stop_id && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.destination_stop_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Dep. Time (e.g. 02:30 PM)</label>
              <input type="text" className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.departure_time ? 'border-red-400' : 'border-slate-200'}`} placeholder="02:30 PM" value={formData.departure_time} onChange={e => {setFormData({...formData, departure_time: e.target.value}); if(errors.departure_time) setErrors({...errors, departure_time: null})}} />
              {errors.departure_time && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.departure_time}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Arr. Time (e.g. 05:30 PM)</label>
              <input type="text" className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${errors.arrival_time ? 'border-red-400' : 'border-slate-200'}`} placeholder="05:30 PM" value={formData.arrival_time} onChange={e => {setFormData({...formData, arrival_time: e.target.value}); if(errors.arrival_time) setErrors({...errors, arrival_time: null})}} />
              {errors.arrival_time && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.arrival_time}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Running Days</label>
              <div className="flex gap-2 justify-between">
                {[1,2,3,4,5,6,7].map(day => {
                  const active = formData.days_of_week.includes(day);
                  return (
                    <button 
                      key={day} 
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                        active ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                      } ${errors.days_of_week ? 'border-red-400' : ''}`}
                    >
                      {daysLabels[day]}
                    </button>
                  );
                })}
              </div>
              {errors.days_of_week && <p className="text-red-500 text-[10px] mt-2 font-bold text-center">{errors.days_of_week}</p>}
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Discard
          </button>
          <button disabled={submitting} className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Check size={20} />}
            {submitting ? 'Saving...' : `Save Template`}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

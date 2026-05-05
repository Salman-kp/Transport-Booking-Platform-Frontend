"use client";
import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BusStopForm({ initialData = {}, onSubmit, onCancel, submitting }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    city: initialData.city || '',
    state: initialData.state || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{initialData.id ? 'Edit Bus Stop' : 'Add New Bus Stop'}</h2>
            <p className="text-slate-500 font-medium mt-1">Configure boarding and dropping points.</p>
          </div>
          <button type="button" onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Stop Name</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Madurai Central" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">City</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500" placeholder="Madurai" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">State</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500" placeholder="Tamil Nadu" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Discard
          </button>
          <button disabled={submitting} className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Check size={20} />}
            {submitting ? 'Saving...' : `Save Stop`}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

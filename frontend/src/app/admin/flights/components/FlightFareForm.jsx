"use client";
import { useState } from 'react';
import { flightApi } from '@/lib/flightApi';
import { X, Check, DollarSign, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FlightFareForm({ instance, onSubmit, onCancel, submitting }) {
  const [formData, setFormData] = useState({
    economy_price: instance.base_price_economy || 0,
    business_price: instance.base_price_business || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Update Fares</h2>
            <p className="text-slate-400 font-medium mt-0.5">Override prices for Flight {instance.flight?.flight_number}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Economy Class Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                required
                type="number"
                value={formData.economy_price}
                onChange={(e) => setFormData({...formData, economy_price: parseFloat(e.target.value)})}
                className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Business Class Price</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                required
                type="number"
                value={formData.business_price}
                onChange={(e) => setFormData({...formData, business_price: parseFloat(e.target.value)})}
                className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <Zap size={20} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Updating these fares will override the base template prices for this specific flight instance only.
            </p>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-slate-900 text-white hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Check size={20} />}
            {submitting ? 'Updating...' : 'Update Fares'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

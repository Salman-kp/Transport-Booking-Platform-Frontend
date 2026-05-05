"use client";
import { useState } from 'react';
import { X, Check, AlertCircle, Clock, Percent, IndianRupee, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CancellationPolicyForm({ initialData = {}, onSubmit, onCancel, submitting }) {
  const isEdit = !!initialData.id;

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    hours_before_departure: initialData.hours_before_departure ?? 24,
    refund_percentage: initialData.refund_percentage ?? 80,
    cancellation_fee: initialData.cancellation_fee ?? 0,
    is_active: initialData.is_active ?? true,
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Policy name is required';
    const hours = parseInt(formData.hours_before_departure);
    if (isNaN(hours) || hours < 0) e.hours = 'Must be 0 or more hours';
    const refund = parseFloat(formData.refund_percentage);
    if (isNaN(refund) || refund < 0 || refund > 100) e.refund = 'Must be between 0% and 100%';
    const fee = parseFloat(formData.cancellation_fee);
    if (isNaN(fee) || fee < 0) e.fee = 'Fee cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      ...(isEdit && { id: initialData.id }),
      hours_before_departure: parseInt(formData.hours_before_departure),
      refund_percentage: parseFloat(formData.refund_percentage),
      cancellation_fee: parseFloat(formData.cancellation_fee),
    };
    onSubmit(payload);
  };

  const refundPct = Math.min(Math.max(parseFloat(formData.refund_percentage) || 0, 0), 100);

  const getRefundGrade = () => {
    if (refundPct >= 75) return { color: 'text-emerald-600', bar: 'bg-emerald-500', label: 'Generous', bg: 'bg-emerald-50' };
    if (refundPct >= 40) return { color: 'text-amber-600', bar: 'bg-amber-400', label: 'Moderate', bg: 'bg-amber-50' };
    return { color: 'text-red-500', bar: 'bg-red-400', label: 'Strict', bg: 'bg-red-50' };
  };
  const grade = getRefundGrade();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
              {isEdit ? 'Editing Policy' : 'New Policy'}
            </p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? formData.name || 'Cancellation Policy' : 'Cancellation Policy'}
            </h2>
            <p className="text-slate-400 font-medium mt-0.5 text-sm">
              Define when and how much a customer is refunded.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Refund Preview */}
        <div className={`${grade.bg} border border-slate-200/60 rounded-2xl p-4 mb-6`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className={grade.color} />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Refund Preview</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${grade.bg} ${grade.color} border border-current/20`}>
                {grade.label}
              </span>
              <span className={`text-2xl font-black ${grade.color}`}>{refundPct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="w-full bg-white/70 rounded-full h-2 border border-slate-200/50">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${grade.bar}`}
              style={{ width: `${refundPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-slate-400 font-bold">0% — No Refund</span>
            <span className="text-[9px] text-slate-400 font-bold">100% — Full Refund</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Policy Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Policy Name
            </label>
            <input
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
              placeholder="e.g. Early Cancellation (> 24 hours)"
              value={formData.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />{errors.name}
              </p>
            )}
          </div>

          {/* Three numeric fields */}
          <div className="grid grid-cols-3 gap-3">
            {/* Hours Before Departure */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock size={9} /> Hours Before
                </span>
              </label>
              <input
                type="number" min="0"
                className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all ${errors.hours ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                value={formData.hours_before_departure}
                onChange={e => set('hours_before_departure', e.target.value)}
              />
              {errors.hours && (
                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-0.5">
                  <AlertCircle size={10} />{errors.hours}
                </p>
              )}
            </div>

            {/* Refund Percentage */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Percent size={9} /> Refund %
                </span>
              </label>
              <input
                type="number" min="0" max="100" step="0.5"
                className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all ${errors.refund ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                value={formData.refund_percentage}
                onChange={e => set('refund_percentage', e.target.value)}
              />
              {errors.refund && (
                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-0.5">
                  <AlertCircle size={10} />{errors.refund}
                </p>
              )}
            </div>

            {/* Cancellation Fee */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <IndianRupee size={9} /> Cancel Fee
                </span>
              </label>
              <input
                type="number" min="0" step="0.01"
                className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all ${errors.fee ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                value={formData.cancellation_fee}
                onChange={e => set('cancellation_fee', e.target.value)}
              />
              {errors.fee && (
                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-0.5">
                  <AlertCircle size={10} />{errors.fee}
                </p>
              )}
            </div>
          </div>

          {/* Policy Summary */}
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Policy Summary</p>
            <p className="text-sm font-bold text-slate-600">
              Cancellations made{' '}
              <span className="text-slate-900">&gt;{formData.hours_before_departure || 0} hours</span>{' '}
              before departure receive a{' '}
              <span className={grade.color}>{refundPct.toFixed(0)}% refund</span>{' '}
              with a <span className="text-slate-900">${parseFloat(formData.cancellation_fee || 0).toFixed(2)}</span> cancellation fee.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Active Policy</p>
              <p className="text-xs text-slate-400">Apply this policy during customer cancellations.</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_active', !formData.is_active)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
              aria-label="Toggle active"
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[2] py-3.5 px-6 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <Check size={18} />
            }
            {submitting ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

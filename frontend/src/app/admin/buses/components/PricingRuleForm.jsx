"use client";
import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RULE_TYPES = ['DEMAND', 'TIME_TO_DEPARTURE', 'WEEKEND', 'SEASONAL', 'LOYALTY'];

const CONDITION_TEMPLATES = {
  DEMAND: { fill_rate_above: 0.75 },
  TIME_TO_DEPARTURE: { hours_before_departure_below: 24 },
  WEEKEND: { days: [6, 7] },
  SEASONAL: { month_in: [12, 1] },
  LOYALTY: { min_bookings: 5 },
};

const CONDITION_FIELD_LABELS = {
  fill_rate_above: 'Fill Rate Above (0–1)',
  hours_before_departure_above: 'Hours Before Departure Above',
  hours_before_departure_below: 'Hours Before Departure Below',
  days: 'Days (comma-separated integers)',
  month_in: 'Months (comma-separated 1–12)',
  min_bookings: 'Minimum Past Bookings',
};

export default function PricingRuleForm({ initialData = {}, onSubmit, onCancel, submitting }) {
  const isEdit = !!initialData.id;

  const parseConditions = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return {}; }
  };

  const [formData, setFormData] = useState({
    name: initialData.name || '',
    rule_type: initialData.rule_type || 'DEMAND',
    multiplier: initialData.multiplier ?? 1.0,
    priority: initialData.priority ?? 10,
    is_active: initialData.is_active ?? true,
    conditions: parseConditions(initialData.conditions),
  });

  const [errors, setErrors] = useState({});

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleRuleTypeChange = (type) => {
    set('rule_type', type);
    set('conditions', CONDITION_TEMPLATES[type] || {});
  };

  const updateConditionField = (key, rawVal) => {
    let val = rawVal;
    if (typeof CONDITION_TEMPLATES[formData.rule_type]?.[key] === 'number') {
      val = parseFloat(rawVal) || 0;
    }
    if (Array.isArray(CONDITION_TEMPLATES[formData.rule_type]?.[key])) {
      val = rawVal.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    }
    set('conditions', { ...formData.conditions, [key]: val });
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.rule_type) e.rule_type = 'Rule type is required';
    if (formData.multiplier <= 0) e.multiplier = 'Multiplier must be greater than 0';
    if (Object.keys(formData.conditions).length === 0) e.conditions = 'At least one condition is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...formData,
      ...(isEdit && { id: initialData.id }),
      conditions: formData.conditions,
      multiplier: parseFloat(formData.multiplier),
      priority: parseInt(formData.priority),
    };
    onSubmit(payload);
  };

  const conditionKeys = Object.keys(formData.conditions);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
    >
      <form onSubmit={handleSubmit} className="p-8 sm:p-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Edit Pricing Rule' : 'New Pricing Rule'}
            </h2>
            <p className="text-slate-400 font-medium mt-1 text-sm">Configure how fares are multiplied.</p>
          </div>
          <button type="button" onClick={onCancel} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Rule Name</label>
            <input
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="e.g. High Demand Surge"
              value={formData.name}
              onChange={e => set('name', e.target.value)}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          {/* Rule Type */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Rule Type</label>
            <div className="grid grid-cols-3 gap-2">
              {RULE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleRuleTypeChange(type)}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    formData.rule_type === type
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Conditions</label>
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
              {conditionKeys.length === 0 && (
                <p className="text-xs text-slate-400 italic">Select a Rule Type to auto-populate conditions.</p>
              )}
              {conditionKeys.map(key => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">{CONDITION_FIELD_LABELS[key] || key}</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500"
                    value={Array.isArray(formData.conditions[key]) ? formData.conditions[key].join(', ') : formData.conditions[key]}
                    onChange={e => updateConditionField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            {errors.conditions && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.conditions}</p>}
          </div>

          {/* Multiplier & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Multiplier</label>
              <div className="relative">
                <input
                  type="number" step="0.01" min="0.01"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 ${errors.multiplier ? 'border-red-400' : 'border-slate-200'}`}
                  value={formData.multiplier}
                  onChange={e => set('multiplier', e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">×</span>
              </div>
              {errors.multiplier && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.multiplier}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Priority</label>
              <input
                type="number" min="1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500"
                value={formData.priority}
                onChange={e => set('priority', e.target.value)}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Active</p>
              <p className="text-xs text-slate-400">Rule will be applied to fare calculations.</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_active', !formData.is_active)}
              className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Discard
          </button>
          <button
            disabled={submitting}
            className="flex-[2] py-3.5 px-6 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
            {submitting ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

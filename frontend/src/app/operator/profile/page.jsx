"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { busApi } from '@/lib/busApi';
import { motion } from 'framer-motion';
import { 
  User, Mail, Shield, Building2, Hash, 
  Percent, Phone, Star, Loader2,
  Briefcase, ShieldCheck, Fingerprint,
  Wallet, TrendingUp, AlertCircle
} from 'lucide-react';

export default function OperatorProfile() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOperatorProfile();
  }, []);

  const fetchOperatorProfile = async () => {
    try {
      setLoading(true);
      const response = await busApi.operator.getProfile();
      // The backend now returns { operator_user: ..., operator: ... }
      setProfileData(response);
    } catch (err) {
      console.error("Profile fetch error:", err);
      // We don't set a hard error here anymore because we want to show the basic profile
      setError(err.response?.data?.message || 'Connection to fleet service failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Authentication Verified. Loading Profile...</p>
      </div>
    );
  }

  const opUser = profileData?.operator_user;
  const company = profileData?.operator;
  const isLinked = !!opUser;

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-20">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-8 flex justify-between items-end">
        <div>
          <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em] block mb-3">Identity & Access</span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Profile Settings</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage your personal credentials and organization configuration.</p>
        </div>
        {!isLinked && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-3 flex items-center gap-3 animate-pulse">
            <AlertCircle size={18} className="text-amber-500" />
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Awaiting Organization Link</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Account Info */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-bl-[5rem] -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-8 border-4 border-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Traveler'}</h3>
              <p className="text-slate-500 font-bold text-xs mt-1 break-all">{user?.email}</p>
              
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="px-5 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <Fingerprint size={12} className="text-emerald-400" /> {user?.role}
                </span>
                <span className="px-5 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-emerald-100">
                  <ShieldCheck size={12} /> Verified
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Organization Role</h4>
              <Briefcase size={18} className="text-slate-500" />
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Position</p>
                  <p className="text-sm font-black text-emerald-400 uppercase mt-1">{opUser?.role || 'NOT LINKED'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Shield size={18} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credit Limit</p>
                  <p className="text-sm font-black text-white mt-1">₹{opUser?.credit_limit?.toLocaleString() || '0'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Utilized Credit</p>
                  <p className="text-sm font-black text-rose-400 mt-1">₹{opUser?.credit_used?.toLocaleString() || '0'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Organization Info */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden"
          >
            {!isLinked && (
              <div className="p-8 bg-amber-50/50 border-b border-amber-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                  <AlertCircle size={20} />
                </div>
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                  Action Required: Your profile is not yet linked to an organization. Please contact the administrator to complete your registration.
                </p>
              </div>
            )}
            
            <div className="p-10 border-b border-slate-100 bg-slate-50/30">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-28 h-28 bg-white border-2 border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 shadow-sm">
                    <Building2 size={48} />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <span className={`px-3 py-1 ${isLinked ? 'bg-emerald-500' : 'bg-slate-400'} text-white text-[9px] font-black rounded-lg uppercase tracking-widest`}>
                      {isLinked ? 'Official Partner' : 'Awaiting Link'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-black text-slate-900">{company?.rating || '0.0'}</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{company?.name || 'Organization Name'}</h3>
                  <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Organization Code: {company?.operator_code || 'PENDING'}</p>
                </div>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Mail size={12} className="text-emerald-500" /> Primary Contact
                </label>
                <p className="text-lg font-black text-slate-900 break-all">{company?.contact_email || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone size={12} className="text-emerald-500" /> Support Hotline
                </label>
                <p className="text-lg font-black text-slate-900">{company?.contact_phone || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Percent size={12} className="text-emerald-500" /> Settlement Rate
                </label>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-black text-slate-900">{company?.commission_rate || '0'}%</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee Structure</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash size={12} className="text-emerald-500" /> Organization ID
                </label>
                <p className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">{company?.id || 'PENDING'}</p>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100">
              <div className="flex items-start gap-4 text-slate-500 text-xs font-bold leading-relaxed">
                <ShieldCheck size={24} className="text-emerald-500 shrink-0" />
                <p>Your organization profile is locked for security. To modify any core business details, please submit a request to the <span className="text-emerald-600 underline cursor-pointer">Central Administration</span> with supporting documentation.</p>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

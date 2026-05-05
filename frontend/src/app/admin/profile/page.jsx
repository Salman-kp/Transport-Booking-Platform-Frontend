"use client";

import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { User, Mail, Shield, ShieldCheck, Calendar } from 'lucide-react';

export default function AdminProfile() {
  const { user } = useAuthStore();

  if (!user) return null;

  const adminDetails = [
    { label: 'Full Name', value: user.name || 'N/A', icon: <User size={18} /> },
    { label: 'Email Address', value: user.email || 'N/A', icon: <Mail size={18} /> },
    { label: 'Administrative Role', value: user.role?.toUpperCase() || 'ADMIN', icon: <Shield size={18} />, highlight: true },
    { label: 'Account Status', value: 'Active', icon: <ShieldCheck size={18} /> },
    { label: 'Last Login', value: new Date().toLocaleDateString(), icon: <Calendar size={18} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <span className="text-secondary font-label text-[10px] font-black uppercase tracking-[0.3em] block mb-2">Management</span>
        <h1 className="text-3xl font-headline text-primary tracking-tight">Admin Profile</h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] border border-slate-200 shadow-lg shadow-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[380px]"
      >
        {/* Medium Side: Profile Circle */}
        <div className="w-full md:w-64 bg-slate-50/50 flex flex-col items-center justify-center p-8 border-r border-slate-100">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary/20 mb-6 border-4 border-white">
            {user.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <h2 className="text-xl font-black text-slate-900 text-center">{user.name || 'Administrator'}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 px-3 py-1 bg-white rounded-full border border-slate-100">
            {user.role || 'Super Admin'}
          </p>
        </div>

        {/* Medium Side: Details */}
        <div className="flex-1 p-10 flex flex-col justify-center space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            Account Information
          </h3>
          
          <div className="grid grid-cols-1 gap-5">
            {adminDetails.map((detail, i) => (
              <div key={i} className="flex items-center gap-5 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 border border-slate-100 shrink-0">
                  {detail.icon}
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{detail.label}</p>
                  <p className={`text-base font-bold ${detail.highlight ? 'text-primary' : 'text-slate-700'}`}>
                    {detail.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-widest opacity-80">
              Administrative Access Verified
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

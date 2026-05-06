"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Bus, CalendarCheck, UserCircle, LogOut, X, ClipboardList } from 'lucide-react';

export default function OperatorSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/operator', icon: LayoutDashboard },
    { name: 'Fleet & Manifest', href: '/operator/bookings', icon: ClipboardList },
    { name: 'Profile', href: '/operator/profile', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 h-screen bg-slate-950 text-white flex flex-col border-r border-slate-800 z-[70] shadow-xl transition-transform duration-300 ease-in-out
        w-64 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-3xl font-editorial italic tracking-tight flex items-center text-white">
            Tripneo 
            <span className="text-[9px] bg-emerald-500 text-white font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm not-italic ml-3 mt-1 shadow-md">OPERATOR</span>
          </h1>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/operator' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-xs tracking-widest uppercase font-bold relative overflow-hidden ${
                  isActive 
                    ? 'text-emerald-950' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="operatorActiveNav"
                    className="absolute inset-0 bg-emerald-500 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl" />
                )}
                <span className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-950' : ''}`}>
                  <item.icon size={20} />
                </span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all text-[10px] tracking-widest uppercase font-bold relative overflow-hidden group"
          >
            <span className="relative z-10 group-hover:-translate-x-1 transition-transform">
              <LogOut size={18} />
            </span>
            <span className="relative z-10">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

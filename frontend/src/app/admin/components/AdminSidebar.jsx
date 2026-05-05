"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { name: 'Buses', href: '/admin/buses', icon: 'directions_bus' },
    { name: 'Flights', href: '/admin/flights', icon: 'flight' },
    { name: 'Users', href: '/admin/users', icon: 'group' },
    { name: 'Chats', href: '/admin/chat', icon: 'forum' },
    { name: 'Profile', href: '/admin/profile', icon: 'account_circle' },
  ];

  return (
    <div className="w-64 h-screen bg-primary text-white flex flex-col fixed left-0 top-0 border-r border-outline-variant/20 z-50 shadow-xl">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-3xl font-headline italic tracking-tight flex items-center">
          Tripneo 
          <span className="font-label text-[9px] bg-secondary text-primary uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm not-italic ml-3 mt-1 shadow-md">ADMIN</span>
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all font-label text-xs tracking-widest uppercase font-bold relative overflow-hidden ${
                isActive 
                  ? 'text-primary' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-secondary rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ zIndex: 0 }}
                />
              )}
              {!isActive && (
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-lg" />
              )}
              <span className={`material-symbols-outlined text-xl relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary font-medium' : ''}`}>{item.icon}</span>
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/50 hover:bg-error hover:text-white transition-all font-label text-[10px] tracking-widest uppercase font-bold relative overflow-hidden group"
        >
          <span className="material-symbols-outlined text-lg relative z-10 group-hover:-translate-x-1 transition-transform">logout</span>
          <span className="relative z-10">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

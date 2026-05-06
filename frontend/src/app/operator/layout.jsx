"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import OperatorSidebar from './components/OperatorSidebar';
import { Loader2, Menu } from 'lucide-react';

export default function OperatorLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        logout();
        router.push('/');
      } else {
        const isOperator = user?.role === 'operator';
        if (!isOperator) {
          router.push('/');
        }
      }
    }
  }, [mounted, isAuthenticated, user, router, pathname, logout]);

  if (!mounted || !isAuthenticated || user?.role !== 'operator') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
          <p className="text-slate-400 font-medium animate-pulse">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OperatorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <h1 className="text-xl font-editorial italic tracking-tight flex items-center text-slate-900">
            Tripneo 
            <span className="text-[8px] bg-emerald-500 text-white font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm not-italic ml-2">OP</span>
          </h1>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:ml-64 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

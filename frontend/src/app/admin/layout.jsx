"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import AdminSidebar from './components/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        router.push('/');
      } else {
        const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
        if (!isAdmin) {
          router.push('/');
        }
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated) {
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
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
}

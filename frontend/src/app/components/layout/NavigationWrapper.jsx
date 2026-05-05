"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import ChatWidget from './ChatWidget';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!isAdminRoute && <ChatWidget />}
    </>
  );
}

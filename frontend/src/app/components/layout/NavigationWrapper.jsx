"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import ChatWidget from './ChatWidget';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isOperatorRoute = pathname?.startsWith('/operator');
  const hideNav = isAdminRoute || isOperatorRoute;

  return (
    <>
      {!hideNav && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!hideNav && <ChatWidget />}
    </>
  );
}

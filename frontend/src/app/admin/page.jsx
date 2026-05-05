"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OverviewAnalysis from './components/OverviewAnalysis';
import BusAnalysis from './components/BusAnalysis';
import FlightAnalysis from './components/FlightAnalysis';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'bus', label: 'Bus Analysis', icon: 'directions_bus' },
    { id: 'flight', label: 'Flight Analysis', icon: 'flight' }
  ];

  return (
    <div className="max-w-[1280px] mx-auto min-h-[calc(100vh-80px)]">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-outline-variant/20 pb-6 gap-6"
      >
        <div>
          <span className="text-secondary font-label text-[10px] font-bold uppercase tracking-[0.3em] block mb-3">Analytics Engine</span>
          <h1 className="text-4xl font-headline text-primary tracking-tight">Admin Dashboard</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-label text-xs tracking-widest uppercase font-bold transition-colors ${
                activeTab === tab.id ? 'text-white' : 'text-primary hover:bg-white/50'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeAdminTab"
                  className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="material-symbols-outlined text-[16px] relative z-10">{tab.icon}</span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content Area */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <OverviewAnalysis />
            </motion.div>
          )}
          {activeTab === 'bus' && (
            <motion.div key="bus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <BusAnalysis />
            </motion.div>
          )}
          {activeTab === 'flight' && (
            <motion.div key="flight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <FlightAnalysis />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

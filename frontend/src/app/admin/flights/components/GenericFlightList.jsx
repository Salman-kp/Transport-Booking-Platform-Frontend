"use client";
import { useState, useEffect } from 'react';
import { flightApi } from '@/lib/flightApi';
import { Building, MapPin, Search, Globe, Hash, ShieldCheck, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GenericFlightList({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    try {
      setLoading(true);
      let data = [];
      if (type === 'airports') {
        data = await flightApi.searchAirports('');
      } else if (type === 'airlines') {
        data = await flightApi.getAirlines();
      }
      setItems(data);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    (item.name || item.model || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.iata_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.city || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Fetching {type}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={`Search ${type}...`} 
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-lg hover:shadow-slate-100 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                  {type === 'airports' ? (
                    <MapPin size={22} className="text-emerald-600" />
                  ) : (
                    <Building size={22} className="text-emerald-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black tracking-widest uppercase">
                      {item.iata_code}
                    </span>
                    {item.city && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.city}, {item.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {type === 'airports' && (
              <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timezone</p>
                  <p className="text-xs font-bold text-slate-600">{item.time_zone}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordinates</p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {item.latitude?.toFixed(2)}, {item.longitude?.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {type === 'airlines' && (
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {item.logo_url && (
                   <img src={item.logo_url} alt={item.name} className="h-6 object-contain grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100" />
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
          <XCircle size={40} className="mb-4 opacity-20" />
          <h3 className="text-lg font-bold">No results found</h3>
          <p className="text-sm">Try adjusting your search or sync again.</p>
        </div>
      )}
    </div>
  );
}

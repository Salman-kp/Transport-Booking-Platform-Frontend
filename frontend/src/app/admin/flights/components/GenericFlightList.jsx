"use client";
import { useState, useEffect } from 'react';
import { flightApi } from '@/lib/flightApi';
import { Building, MapPin, Search, Globe, Hash, ShieldCheck, XCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GenericFlightList({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (type === 'airlines') {
      loadData();
    } else {
      // Airports need search, but we can try a default one like "New" or "Lon"
      loadData('New');
    }
  }, [type]);

  const loadData = async (query = '') => {
    try {
      setLoading(true);
      let data = [];
      if (type === 'airports') {
        data = await flightApi.searchAirports(query || search || 'New');
      } else if (type === 'airlines') {
        data = await flightApi.getAirlines();
      }
      setItems(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (type === 'airports' && search.length < 3) {
      alert("Please enter at least 3 characters to search airports");
      return;
    }
    loadData(search);
  };

  const filteredItems = items.filter(item => 
    (item.name || item.model || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.iata_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${type}... ${type === 'airports' ? '(min 3 chars)' : ''}`} 
            className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {type === 'airports' && (
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-colors">
              Search
            </button>
          )}
        </form>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {type}</span>
            <p className="text-xl font-black text-slate-900 leading-none">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold animate-pulse">Syncing {type}...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-slate-400 text-center">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
              {type === 'airports' ? <MapPin size={40} className="text-slate-200" /> : <Building size={40} className="text-slate-200" />}
            </div>
            <h3 className="text-lg font-black text-slate-600 uppercase tracking-tight">No {type} Found</h3>
            {type === 'airports' && <p className="text-sm mt-1">Please enter a search term (min 3 characters) to find airports.</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-left">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {type === 'airports' ? 'Airport Name' : 'Airline Name'}
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {type === 'airports' ? 'IATA / ICAO' : 'IATA Code'}
                    </th>
                    {type === 'airports' && (
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                    )}
                    {type === 'airports' ? (
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specs</th>
                    ) : (
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    )}
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedItems.map((item) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={item.id}
                      className="hover:bg-slate-50/30 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                            {type === 'airports' ? <MapPin size={18} className="text-emerald-600" /> : <Building size={18} className="text-emerald-600" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 tracking-tight">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {item.id?.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-widest uppercase w-fit">
                            {item.iata_code || '---'}
                          </span>
                          {type === 'airports' && item.icao_code && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.icao_code}</span>
                          )}
                        </div>
                      </td>
                      {type === 'airports' && (
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700">{item.city || '---'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.country || '---'}</span>
                          </div>
                        </td>
                      )}
                      {type === 'airports' ? (
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TZ: {item.time_zone}</span>
                            <span className="text-[9px] font-bold text-slate-400">{item.latitude?.toFixed(2)}, {item.longitude?.toFixed(2)}</span>
                          </div>
                        </td>
                      ) : (
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            item.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                          }`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      )}
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                            <Info size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of {filteredItems.length}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

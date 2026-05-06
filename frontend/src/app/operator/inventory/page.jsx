"use client";

import { useState, useEffect } from 'react';
import { busApi } from '@/lib/busApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Plus, Search, XCircle, Users,
  ArrowUpRight, Package
} from 'lucide-react';

export default function OperatorInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoryBookings, setInventoryBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [loadForm, setLoadForm] = useState({
    bus_instance_id: '',
    fare_type_id: '',
    seat_type: 'SEATER',
    quantity_loaded: 1,
    wholesale_price: 0,
    selling_price: 0,
    expires_at: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await busApi.operator.getInventory();
      setInventory(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInventory = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...loadForm,
        quantity_loaded: parseInt(loadForm.quantity_loaded),
        wholesale_price: parseFloat(loadForm.wholesale_price),
        selling_price: parseFloat(loadForm.selling_price),
        expires_at: new Date(loadForm.expires_at).toISOString()
      };
      await busApi.operator.loadInventory(payload);
      setIsModalOpen(false);
      fetchInventory();
      setLoadForm({
        bus_instance_id: '', fare_type_id: '', seat_type: 'SEATER',
        quantity_loaded: 1, wholesale_price: 0, selling_price: 0, expires_at: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const viewBookings = async (inv) => {
    try {
      setSelectedInventory(inv);
      setLoadingBookings(true);
      const data = await busApi.operator.getInventoryBookings(inv.id);
      setInventoryBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.bus_instance?.bus?.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bus_instance_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fare_type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.seat_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Inventory Manifest Synchronizing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-slate-100 pb-8">
        <div>
          <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.3em] block mb-3">Asset Allocation</span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Fleet Inventory</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage deployment blocks and retail pricing structures.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Bus No, Class, or ID..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all active:scale-95"
          >
            <Plus size={16} /> Deploy Stock
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredInventory.map((item, index) => (
            <motion.div 
              layout key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-500">
                    <Package size={24} />
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                      item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {item.status}
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: {item.id?.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Instance Target</p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight break-all uppercase">
                    {item.bus_instance?.bus?.bus_number || item.bus_instance_id}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg uppercase tracking-widest">
                      {item.fare_type?.name || item.seat_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50 my-auto">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Retail Price</p>
                    <p className="text-lg font-black text-slate-900">₹{item.selling_price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Cost</p>
                    <p className="text-sm font-bold text-slate-400 italic">₹{item.wholesale_price}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className={item.quantity_loaded - item.quantity_sold < 5 ? 'text-rose-500' : 'text-slate-900'}>
                      {item.quantity_loaded - item.quantity_sold} Units Remaining
                    </span>
                    <span className="text-slate-400">{item.quantity_loaded} Total</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${(item.quantity_sold / item.quantity_loaded) * 100}%` }}
                      className={`h-full rounded-full ${item.quantity_sold / item.quantity_loaded > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button 
                    onClick={() => viewBookings(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Users size={14} /> Analytics
                  </button>
                  <button className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-2xl transition-all">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bookings Side Panel */}
      <AnimatePresence>
        {selectedInventory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end overflow-hidden p-4 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInventory(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto sm:rounded-l-[3rem] border-l border-white/20"
            >
              <div className="p-8 sm:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Inventory Analytics</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">ID: {selectedInventory.id}</p>
                  </div>
                  <button onClick={() => setSelectedInventory(null)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Reservation Stream...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-50 p-6 rounded-3xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmed Sales</p>
                        <p className="text-3xl font-black text-slate-900">{inventoryBookings.length}</p>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-3xl">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Est. Revenue</p>
                        <p className="text-3xl font-black text-emerald-700">₹{(inventoryBookings.length * selectedInventory.selling_price).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Passengers</h4>
                      {inventoryBookings.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 italic font-bold">No bookings found for this inventory block.</div>
                      ) : (
                        <div className="space-y-3">
                          {inventoryBookings.map((b, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500/20 transition-all shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <Users size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                    {b.pnr} {b.passengers?.length > 0 ? `- ${b.passengers[0].first_name} ${b.passengers[0].last_name}` : ''}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(b.created_at).toLocaleDateString()} · {b.passengers?.length || 0} Pax</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-600">₹{b.total_amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deployment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase">Deploy Asset</h3>
                    <p className="text-slate-500 font-medium mt-1">Configure stock allocation and pricing.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl">
                    <XCircle size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleLoadInventory} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance Reference</label>
                      <input required type="text" value={loadForm.bus_instance_id} onChange={e => setLoadForm({...loadForm, bus_instance_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" placeholder="UUID" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fare Tier ID</label>
                      <input required type="text" value={loadForm.fare_type_id} onChange={e => setLoadForm({...loadForm, fare_type_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" placeholder="UUID" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fleet Category</label>
                      <select value={loadForm.seat_type} onChange={e => setLoadForm({...loadForm, seat_type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none">
                        <option value="SEATER">Seater Class</option>
                        <option value="SLEEPER">Sleeper Class</option>
                        <option value="SEMI_SLEEPER">Semi-Sleeper Class</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocation Quantity</label>
                      <input required type="number" min="1" value={loadForm.quantity_loaded} onChange={e => setLoadForm({...loadForm, quantity_loaded: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wholesale Cost (₹)</label>
                      <input required type="number" step="0.01" value={loadForm.wholesale_price} onChange={e => setLoadForm({...loadForm, wholesale_price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Rate (₹)</label>
                      <input required type="number" step="0.01" value={loadForm.selling_price} onChange={e => setLoadForm({...loadForm, selling_price: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiration Timeline</label>
                    <input required type="datetime-local" value={loadForm.expires_at} onChange={e => setLoadForm({...loadForm, expires_at: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                  </div>

                  <button 
                    disabled={submitting} type="submit"
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl shadow-emerald-500/20"
                  >
                    {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Execute Deployment'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

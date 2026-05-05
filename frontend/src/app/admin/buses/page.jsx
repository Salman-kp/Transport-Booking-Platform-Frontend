"use client";

import { useState, useEffect } from 'react';
import { Bus, MapPin, Building, GitMerge, Plus, Search, Trash2, X, Check, ShieldCheck, ShieldAlert, Eye, EyeOff, Tag, Save, Edit2, ChevronLeft, ChevronRight, Shield, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { busApi } from '@/lib/busApi';
import BusStopForm from './components/BusStopForm';
import OperatorForm from './components/OperatorForm';
import BusTemplateForm from './components/BusTemplateForm';
import PricingRuleForm from './components/PricingRuleForm';
import CancellationPolicyForm from './components/CancellationPolicyForm';
import BusTypeForm from './components/BusTypeForm';

export default function BusManagement() {
  const [activeTab, setActiveTab] = useState('stops');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // UI State
  const [toast, setToast] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Form State
  const [formData, setFormData] = useState({});
  const [dropdowns, setDropdowns] = useState({ operators: [], stops: [], types: [] });
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    { id: 'stops', name: 'Bus Stops', icon: MapPin, getApi: busApi.admin.getBusStops, postApi: busApi.admin.createBusStop },
    { id: 'operators', name: 'Operators', icon: Building, getApi: busApi.admin.getOperators, postApi: busApi.admin.createOperator },
    { id: 'routes', name: 'Bus Templates', icon: GitMerge, getApi: busApi.admin.getBuses, postApi: busApi.admin.createBus, putApi: busApi.admin.updateBus },
    { id: 'pricing', name: 'Pricing Rules', icon: Tag, getApi: busApi.admin.getPricingRules, postApi: busApi.admin.createPricingRule, putApi: (id, payload) => busApi.admin.updatePricingRule(id, payload) },
    { id: 'cancellations', name: 'Cancellation Policies', icon: Shield, getApi: busApi.admin.getCancellationPolicies, postApi: busApi.admin.createCancellationPolicy, putApi: (id, payload) => busApi.admin.updateCancellationPolicy(id, payload) },
    { id: 'types', name: 'Bus Types', icon: Layout, getApi: busApi.admin.getBusTypes, postApi: busApi.admin.createBusType },
    { id: 'instances', name: 'Instances', icon: Bus, getApi: () => busApi.admin.getUpcomingTrips(100) },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const tab = tabs.find(t => t.id === activeTab);
      if (tab.getApi) {
        const data = await tab.getApi();
        if (data && data.data) {
          setData(data.data);
        } else {
          setData(data || []);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [ops, stops, types] = await Promise.all([
        busApi.admin.getOperators(),
        busApi.admin.getBusStops(),
        busApi.admin.getBusTypes()
      ]);
      setDropdowns({
        operators: ops?.data || [],
        stops: stops?.data || [],
        types: types?.data || []
      });
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
    if (activeTab === 'routes') fetchDropdowns();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const tab = tabs.find(t => t.id === activeTab);
      let res;

      if (payload.id && tab.putApi) {
        // Strip id from the body — only pass it as the URL param
        const { id, created_at, ...updates } = payload;
        res = await tab.putApi(id, updates);
      } else if (!payload.id && tab.postApi) {
        res = await tab.postApi(payload);
      } else {
        showToast('Operation not supported for this type.', 'error');
        return;
      }

      if (res?.success || res) {
        setShowModal(false);
        setFormData({});
        fetchData();
        showToast('Saved successfully');
      } else {
        showToast(res?.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast(err?.response?.data?.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Unified edit handler for all tabs
  const handleEdit = (item) => {
    setFormData(item);
    setShowModal(true);
  };

  const handleCancellationEdit = handleEdit;
  const handlePricingEdit = handleEdit;

  const requestDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id) => {
    setDeleteConfirmId(null);
    try {
      console.log(`Attempting to delete ${activeTab} with ID:`, id);
      if (activeTab === 'instances') {
        const res = await busApi.admin.deleteInstance(id);
        console.log("Delete response:", res);
        fetchData();
        showToast("Deleted successfully");
      } else {
        showToast("Delete not implemented for this category yet.", "error");
      }
    } catch (err) {
      console.error("Delete operation failed:", err);
      const errMsg = err.response?.data?.message || err.message || "Delete failed";
      showToast(errMsg, "error");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'N/A';
    if (timeStr.includes('T')) {
      return timeStr.substring(11, 16);
    }
    return timeStr.substring(0, 5);
  };

  const safeJsonParse = (raw, fallback = []) => {
    if (!raw) return fallback;
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw) || fallback;
    } catch (e) {
      console.warn("JSON parse failed for:", raw);
      return fallback;
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SCHEDULED' ? 'DISABLED' : 'SCHEDULED';
    try {
      await busApi.admin.updateInstanceStatus(id, newStatus);
      fetchData();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleOperatorAction = async (id, action) => {
    try {
      await busApi.admin.updateOperatorAction(id, action);
      fetchData();
      showToast(`Operator ${action}ed`);
    } catch (err) {
      console.error(`Operator ${action} failed:`, err);
      showToast(`Failed to ${action} operator`, "error");
    }
  };

  const handlePricingUpdate = async (id, updates) => {
    try {
      await busApi.admin.updatePricingRule(id, updates);
      fetchData();
      showToast("Pricing rule updated!");
    } catch (err) {
      console.error("Pricing update failed:", err);
      showToast("Failed to update rule", "error");
    }
  };

  const handleCancellationUpdate = async (id, updates) => {
    try {
      await busApi.admin.updateCancellationPolicy(id, updates);
      fetchData();
      showToast("Cancellation policy updated!");
    } catch (err) {
      console.error("Cancellation update failed:", err);
      showToast("Failed to update policy", "error");
    }
  };

  const filteredData = data.filter(item => {
    const search = searchQuery.toLowerCase();
    if (activeTab === 'stops') return item.name?.toLowerCase().includes(search) || item.city?.toLowerCase().includes(search);
    if (activeTab === 'operators') return item.name?.toLowerCase().includes(search) || item.operator_code?.toLowerCase().includes(search);
    if (activeTab === 'routes') return item.bus_number?.toLowerCase().includes(search) || item.operator?.name?.toLowerCase().includes(search);
    if (activeTab === 'pricing') return item.name?.toLowerCase().includes(search) || item.rule_type?.toLowerCase().includes(search);
    if (activeTab === 'cancellations') return item.name?.toLowerCase().includes(search);
    if (activeTab === 'instances') return item.bus?.bus_number?.toLowerCase().includes(search) || item.bus?.operator?.name?.toLowerCase().includes(search);
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bus Management</h1>
          <p className="text-slate-500 mt-1">Manage the core infrastructure of the bus booking system.</p>
        </div>
        {['stops', 'operators', 'routes', 'pricing', 'cancellations', 'types'].includes(activeTab) && (
          <button 
            onClick={() => { setFormData({}); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add {activeTab.slice(0, -1)}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-2xl w-fit mt-6 overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 py-2.5 px-6 text-sm font-bold rounded-xl transition-colors z-10 whitespace-nowrap ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="busAdminTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredData.length} Items Found
          </div>
        </div>
        
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4 flex-1">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-sm animate-pulse">Fetching {activeTab}...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center h-96 text-slate-400 text-center flex-1">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 mx-auto">
              <Search size={32} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-1">No data available</h3>
            <p className="text-sm max-w-sm mx-auto">
              We couldn't find any {activeTab} matching your criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr className="text-left">
                    {activeTab === 'stops' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                      </>
                    )}
                    {activeTab === 'operators' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'routes' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus Number</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'pricing' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Multiplier</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'cancellations' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cutoff (Hours)</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Refund %</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel Fee</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'instances' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Travel Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'types' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specs</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenities</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    {activeTab === 'stops' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">{item.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-600">{item.city}, {item.state}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">{item.country}</p>
                        </td>
                      </>
                    )}
                    {activeTab === 'operators' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-emerald-600 font-black tracking-widest uppercase">{item.operator_code}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-600">{item.contact_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status !== 'ACTIVE' && (
                              <button onClick={() => handleOperatorAction(item.id, 'approve')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Approve Operator">
                                <ShieldCheck size={18} />
                              </button>
                            )}
                            {item.status !== 'SUSPENDED' && (
                              deleteConfirmId === item.id ? (
                                <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg">
                                  <button onClick={() => { handleOperatorAction(item.id, 'suspend'); setDeleteConfirmId(null); }} className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest">Confirm</button>
                                  <span className="text-slate-300">|</span>
                                  <button onClick={cancelDelete} className="text-[10px] font-black text-slate-500 hover:underline uppercase tracking-widest">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => requestDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Suspend Operator">
                                  <ShieldAlert size={18} />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'routes' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.bus_number}</p>
                          <p className="text-xs text-slate-500 font-bold uppercase">{item.operator?.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-700">{item.origin_stop?.city}</span>
                            <GitMerge size={14} className="text-slate-300" />
                            <span className="text-sm font-black text-slate-700">{item.destination_stop?.city}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{formatTimeDisplay(item.departure_time)} ➔ {formatTimeDisplay(item.arrival_time)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 mt-2">
                            {[1,2,3,4,5,6,7].map(day => {
                              const days = safeJsonParse(item.days_of_week, []);
                              const active = days.includes(day);
                              const dayLabels = {1:'MON', 2:'TUE', 3:'WED', 4:'THU', 5:'FRI', 6:'SAT', 7:'SUN'};
                              return (
                                <span key={day} className={`w-7 h-5 rounded-md flex items-center justify-center text-[8px] font-black border transition-all ${
                                  active ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-100'
                                }`}>
                                  {dayLabels[day]}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-emerald-500 transition-colors p-1"><Edit2 size={16} /></button>
                        </td>
                      </>
                    )}
                    {activeTab === 'pricing' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.rule_type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-sm">{item.multiplier}×</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-sm">{item.priority}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handlePricingUpdate(item.id, { is_active: !item.is_active })}
                              className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                              title={item.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {item.is_active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                            </button>
                            <button onClick={() => handlePricingEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit Rule">
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'cancellations' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-700">{item.hours_before_departure}h</span>
                            <span className="text-[10px] text-slate-400 font-bold">before departure</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(item.refund_percentage, 100)}%` }} />
                            </div>
                            <span className="text-sm font-black text-emerald-700">{item.refund_percentage}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-600">₹{parseFloat(item.cancellation_fee || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCancellationUpdate(item.id, { is_active: !item.is_active })}
                              className={`p-1.5 rounded-lg transition-colors ${item.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                              title={item.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {item.is_active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                            </button>
                            <button onClick={() => handleCancellationEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit Policy">
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'instances' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{new Date(item.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-700">{item.bus?.bus_number}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.bus?.operator?.name}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                            item.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleToggleStatus(item.id, item.status)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors" title={item.status === 'SCHEDULED' ? 'Disable Trip' : 'Enable Trip'}>
                              {item.status === 'SCHEDULED' ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg">
                                <button onClick={() => confirmDelete(item.id)} className="text-xs font-bold text-red-600 hover:underline">Confirm</button>
                                <span className="text-slate-300">|</span>
                                <button onClick={cancelDelete} className="text-xs font-bold text-slate-500 hover:underline">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => requestDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-error transition-colors" title="Delete Trip"><Trash2 size={18} /></button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === 'types' && (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.manufacturer}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${item.ac ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                              {item.ac ? 'AC' : 'Non-AC'}
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {(() => {
                                const layout = safeJsonParse(item.seat_layout, {});
                                const typeKey = Object.keys(layout)[0];
                                const detail = layout[typeKey];
                                if (!detail) return 'N/A';
                                const baseCount = detail.rows * (detail.left_columns + detail.right_columns);
                                return typeKey === 'sleeper' ? baseCount * 2 : baseCount;
                              })()} Seats
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {safeJsonParse(item.amenities, []).slice(0, 3).map(a => (
                              <span key={a} className="text-[9px] font-black bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded uppercase">{a}</span>
                            ))}
                            {safeJsonParse(item.amenities, []).length > 3 && (
                              <span className="text-[9px] font-black text-slate-300 px-1.5 py-0.5">+ {safeJsonParse(item.amenities, []).length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Read Only</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing <span className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-slate-700">{filteredData.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages || 1}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {activeTab === 'stops' && <BusStopForm initialData={formData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
              {activeTab === 'operators' && <OperatorForm initialData={formData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
              {activeTab === 'routes' && <BusTemplateForm initialData={formData} dropdowns={dropdowns} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
              {activeTab === 'pricing' && <PricingRuleForm initialData={formData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
              {activeTab === 'cancellations' && <CancellationPolicyForm initialData={formData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
              {activeTab === 'types' && <BusTypeForm initialData={formData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} />}
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border ${
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {toast.type === 'error' ? <ShieldAlert size={20} /> : <Check size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-current opacity-70 hover:opacity-100"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

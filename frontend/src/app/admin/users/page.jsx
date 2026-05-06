"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, CheckCircle, Loader2, Briefcase, Building2, Phone, Mail, Percent, Hash, X } from 'lucide-react';
import { api } from '@/lib/axios';
import { busApi } from '@/lib/busApi';
import { authApi } from '@/lib/authApi';

export default function UserManagement() {
  // ─── Role Assignment ──────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastAssigned, setLastAssigned] = useState(null); // { email, role, permissions }

  // Permission definitions per role (matches backend expectation).
  // "user" is always included as the base permission for every role.
  const rolePermissions = {
    user: ['user'],
    operator: ['operator'],
    admin: ['admin'],
    superadmin: ['superadmin'],
  };

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);
    setLastAssigned(null);

    const permissions = rolePermissions[role] ?? [];

    try {
      // permissions must be sent as an array of strings
      await authApi.admin.assignRole({
        email,
        role,
        permissions,
      });
      setLastAssigned({ email, role, permissions });
      setMessage({ type: 'success', text: `Role "${role}" assigned to ${email}.` });
      setEmail('');
      setRole('user');
    } catch (err) {
      const errText =
        err.response?.data?.error ||
        err.response?.data?.message ||
        `Error ${err.response?.status ?? ''}: Failed to update user role.`;
      setMessage({ type: 'error', text: errText });
    } finally {
      setLoading(false);
    }
  };

  // ─── NEW: Operator Registration ───────────────────────────────────────────
  const [opUserSearch, setOpUserSearch] = useState('');
  // clear search state helper
  const clearSearch = () => { setOpUserSearch(''); setOpSelectedUser(null); setOpUserResults([]); setOpSearchDone(false); };
  const [opUserResults, setOpUserResults] = useState([]);
  const [opSelectedUser, setOpSelectedUser] = useState(null); // { id, name, email }
  const [opSearchLoading, setOpSearchLoading] = useState(false);
  const [opSearchDone, setOpSearchDone] = useState(false);

  const [opForm, setOpForm] = useState({
    name: '',
    operator_code: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    commission_rate: 5.0,
  });

  const [opLoading, setOpLoading] = useState(false);
  const [opMessage, setOpMessage] = useState(null);

  const handleUserSearch = async () => {
    if (!opUserSearch.trim()) return;
    setOpSearchLoading(true);
    setOpSearchDone(false);
    setOpSelectedUser(null);
    setOpUserResults([]);
    try {
      const users = await authApi.admin.listUsers();
      if (users.length === 0) {
        setOpMessage({ type: 'error', text: 'No users returned from server. Make sure you are logged in as admin.' });
        return;
      }
      const q = opUserSearch.toLowerCase();
      const filtered = users.filter(u =>
        u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q)
      );
      setOpUserResults(filtered);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch users.';
      setOpMessage({ type: 'error', text: `Search error: ${msg}` });
      setOpUserResults([]);
    } finally {
      setOpSearchLoading(false);
      setOpSearchDone(true);
    }
  };

  const handleUserSelect = (user) => {
    setOpSelectedUser(user);
    setOpUserSearch(user.email);
    setOpUserResults([]);
    setOpForm(prev => ({ ...prev, contact_email: user.email, name: prev.name || user.name }));
  };

  const handleRegisterOperator = async (e) => {
    e.preventDefault();
    if (!opSelectedUser) {
      setOpMessage({ type: 'error', text: 'Please search and select a user first.' });
      return;
    }

    setOpLoading(true);
    setOpMessage(null);

    try {
      const payload = {
        user_id: opSelectedUser.id,
        name: opForm.name,
        operator_code: opForm.operator_code,
        contact_email: opForm.contact_email,
        contact_phone: opForm.contact_phone,
        logo_url: opForm.logo_url,
        commission_rate: parseFloat(opForm.commission_rate),
      };
      await busApi.operator.registerOperator(payload);
      setOpMessage({ type: 'success', text: `Operator "${opForm.name}" registered successfully for ${opSelectedUser.email}.` });
      // Reset form
      setOpSelectedUser(null);
      setOpUserSearch('');
      setOpSearchDone(false);
      setOpForm({ name: '', operator_code: '', contact_email: '', contact_phone: '', logo_url: '', commission_rate: 5.0 });
    } catch (err) {
      setOpMessage({
        type: 'error',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to register operator.'
      });
    } finally {
      setOpLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
        <p className="text-slate-500 mt-1">Manage platform users and assign administrative roles.</p>
      </div>

      {/* ─── Role Assignment card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <ShieldAlert className="text-emerald-500" /> Role Assignment
        </h2>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Only <span className="font-black text-slate-600">superadmins</span> can assign roles.
          Regular users and operators cannot access this action.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleRoleUpdate} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">User Email</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email address"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Assign Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900"
            >
              <option value="user">User — Standard platform user, no special access</option>
              <option value="operator">Operator — Bus fleet management access</option>
              <option value="admin">Admin — Platform administration access</option>
              <option value="superadmin">Superadmin — Full platform control</option>
            </select>
          </div>

          {/* Permissions preview */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Permissions that will be assigned</p>
            {rolePermissions[role].length === 0 ? (
              <p className="text-xs text-slate-400 italic">No permissions — standard user access only.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rolePermissions[role].map(p => (
                  <span key={p} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !email}
            type="submit"
            className="flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Role'}
          </motion.button>
        </form>

        {/* Last assigned result */}
        {lastAssigned && (
          <div className="mt-6 p-5 rounded-2xl border border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Last Assignment Result</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-slate-700">{lastAssigned.email}</span>
              <span className="text-slate-300">→</span>
              <span className="px-2.5 py-1 bg-slate-900 text-white text-xs font-black rounded-lg uppercase tracking-widest">
                {lastAssigned.role}
              </span>
              {lastAssigned.permissions.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">with permissions:</span>
                  {lastAssigned.permissions.map(p => (
                    <span key={p} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">no permissions assigned</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── NEW: Register Operator card ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
          <Briefcase className="text-emerald-500" size={22} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Register Operator</h2>
            <p className="text-sm text-slate-500">Link a platform user to a new bus operator account.</p>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* Step 1 – User Lookup */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Step 1 — Find User by Email
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={opUserSearch}
                  onChange={(e) => { setOpUserSearch(e.target.value); setOpSelectedUser(null); setOpSearchDone(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUserSearch())}
                  placeholder="Type email or name, then click Search"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleUserSearch}
                disabled={opSearchLoading || !opUserSearch.trim()}
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {opSearchLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                Search
              </button>
            </div>

            {/* Results dropdown */}
            {opUserResults.length > 0 && !opSelectedUser && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                {opUserResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full text-left px-5 py-3.5 hover:bg-emerald-50 transition-colors flex items-center gap-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-slate-500">{(user.name || user.email)[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{user.name || '—'}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {user.role || 'user'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {opSearchDone && opUserResults.length === 0 && !opSelectedUser && (
              <p className="mt-2 text-sm text-slate-400 font-medium italic">No users matched your search.</p>
            )}

            {/* Selected user chip */}
            {opSelectedUser && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-white">{opSelectedUser.email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-900 text-sm">{opSelectedUser.name || '—'}</p>
                  <p className="text-xs text-emerald-600 truncate">{opSelectedUser.email}</p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg shrink-0">
                  ID: {opSelectedUser.id?.slice(0, 8)}…
                </span>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-emerald-400 hover:text-emerald-700 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Step 2 – Operator Details */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Step 2 — Operator Details
            </p>

            {opMessage && (
              <div className={`p-4 rounded-xl mb-5 flex items-center gap-3 ${opMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {opMessage.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                <span className="font-medium text-sm">{opMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleRegisterOperator} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={opForm.name}
                      onChange={(e) => setOpForm({ ...opForm, name: e.target.value })}
                      placeholder="e.g. Dream Travels"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Operator Code</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      maxLength={10}
                      value={opForm.operator_code}
                      onChange={(e) => setOpForm({ ...opForm, operator_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. DT-001"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="email"
                      value={opForm.contact_email}
                      onChange={(e) => setOpForm({ ...opForm, contact_email: e.target.value })}
                      placeholder="support@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="tel"
                      value={opForm.contact_phone}
                      onChange={(e) => setOpForm({ ...opForm, contact_phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Commission Rate (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={opForm.commission_rate}
                      onChange={(e) => setOpForm({ ...opForm, commission_rate: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Logo URL <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={opForm.logo_url}
                    onChange={(e) => setOpForm({ ...opForm, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-900 text-sm"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={opLoading}
                className="flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
              >
                {opLoading ? <Loader2 className="animate-spin" size={20} /> : <Briefcase size={20} />}
                {opLoading ? 'Registering…' : 'Register Operator'}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

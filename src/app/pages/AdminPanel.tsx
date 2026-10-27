import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  MapPin,
  Phone,
  Clock,
  Zap,
  Plus,
  Edit2,
  Trash2,
  Search,
  BarChart2,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import { adminApi } from '../../utils/api';

// PIN stored per browser session only
const SESSION_KEY = 'kalang_admin_auth';

const safeSession = {
  get: (key: string) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, val: string) => {
    try { sessionStorage.setItem(key, val); } catch { /* noop */ }
  },
  remove: (key: string) => {
    try { sessionStorage.removeItem(key); } catch { /* noop */ }
  },
};

const SERVICES = [
  'Package Pickup & Delivery',
  'Groceries & Foodstuff Shopping',
  'Back-to-School Runs',
  'Market Runs & Other Errands',
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT',
];

const BLANK_AGENT = {
  business_name: '',
  owner_name: '',
  email: '',
  whatsapp_number: '',
  location_city: '',
  location_state: '',
  bio: '',
  services: [] as string[],
  is_verified: false,
};

type Tab = 'overview' | 'agents' | 'bookings' | 'activity';

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onAuth }: { onAuth: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '') && next.filter(Boolean).length === 4) {
      submit(next.join(''));
    }
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const submit = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      await adminApi.login(pin);
      safeSession.set(SESSION_KEY, '1');
      onAuth();
    } catch {
      setError('Wrong PIN. Try again.');
      setDigits(['', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Access</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your 4-digit admin PIN</p>

        <div className="flex justify-center gap-3 mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:bg-blue-50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setShow(!show)}
          className="flex items-center gap-1 mx-auto text-xs text-gray-400 hover:text-gray-600 mb-4"
        >
          {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {show ? 'Hide' : 'Show'} PIN
        </button>

        {error && (
          <p className="text-red-500 text-sm mb-4 flex items-center justify-center gap-1">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        <button
          disabled={digits.some((d) => !d) || loading}
          onClick={() => submit(digits.join(''))}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

// ─── Agent Modal (Add / Edit) ──────────────────────────────────────────────────

function AgentModal({
  initial,
  onSave,
  onClose,
}: {
  initial: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...BLANK_AGENT, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const toggleService = (s: string) => {
    set('services', form.services.includes(s) ? form.services.filter((x: string) => x !== s) : [...form.services, s]);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.business_name) {
      setErr('Business name and email are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Failed to save agent.');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Agent' : 'Add New Agent'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                value={form.business_name}
                onChange={(e) => set('business_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input
                value={form.owner_name}
                onChange={(e) => set('owner_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                value={form.whatsapp_number}
                onChange={(e) => set('whatsapp_number', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                value={form.location_city}
                onChange={(e) => set('location_city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={form.location_state}
                onChange={(e) => set('location_state', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={2}
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
                    form.services.includes(s)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={form.is_verified}
              onChange={(e) => set('is_verified', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <label htmlFor="verified" className="text-sm text-gray-700">Mark as verified</label>
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activate Modal ────────────────────────────────────────────────────────────

function ActivateModal({ agent, onActivate, onClose }: { agent: any; onActivate: (id: string, hours: number) => Promise<void>; onClose: () => void }) {
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);

  const presets = [{ label: '1 Day', h: 24 }, { label: '1 Week', h: 168 }, { label: '1 Month', h: 720 }];

  const submit = async () => {
    setLoading(true);
    try {
      await onActivate(agent.id, hours);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Activate Agent</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Set visibility duration for <strong>{agent.business_name}</strong></p>
        <div className="flex gap-2 mb-4">
          {presets.map((p) => (
            <button
              key={p.h}
              onClick={() => setHours(p.h)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                hours === p.h ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="number"
            min={1}
            max={8760}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">hours custom</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Activating...' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ agent, onDelete, onClose }: { agent: any; onDelete: () => Promise<void>; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await onDelete(); onClose(); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Remove Agent</h2>
        <p className="text-sm text-gray-600 mb-6">
          Delete <strong>{agent.business_name}</strong> and all their payment records? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPanel ───────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => safeSession.get(SESSION_KEY) === '1');
  const [tab, setTab] = useState<Tab>('overview');
  const [agents, setAgents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [bookings, setBookings] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editAgent, setEditAgent] = useState<any | null>(null);
  const [activateAgent, setActivateAgent] = useState<any | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<any | null>(null);
  const [updatingVerify, setUpdatingVerify] = useState<string | null>(null);
  const [updatingBookingStatus, setUpdatingBookingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsRes, metricsRes, bookingsRes] = await Promise.allSettled([
        adminApi.getAllAgents(),
        adminApi.getMetrics(),
        adminApi.getBookings(),
      ]);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.agents || []);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.bookings || []);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    safeSession.remove(SESSION_KEY);
    setAuthed(false);
  };

  const handleVerify = async (agentId: string, isVerified: boolean) => {
    setUpdatingVerify(agentId);
    try {
      await adminApi.verifyAgent(agentId, isVerified);
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, is_verified: isVerified } : a));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setUpdatingVerify(null);
    }
  };

  const handleActivate = async (agentId: string, hours: number) => {
    await adminApi.activateAgent(agentId, hours);
    await loadData();
  };

  const handleCreate = async (data: any) => {
    await adminApi.createAgent(data);
    await loadData();
  };

  const handleUpdate = async (data: any) => {
    await adminApi.updateAgent(editAgent.id, data);
    await loadData();
  };

  const handleDelete = async () => {
    await adminApi.deleteAgent(deleteAgent.id);
    await loadData();
  };

  const handleBookingStatus = async (agentId: string, status: 'free' | 'booked') => {
    setUpdatingBookingStatus(agentId);
    try {
      await adminApi.setBookingStatus(agentId, status);
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, booking_status: status } : a));
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setUpdatingBookingStatus(null);
    }
  };

  if (!authed) return <PinGate onAuth={() => setAuthed(true)} />;

  const filtered = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.business_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.location_city?.toLowerCase().includes(q) ||
      a.whatsapp_number?.includes(q)
    );
  });

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.isActive).length,
    verified: agents.filter((a) => a.is_verified).length,
    inactive: agents.filter((a) => !a.isActive).length,
  };

  const TABS: { id: Tab; label: string; Icon: any }[] = [
    { id: 'overview', label: 'Overview', Icon: BarChart2 },
    { id: 'agents', label: 'Agents', Icon: Users },
    { id: 'bookings', label: `Bookings${bookings.length ? ` (${bookings.length})` : ''}`, Icon: Activity },
    { id: 'activity', label: 'Activity', Icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">KalaNg logistics management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Agents', value: stats.total, icon: Users, color: 'blue' },
                    { label: 'Active Now', value: stats.active, icon: CheckCircle, color: 'green' },
                    { label: 'Verified', value: stats.verified, icon: Shield, color: 'purple' },
                    { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'red' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                          <p className="text-3xl font-bold text-gray-900">{value}</p>
                        </div>
                        <div className={`p-2 rounded-lg bg-${color}-100`}>
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {metrics && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue card */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <p className="text-gray-500 text-xs font-medium mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ₦{((metrics.totalRevenue || 0) / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">All completed payments</p>
                    </div>

                    {/* Revenue chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Revenue — last 7 days</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={metrics.revenueChart || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${v / 100}`} />
                          <Tooltip
                            formatter={(v: any) => [`₦${(v / 100).toLocaleString()}`, 'Revenue']}
                            labelFormatter={(l) => `Date: ${l}`}
                          />
                          <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AGENTS TAB ── */}
            {tab === 'agents' && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search agents..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Agent
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Agent', 'Location', 'Contact', 'Services', 'Status', 'Expiry', 'Actions'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                              No agents found
                            </td>
                          </tr>
                        ) : (
                          filtered.map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900 flex items-center gap-1">
                                  {agent.business_name}
                                  {agent.is_verified && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                </div>
                                <div className="text-xs text-gray-400">{agent.email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-gray-600 text-xs">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {agent.location_city}, {agent.location_state}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-gray-600 text-xs">
                                  <Phone className="w-3.5 h-3.5" />
                                  {agent.whatsapp_number || '—'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {(agent.services || []).slice(0, 2).map((s: string, i: number) => (
                                    <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                      {s.split(' ')[0]}
                                    </span>
                                  ))}
                                  {(agent.services || []).length > 2 && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                      +{agent.services.length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {agent.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {agent.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {agent.activePayment ? (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(agent.activePayment.expires_at).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setActivateAgent(agent)}
                                    className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                                    title="Activate / extend visibility"
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleVerify(agent.id, !agent.is_verified)}
                                    disabled={updatingVerify === agent.id}
                                    className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                                      agent.is_verified
                                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                    title={agent.is_verified ? 'Unverify' : 'Verify'}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditAgent(agent)}
                                    className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                                    title="Edit agent"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleBookingStatus(agent.id, agent.booking_status === 'booked' ? 'free' : 'booked')}
                                    disabled={updatingBookingStatus === agent.id}
                                    className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
                                      agent.booking_status === 'booked'
                                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                    }`}
                                    title={agent.booking_status === 'booked' ? 'Mark as Free' : 'Mark as Booked'}
                                  >
                                    {updatingBookingStatus === agent.id
                                      ? <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      : <MapPin className="w-3.5 h-3.5" />
                                    }
                                  </button>
                                  <button
                                    onClick={() => setDeleteAgent(agent)}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                    title="Delete agent"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── BOOKINGS TAB ── */}
            {tab === 'bookings' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Client Bookings</h2>
                {bookings.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
                    No bookings yet
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {['Client', 'Phone', 'Service', 'Agent', 'Pickup Address', 'Status', 'Date'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{b.client_name}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{b.client_phone}</td>
                            <td className="px-4 py-3">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{b.service?.split(' ').slice(0, 2).join(' ')}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{b.agents?.business_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{b.pickup_address || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {b.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h2 className="text-lg font-bold text-gray-900 mt-8 mb-4">Agent Availability Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {agents.map((a) => (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.booking_status === 'booked' ? 'bg-red-500' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{a.business_name}</p>
                        <p className="text-xs text-gray-400">{a.current_lga || a.location_city}, {a.location_state}</p>
                      </div>
                      <button
                        onClick={() => handleBookingStatus(a.id, a.booking_status === 'booked' ? 'free' : 'booked')}
                        disabled={updatingBookingStatus === a.id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${
                          a.booking_status === 'booked'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {a.booking_status === 'booked' ? 'Free ↑' : 'Book ↓'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {tab === 'activity' && (
              <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h2>
                {metrics?.recentPayments?.length ? (
                  <div className="space-y-3">
                    {metrics.recentPayments.map((p: any, i: number) => {
                      const agent = agents.find((a) => a.id === p.agent_id);
                      const kobo = p.amount || 0;
                      const hours = Math.round(
                        (new Date(p.expires_at).getTime() - new Date(p.activated_at).getTime()) / 3600000
                      );
                      const plan = hours <= 24 ? 'Daily' : hours <= 168 ? 'Weekly' : 'Monthly';
                      return (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {agent?.business_name || 'Unknown Agent'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {plan} plan · ₦{(kobo / 100).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400">
                              {p.activated_at ? new Date(p.activated_at).toLocaleDateString() : '—'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Expires {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
                    No payment activity yet
                  </div>
                )}

                <h2 className="text-lg font-bold text-gray-900 mt-8 mb-4">Agent Status Overview</h2>
                <div className="space-y-2">
                  {agents.slice(0, 15).map((a) => (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium text-sm text-gray-900 flex-1 truncate">{a.business_name}</span>
                      <span className="text-xs text-gray-400">{a.location_city}, {a.location_state}</span>
                      {a.is_verified && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    </div>
                  ))}
                  {agents.length > 15 && (
                    <p className="text-xs text-center text-gray-400 pt-1">+ {agents.length - 15} more agents</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {addModal && (
        <AgentModal initial={BLANK_AGENT} onSave={handleCreate} onClose={() => setAddModal(false)} />
      )}
      {editAgent && (
        <AgentModal initial={editAgent} onSave={handleUpdate} onClose={() => setEditAgent(null)} />
      )}
      {activateAgent && (
        <ActivateModal agent={activateAgent} onActivate={handleActivate} onClose={() => setActivateAgent(null)} />
      )}
      {deleteAgent && (
        <DeleteConfirm agent={deleteAgent} onDelete={handleDelete} onClose={() => setDeleteAgent(null)} />
      )}
    </div>
  );
}

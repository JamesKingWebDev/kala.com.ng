import { useState, useEffect } from 'react';
import { Link } from '../nav';
import {
  Search, MapPin, Package, Truck, Users, CheckCircle,
  ShoppingCart, GraduationCap, Star, LucideIcon, Map,
} from 'lucide-react';
import { agentApi, locationApi } from '../../utils/api';
import Navbar from '../components/Navbar';
import AgentCard from '../components/AgentCard';
import FilterSidebar from '../components/FilterSidebar';
import AgentMap from '../components/AgentMap';
import BookingModal from '../components/BookingModal';
import kalaImage from '@/imports/WhatsApp_Image_2026-07-24_at_9.54.55_PM.jpeg';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

const SERVICES: { name: string; Icon: LucideIcon; iconClass: string; bg: string; desc: string }[] = [
  {
    name: 'Package Pickup & Delivery',
    Icon: Package,
    iconClass: 'w-7 h-7 text-[#C9960A]',
    bg: 'bg-[#C9960A]/10',
    desc: 'Reliable pickup and door-to-door delivery of packages across your city.',
  },
  {
    name: 'Groceries & Foodstuff Shopping',
    Icon: ShoppingCart,
    iconClass: 'w-7 h-7 text-[#C9960A]',
    bg: 'bg-[#C9960A]/10',
    desc: 'Fresh groceries and foodstuff sourced and delivered right to your door.',
  },
  {
    name: 'Back-to-School Runs',
    Icon: GraduationCap,
    iconClass: 'w-7 h-7 text-[#C9960A]',
    bg: 'bg-[#C9960A]/10',
    desc: 'School supplies, uniforms, and materials picked up and delivered on time.',
  },
  {
    name: 'Market Runs & Other Errands',
    Icon: Star,
    iconClass: 'w-7 h-7 text-[#C9960A]',
    bg: 'bg-[#C9960A]/10',
    desc: 'Market runs, bill payments, and any other errands handled by trusted agents.',
  },
];

function KalaLogoMark({ size = 40 }: { size?: number }) {
  const s = size;
  return (
    <svg width={s} height={Math.round(s * 1.15)} viewBox="0 0 50 58" fill="none">
      <line x1="11" y1="6" x2="11" y2="52" stroke="#C9960A" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M11 29 Q28 18 38 7" stroke="#C9960A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M11 29 Q28 40 38 51" stroke="#C9960A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="33" cy="29" rx="15" ry="21" stroke="#C9960A" strokeWidth="2.5" />
    </svg>
  );
}

export default function LandingPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [mapAgents, setMapAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [bookingAgent, setBookingAgent] = useState<any | null>(null);
  const [filters, setFilters] = useState({ city: '', state: '', service: '', lga: '', bookingStatus: '', searchQuery: '' });

  useEffect(() => {
    fetchAgents();
    fetchMapAgents();
    const interval = setInterval(fetchMapAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async (appliedFilters?: any) => {
    try {
      setLoading(true);
      const f = appliedFilters || filters;
      const { agents: fetched } = await agentApi.getActiveAgents({
        city: f.city || f.lga || undefined,
        state: f.state || undefined,
        service: f.service || undefined,
      });
      setAgents(fetched);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapAgents = async () => {
    try {
      const { agents: mapData } = await locationApi.getMapAgents();
      setMapAgents(mapData || []);
    } catch { /* silent */ }
  };

  const handleFilterChange = (newFilters: any) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    fetchAgents(merged);
  };

  const handleServiceFilter = (name: string) => {
    const newFilters = { ...filters, service: filters.service === name ? '' : name };
    setFilters(newFilters);
    fetchAgents(newFilters);
  };

  const filteredAgents = agents
    .filter((a) => {
      if (!filters.searchQuery) return true;
      const q = filters.searchQuery.toLowerCase();
      return (
        a.business_name?.toLowerCase().includes(q) ||
        a.location_city?.toLowerCase().includes(q) ||
        a.location_state?.toLowerCase().includes(q) ||
        a.services?.some((s: string) => s.toLowerCase().includes(q))
      );
    })
    .filter((a) => {
      if (!filters.bookingStatus) return true;
      return (a.booking_status || 'free') === filters.bookingStatus;
    });

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      <Navbar />

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-[#0D1B3E]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 w-px h-full bg-gradient-to-b from-[#C9960A]/0 via-[#C9960A]/30 to-[#C9960A]/0" style={{ left: '10%' }} />
          <div className="absolute top-0 w-px h-full bg-gradient-to-b from-[#C9960A]/0 via-[#C9960A]/15 to-[#C9960A]/0" style={{ right: '15%' }} />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-[#C9960A]/10" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text + search */}
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-5">
                <KalaLogoMark size={48} />
                <span className="text-[#C9960A] font-bold text-3xl tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                  KALA
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                No message is<br />
                <span className="text-[#C9960A] italic">too small.</span>
              </h1>
              <p className="text-[#EDE8D5]/75 text-lg mb-8 leading-relaxed">
                Connect with verified logistics agents in your area — delivery, errands, shopping and more.
              </p>
              <div className="bg-white/8 backdrop-blur-sm border border-[#C9960A]/20 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9960A] w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search agent, city or service..."
                      className="w-full pl-9 pr-4 py-3 bg-white rounded-lg text-[#0D1B3E] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A]"
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && fetchAgents()}
                    />
                  </div>
                  <button
                    onClick={() => fetchAgents()}
                    className="bg-[#C9960A] text-[#0D1B3E] px-6 py-3 rounded-lg hover:bg-[#E8B84B] transition font-bold flex items-center justify-center gap-2 text-sm"
                  >
                    <Search className="w-4 h-4" /> Find Agents
                  </button>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[{ value: `${agents.length}+`, label: 'Active Agents' }, { value: '24/7', label: 'Available' }, { value: '100%', label: 'Verified' }].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-bold text-[#C9960A]" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                    <div className="text-[#EDE8D5]/60 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: KALA brand image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0D1B3E]/30 rounded-2xl z-10 pointer-events-none" />
              <div className="absolute inset-0 rounded-2xl border border-[#C9960A]/30 z-20 pointer-events-none" />
              <ImageWithFallback
                src={kalaImage}
                alt="KALA — A hint of fresh breath"
                className="w-full h-[400px] object-cover rounded-2xl"
                style={{ objectPosition: 'center top' }}
              />
              <div className="absolute bottom-4 right-4 z-30 bg-[#0D1B3E]/90 backdrop-blur-sm border border-[#C9960A]/30 rounded-xl p-4 max-w-[220px]">
                <p className="text-white text-sm italic leading-snug">
                  "A hint of <span className="text-[#C9960A] font-bold not-italic">fresh breath</span>"
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#C9960A]/40 to-transparent" />
      </div>

      {/* ── SERVICES ── */}
      <div className="py-16 bg-white border-b border-[#0D1B3E]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0D1B3E]" style={{ fontFamily: "'Playfair Display', serif" }}>What Our Agents Do</h2>
            <div className="w-14 h-0.5 bg-[#C9960A] mx-auto mt-3 mb-3" />
            <p className="text-gray-500 text-sm">Click a service to filter agents by what they offer</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((svc) => (
              <button
                key={svc.name}
                onClick={() => handleServiceFilter(svc.name)}
                className={`text-left p-5 rounded-xl border-2 transition hover:shadow-md ${
                  filters.service === svc.name ? 'border-[#C9960A] bg-[#C9960A]/5' : 'border-gray-100 hover:border-[#C9960A]/30 bg-white'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 ${svc.bg} rounded-xl mb-3`}>
                  <svc.Icon className={svc.iconClass} />
                </div>
                <h3 className="font-bold text-[#0D1B3E] mb-1.5 text-sm leading-tight">{svc.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{svc.desc}</p>
                {filters.service === svc.name && <span className="mt-2 inline-block text-xs font-semibold text-[#C9960A]">✓ Filtering active</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LIVE MAP ── */}
      <div className="py-16 bg-[#F9F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0D1B3E]" style={{ fontFamily: "'Playfair Display', serif" }}>Live Agent Map</h2>
              <div className="w-14 h-0.5 bg-[#C9960A] mt-3 mb-2" />
              <p className="text-gray-500 text-sm">Real-time locations of active KALA agents across Nigeria</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                {mapAgents.filter(a => a.booking_status !== 'booked').length} Available
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                {mapAgents.filter(a => a.booking_status === 'booked').length} Booked
              </span>
            </div>
          </div>
          <AgentMap agents={mapAgents} onBookAgent={(a) => setBookingAgent(a)} height="460px" />
          <p className="text-xs text-gray-400 mt-3 text-center">Auto-refreshes every 30 seconds · Pins appear once agents share location from their dashboard</p>
        </div>
      </div>

      {/* ── WHY KALA ── */}
      <div className="py-12 bg-white border-y border-[#0D1B3E]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: CheckCircle, color: 'text-[#C9960A]', bg: 'bg-[#C9960A]/10', title: 'Verified Agents', desc: 'Only subscribed, vetted agents appear on the platform' },
              { Icon: MapPin, color: 'text-[#0D1B3E]', bg: 'bg-[#0D1B3E]/8', title: 'LGA-Based Search', desc: 'Find agents by LGA, city, and state — exactly where you need them' },
              { Icon: Truck, color: 'text-[#C9960A]', bg: 'bg-[#C9960A]/10', title: 'Direct Contact', desc: 'Book directly or chat on WhatsApp — no middlemen, no delays' },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-xl border border-[#0D1B3E]/8">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${bg} rounded-full mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-bold text-[#0D1B3E] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AGENTS LISTING ── */}
      <div className="py-16 bg-[#F9F7F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-60 flex-shrink-0">
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
            </div>
            <div className="flex-1">
              <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[#0D1B3E]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Available Agents ({filteredAgents.length})
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">All agents are subscribed and active</p>
                </div>
                <div className="flex items-center gap-2">
                  {filters.service && (
                    <button onClick={() => handleFilterChange({ service: '' })} className="text-xs text-[#C9960A] border border-[#C9960A]/30 px-2 py-1 rounded-lg hover:bg-[#C9960A]/5">
                      Clear filter ×
                    </button>
                  )}
                  <div className="flex rounded-lg border border-[#0D1B3E]/10 overflow-hidden">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium transition ${viewMode === 'list' ? 'bg-[#0D1B3E] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      List
                    </button>
                    <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 text-xs font-medium transition flex items-center gap-1 ${viewMode === 'map' ? 'bg-[#0D1B3E] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Map className="w-3 h-3" /> Map
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'map' ? (
                <AgentMap agents={filteredAgents} onBookAgent={(a) => setBookingAgent(a)} height="520px" />
              ) : loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#C9960A] border-t-transparent" />
                  <p className="mt-4 text-gray-400 text-sm">Loading agents...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-[#0D1B3E]/8">
                  <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#0D1B3E] mb-1">No agents found</h3>
                  <p className="text-gray-400 text-sm">Try adjusting filters or searching in a different area</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} onBook={(a) => setBookingAgent(a)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="relative bg-[#0D1B3E] py-16 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9960A]/40 to-transparent" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <KalaLogoMark size={44} />
          <h2 className="text-3xl font-bold text-white mt-4 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Are you a logistics agent?
          </h2>
          <p className="text-[#EDE8D5]/70 mb-8">
            Register on KALA, subscribe, and start getting discovered by clients in your area.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-[#C9960A] text-[#0D1B3E] px-8 py-4 rounded-xl hover:bg-[#E8B84B] transition font-bold"
          >
            <Users className="w-5 h-5" /> Register as Agent
          </Link>
        </div>
      </div>

      <footer className="bg-[#080F23] text-[#EDE8D5]/50 py-6 text-center text-sm border-t border-[#C9960A]/10">
        <p>&copy; 2026 KALA Logistics · <a href="tel:07065764557" className="hover:text-[#C9960A] transition">07065764557</a> · <a href="https://kala.com.ng" className="hover:text-[#C9960A] transition">kala.com.ng</a></p>
      </footer>

      {bookingAgent && (
        <BookingModal
          agent={bookingAgent}
          onClose={() => setBookingAgent(null)}
          onBooked={() => { fetchAgents(); fetchMapAgents(); setBookingAgent(null); }}
        />
      )}
    </div>
  );
}

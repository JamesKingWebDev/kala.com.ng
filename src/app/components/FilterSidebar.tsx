import { MapPin, Package, Filter, SlidersHorizontal } from 'lucide-react';

interface FilterSidebarProps {
  filters: {
    city: string;
    state: string;
    service: string;
    lga?: string;
    bookingStatus?: string;
  };
  onFilterChange: (filters: any) => void;
}

const SERVICES = [
  'Package Pickup & Delivery',
  'Groceries & Foodstuff Shopping',
  'Back-to-School Runs',
  'Market Runs & Other Errands',
];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const handleReset = () => {
    onFilterChange({ city: '', state: '', service: '', lga: '', bookingStatus: '' });
  };

  const activeCount = [filters.city, filters.state, filters.service, filters.lga, filters.bookingStatus].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#0D1B3E]/8 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[#0D1B3E] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[#C9960A]" />
          Filters
          {activeCount > 0 && (
            <span className="bg-[#C9960A] text-[#0D1B3E] text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button onClick={handleReset} className="text-xs text-[#C9960A] hover:underline font-semibold">
            Reset all
          </button>
        )}
      </div>

      {/* Availability Filter */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#0D1B3E] mb-2 uppercase tracking-wide">Availability</label>
        <div className="flex gap-2">
          {[{ val: '', label: 'All' }, { val: 'free', label: '● Free' }, { val: 'booked', label: '● Booked' }].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => onFilterChange({ bookingStatus: val })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                (filters.bookingStatus || '') === val
                  ? 'border-[#C9960A] bg-[#C9960A]/10 text-[#C9960A]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* State Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#0D1B3E] mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#C9960A]" /> State
        </label>
        <select
          value={filters.state}
          onChange={(e) => onFilterChange({ state: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] bg-white"
        >
          <option value="">All States</option>
          {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* LGA / City Filter */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#0D1B3E] mb-2 uppercase tracking-wide">LGA / City</label>
        <input
          type="text"
          value={filters.city || filters.lga || ''}
          onChange={(e) => onFilterChange({ city: e.target.value, lga: e.target.value })}
          placeholder="Search LGA or city..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A]"
        />
      </div>

      {/* Service Filter */}
      <div className="mb-2">
        <label className="block text-xs font-semibold text-[#0D1B3E] mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#C9960A]" /> Service
        </label>
        <select
          value={filters.service}
          onChange={(e) => onFilterChange({ service: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] bg-white"
        >
          <option value="">All Services</option>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Active filters summary */}
      {activeCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
          {filters.state && <div className="text-xs text-gray-500">State: <strong>{filters.state}</strong></div>}
          {(filters.city || filters.lga) && <div className="text-xs text-gray-500">LGA: <strong>{filters.city || filters.lga}</strong></div>}
          {filters.service && <div className="text-xs text-gray-500">Service: <strong>{filters.service.split(' ').slice(0, 2).join(' ')}</strong></div>}
          {filters.bookingStatus && <div className="text-xs text-gray-500">Status: <strong className="capitalize">{filters.bookingStatus}</strong></div>}
        </div>
      )}
    </div>
  );
}

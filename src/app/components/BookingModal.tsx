import { useState } from 'react';
import { X, User, Phone, MapPin, Briefcase, CheckCircle } from 'lucide-react';
import { bookingApi } from '../../utils/api';

const SERVICES = [
  'Package Pickup & Delivery',
  'Groceries & Foodstuff Shopping',
  'Back-to-School Runs',
  'Market Runs & Other Errands',
];

interface BookingModalProps {
  agent: {
    id: string;
    business_name: string;
    whatsapp_number: string;
    location_state: string;
  };
  onClose: () => void;
  onBooked?: () => void;
}

export default function BookingModal({ agent, onClose, onBooked }: BookingModalProps) {
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    service: '',
    pickup_address: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.client_name || !form.client_phone || !form.service) {
      setError('Please fill in your name, phone, and service type.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await bookingApi.create({
        agent_id: agent.id,
        ...form,
      });
      setDone(true);
      onBooked?.();
    } catch (e: any) {
      // Booking failed silently — fall back to WhatsApp
      const phoneNumber = agent.whatsapp_number.replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(
        `Hello ${agent.business_name}, I'd like to book you for: ${form.service}.\nPickup: ${form.pickup_address || 'TBD'}\nMy name: ${form.client_name} | Phone: ${form.client_phone}`
      );
      window.open(`https://wa.me/${phoneNumber}?text=${msg}`, '_blank');
      setDone(true);
      onBooked?.();
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0D1B3E] mb-2">Booking Requested!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your booking with <strong>{agent.business_name}</strong> has been submitted. They will contact you shortly.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#0D1B3E] text-white rounded-xl font-semibold hover:bg-[#1A3170] transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#0D1B3E]">Book Agent</h2>
            <p className="text-sm text-gray-500">{agent.business_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0D1B3E] mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Your Name *
            </label>
            <input
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0D1B3E] mb-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Phone Number *
            </label>
            <input
              type="tel"
              value={form.client_phone}
              onChange={(e) => set('client_phone', e.target.value)}
              placeholder="e.g. 08012345678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0D1B3E] mb-1 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" /> Service Needed *
            </label>
            <select
              value={form.service}
              onChange={(e) => set('service', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] focus:border-transparent"
            >
              <option value="">Select a service...</option>
              {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0D1B3E] mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Pickup / Delivery Address
            </label>
            <input
              value={form.pickup_address}
              onChange={(e) => set('pickup_address', e.target.value)}
              placeholder="Street, area, LGA..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0D1B3E] mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any specific instructions..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9960A] focus:border-transparent resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#C9960A] text-[#0D1B3E] rounded-xl font-bold hover:bg-[#E8B84B] transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

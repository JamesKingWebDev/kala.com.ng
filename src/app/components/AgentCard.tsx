import { MapPin, Package, Star, Clock, MessageCircle, CheckCircle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AgentCardProps {
  agent: {
    id: string;
    business_name: string;
    description?: string;
    profile_image_url?: string;
    whatsapp_number: string;
    location_city: string;
    location_state: string;
    current_lga?: string;
    services: string[];
    rating?: number;
    total_reviews?: number;
    is_verified: boolean;
    expiresAt?: string;
    booking_status?: 'free' | 'booked';
  };
  onBook?: (agent: any) => void;
}

export default function AgentCard({ agent, onBook }: AgentCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!agent.expiresAt) return;
    const update = () => {
      const diff = new Date(agent.expiresAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeRemaining(`${h}h ${m}m left`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [agent.expiresAt]);

  const handleWhatsApp = () => {
    const phone = agent.whatsapp_number.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hi ${agent.business_name}, I found you on KALA and I'd like to inquire about your services.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const isFree = agent.booking_status !== 'booked';
  const lga = agent.current_lga || agent.location_city;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-[#0D1B3E]/5 group">
      {/* Header */}
      <div className="relative h-28 bg-gradient-to-br from-[#0D1B3E] to-[#1A3170]">
        {agent.profile_image_url ? (
          <img src={agent.profile_image_url} alt={agent.business_name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-[#C9960A]/40" />
          </div>
        )}
        {/* Decorative gold line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C9960A] to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {agent.is_verified && (
            <span className="bg-[#C9960A] text-[#0D1B3E] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
          <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-bold ${
            isFree ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {isFree ? '● Available' : '● Booked'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-[#0D1B3E] mb-1 leading-tight">{agent.business_name}</h3>

        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#C9960A] flex-shrink-0" />
          <span>{lga}, {agent.location_state}</span>
        </div>

        {agent.description && (
          <p className="text-gray-500 text-xs mb-3 line-clamp-2 leading-relaxed">{agent.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.services.slice(0, 2).map((s, i) => (
            <span key={i} className="bg-[#0D1B3E]/5 text-[#0D1B3E] px-2 py-0.5 rounded-full text-xs font-medium">
              {s.split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
          {agent.services.length > 2 && (
            <span className="bg-[#C9960A]/10 text-[#C9960A] px-2 py-0.5 rounded-full text-xs font-medium">
              +{agent.services.length - 2}
            </span>
          )}
        </div>

        {(agent.total_reviews || 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 text-[#C9960A] fill-[#C9960A]" />
            <span className="font-semibold text-[#0D1B3E] text-xs">{(agent.rating || 0).toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({agent.total_reviews})</span>
          </div>
        )}

        {timeRemaining && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeRemaining}</span>
          </div>
        )}

        <div className="flex gap-2">
          {onBook && isFree && (
            <button
              onClick={() => onBook(agent)}
              className="flex-1 bg-[#C9960A] hover:bg-[#E8B84B] text-[#0D1B3E] font-bold py-2.5 rounded-lg transition text-xs flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Book
            </button>
          )}
          <button
            onClick={handleWhatsApp}
            className={`flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-lg transition text-xs ${
              onBook && isFree ? 'flex-1 bg-green-600 hover:bg-green-700 text-white' : 'w-full bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

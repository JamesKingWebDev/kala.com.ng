import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

export interface MapAgent {
  id: string;
  business_name: string;
  whatsapp_number: string;
  location_city: string;
  location_state: string;
  current_lga?: string;
  current_lat?: number;
  current_lng?: number;
  booking_status?: 'free' | 'booked';
  isActive?: boolean;
  services?: string[];
}

interface AgentMapProps {
  agents: MapAgent[];
  onBookAgent?: (agent: MapAgent) => void;
  height?: string;
  centerLat?: number;
  centerLng?: number;
}

// Leaflet is loaded lazily to avoid SSR issues
let leafletLoaded = false;
let L: any = null;

async function ensureLeaflet() {
  if (leafletLoaded) return L;
  const leafletModule = await import('leaflet');
  L = leafletModule.default || leafletModule;
  leafletLoaded = true;

  // Fix default marker icons
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
  return L;
}

function makeIcon(color: string, lib: any) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 11.9 14.3 24.8 15.5 25.8a.77.77 0 0 0 1 0C17.7 40.8 32 27.9 32 16 32 7.16 24.84 0 16 0z" fill="${color}"/>
    <circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/>
  </svg>`;
  return lib.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

export default function AgentMap({ agents, onBookAgent, height = '420px', centerLat = 9.082, centerLng = 8.675 }: AgentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      const lib = await ensureLeaflet();
      if (!mounted || !mapRef.current || mapInstanceRef.current) return;

      // Inject Leaflet CSS if not already present
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      const map = lib.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: 6,
        zoomControl: true,
      });

      lib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      mounted = false;
    };
  }, [centerLat, centerLng]);

  // Update markers when agents change
  useEffect(() => {
    const updateMarkers = async () => {
      const lib = await ensureLeaflet();
      const map = mapInstanceRef.current;
      if (!map || !lib) return;

      // Remove old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const agentsWithCoords = agents.filter((a) => a.current_lat && a.current_lng);

      agentsWithCoords.forEach((agent) => {
        const isFree = agent.booking_status !== 'booked';
        const color = isFree ? '#22c55e' : '#ef4444';
        const icon = makeIcon(color, lib);

        const marker = lib
          .marker([agent.current_lat!, agent.current_lng!], { icon })
          .addTo(map);

        const services = (agent.services || []).slice(0, 2).join(', ');
        const lga = agent.current_lga || agent.location_city;
        const statusBadge = isFree
          ? '<span style="color:#16a34a;font-weight:600">● Free</span>'
          : '<span style="color:#dc2626;font-weight:600">● Booked</span>';

        const bookBtn = onBookAgent && isFree
          ? `<button id="book-${agent.id}" style="margin-top:8px;width:100%;padding:6px 0;background:#C9960A;color:#0D1B3E;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px;">Book Agent</button>`
          : '';

        marker.bindPopup(`
          <div style="min-width:180px;font-family:Inter,sans-serif;">
            <div style="font-weight:700;font-size:14px;color:#0D1B3E;margin-bottom:4px;">${agent.business_name}</div>
            <div style="font-size:12px;color:#555;margin-bottom:2px;">📍 ${lga}, ${agent.location_state}</div>
            ${services ? `<div style="font-size:11px;color:#777;margin-bottom:4px;">${services}</div>` : ''}
            <div style="font-size:12px;margin-bottom:4px;">${statusBadge}</div>
            ${bookBtn}
          </div>
        `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`book-${agent.id}`);
          if (btn && onBookAgent) {
            btn.onclick = () => {
              marker.closePopup();
              onBookAgent(agent);
            };
          }
        });

        markersRef.current.push(marker);
      });

      // Auto-fit bounds if there are agents with coords
      if (agentsWithCoords.length > 0) {
        const bounds = lib.latLngBounds(agentsWithCoords.map((a) => [a.current_lat!, a.current_lng!]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    };

    updateMarkers();
  }, [agents, onBookAgent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const agentsWithCoords = agents.filter((a) => a.current_lat && a.current_lng);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#0D1B3E]/10 shadow-lg" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-[1000] text-xs space-y-1.5">
        <div className="font-semibold text-[#0D1B3E] mb-1">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-700">Booked</span>
        </div>
      </div>

      {/* No location data notice */}
      {agentsWithCoords.length === 0 && agents.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-[999]">
          <div className="bg-white rounded-xl p-6 text-center max-w-xs shadow-xl mx-4">
            <MapPin className="w-10 h-10 text-[#C9960A] mx-auto mb-3" />
            <p className="font-semibold text-[#0D1B3E] text-sm mb-1">No GPS locations yet</p>
            <p className="text-gray-500 text-xs">Agents appear on the map once they share their location from their dashboard.</p>
          </div>
        </div>
      )}

      {agents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-[999]">
          <div className="bg-white rounded-xl p-6 text-center max-w-xs shadow-xl mx-4">
            <MapPin className="w-10 h-10 text-[#C9960A] mx-auto mb-3" />
            <p className="font-semibold text-[#0D1B3E] text-sm">No active agents in this area</p>
          </div>
        </div>
      )}
    </div>
  );
}

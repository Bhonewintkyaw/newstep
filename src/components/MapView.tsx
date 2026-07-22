import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  iconName: string;
  containerBgClass: string;
}

interface MapViewProps {
  markers: MapMarker[];
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMarkerClick: (id: string) => void;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export const MapView: React.FC<MapViewProps> = ({
  markers,
  center,
  zoom = 13,
  className = '',
  onMarkerClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((mk) => {
      const marker = L.marker([mk.lat, mk.lng])
        .addTo(map)
        .bindTooltip(mk.name, { direction: 'top', offset: L.point(0, -10) });

      marker.on('click', () => onMarkerClick(mk.id));
      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], zoom);
    }
  }, [markers]);

  // Update center if it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || markers.length > 0) return;
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  return <div ref={mapRef} className={`w-full h-full rounded-3xl ${className}`} />;
};

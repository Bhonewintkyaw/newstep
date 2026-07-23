import React, { useEffect, useRef, useState } from 'react';
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
  onLocationChange?: (location: { lat: number; lng: number; accuracy: number }) => void;
  language?: 'my' | 'en';
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
  onLocationChange,
  language = 'en',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState('');

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
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and keep the live search location in view.
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

    if (markers.length > 0) {
      const points: [number, number][] = [
        [center.lat, center.lng],
        ...markers.map((marker) => [marker.lat, marker.lng] as [number, number]),
      ];
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    }
  }, [center.lat, center.lng, markers, zoom]);

  // Update center if it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || markers.length > 0) return;
    map.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom]);

  const toggleLiveLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError(language === 'my' ? 'ဤဘရောက်ဇာတွင် တည်နေရာစနစ် မပါဝင်ပါ။' : 'Location is not supported by this browser.');
      return;
    }

    setLocationError('');
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const latLng: L.LatLngExpression = [coords.latitude, coords.longitude];
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.circleMarker(latLng, {
            radius: 9,
            color: '#ffffff',
            weight: 3,
            fillColor: '#006d77',
            fillOpacity: 1,
          }).addTo(map).bindTooltip('Your live location');
          accuracyCircleRef.current = L.circle(latLng, {
            radius: coords.accuracy,
            color: '#006d77',
            weight: 1,
            fillColor: '#9becf7',
            fillOpacity: 0.14,
          }).addTo(map);
        } else {
          userMarkerRef.current.setLatLng(latLng);
          accuracyCircleRef.current?.setLatLng(latLng).setRadius(coords.accuracy);
        }
        map.setView(latLng, Math.max(map.getZoom(), 15));
        onLocationChange?.({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? (language === 'my' ? 'တည်နေရာအသုံးပြုခွင့် ပိတ်ထားပါသည်။' : 'Location permission was denied.')
          : (language === 'my' ? 'လက်ရှိတည်နေရာကို မဖတ်နိုင်ပါ။' : 'Unable to read your current location.'));
        setIsTracking(false);
        watchIdRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-3xl" />
      <button
        type="button"
        onClick={toggleLiveLocation}
        aria-pressed={isTracking}
        className={`absolute z-[500] right-3 top-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold shadow-lg border cursor-pointer ${isTracking ? 'bg-[#00535b] text-white border-[#00535b]' : 'bg-white text-[#00535b] border-[#00535b]/20'}`}
      >
        <span className="material-symbols-outlined text-lg">{isTracking ? 'location_searching' : 'my_location'}</span>
        <span>{isTracking
          ? (language === 'my' ? 'တိုက်ရိုက်တည်နေရာ ဖွင့်ထားသည်' : 'Live location on')
          : (language === 'my' ? 'ကျွန်ုပ်၏တည်နေရာ သုံးမည်' : 'Use my location')}</span>
      </button>
      {locationError && (
        <div role="alert" className="absolute z-[500] inset-x-3 bottom-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#ba1a1a] shadow-lg">
          {locationError}
        </div>
      )}
    </div>
  );
};

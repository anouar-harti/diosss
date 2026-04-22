import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Loader2, Navigation, Map as MapIcon } from 'lucide-react';
import { Coordinates } from '../types';
import L from 'leaflet';

// Use CDN URLs for markers to avoid ESM import errors for image assets
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocatorProps {
  location: Coordinates | null;
  setLocation: (loc: Coordinates) => void;
  manualAddress: string;
  setManualAddress: (addr: string) => void;
}

// Component to recenter map when coords change
const RecenterMap: React.FC<{ coords: Coordinates }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng], map.getZoom());
  }, [coords, map]);
  return null;
};

const MapLocator: React.FC<MapLocatorProps> = ({ location, setLocation, manualAddress, setManualAddress }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocate = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("La geolocalización no es soportada por este navegador.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError("No se pudo obtener la ubicación. Por favor, ingrese la dirección manualmente.");
        setLoading(false);
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };

  // Initial locate if no location set
  useEffect(() => {
    if (!location) {
      handleLocate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <MapPin size={18} className="text-blue-500"/> Ubicación del Trabajo
        </h3>
        <button 
          onClick={handleLocate}
          disabled={loading}
          className="text-xs bg-white dark:bg-slate-800 border border-slate-300 px-3 py-1 rounded-md text-slate-600 hover:bg-slate-50 dark:bg-slate-900 flex items-center gap-1"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
          {loading ? "Buscando..." : "GPS"}
        </button>
      </div>
      
      <div className="h-48 w-full relative z-0">
        {location ? (
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={15} 
            scrollWheelZoom={false} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                Ubicación registrada.
              </Popup>
            </Marker>
            <RecenterMap coords={location} />
          </MapContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 dark:text-slate-500">
            {error ? (
               <p className="text-red-400 text-sm px-4 text-center">{error}</p>
            ) : (
               <>
                 <MapPin size={48} className="mb-2 opacity-50"/>
                 <p>Obteniendo ubicación...</p>
               </>
            )}
          </div>
        )}
      </div>
      
      {/* Manual Address Input */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapIcon size={12} /> Dirección Manual (Opcional)
        </label>
        <input 
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Ej. Calle Principal 123, 4º A (Si el mapa falla o para más detalle)"
            className="w-full text-sm p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
        />
        {location && !manualAddress && (
             <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">
                Coordenadas GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
             </p>
        )}
      </div>
    </div>
  );
};

export default MapLocator;
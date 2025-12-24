"use client";
import React, { useEffect, useState } from 'react';

// Import Leaflet dynamically to avoid SSR issues
let L: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let MapContainer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let TileLayer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let useMapEvents: any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface FinalDestiny {
  latitude: number;
  longitude: number;
}

interface MapDialogComponentProps {
  finalDestiny?: FinalDestiny;
  onSaved: (newDestiny: FinalDestiny) => void;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (location: FinalDestiny) => void }) {
  const [position, setPosition] = useState<FinalDestiny | null>(null);

  const map = useMapEvents({
    click(e) {
      const newPos = { latitude: e.latlng.lat, longitude: e.latlng.lng };
      setPosition(newPos);
      onLocationSelect(newPos);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <div>
      {/* React-leaflet doesn't need a Marker component here since we're just handling clicks */}
    </div>
  );
}

export default function MapDialogComponent({ finalDestiny, onSaved }: MapDialogComponentProps) {
  const [selectedLocation, setSelectedLocation] = useState<FinalDestiny | null>(finalDestiny || null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const defaultCenter: [number, number] = finalDestiny 
    ? [finalDestiny.latitude, finalDestiny.longitude]
    : [-34.6037, -58.3816]; // Buenos Aires

  useEffect(() => {
    const loadMapDependencies = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Import CSS first
          await import('leaflet/dist/leaflet.css');
          
          // Import Leaflet
          const leafletModule = await import('leaflet');
          L = leafletModule.default;
          
          // Import React Leaflet components
          const reactLeafletModule = await import('react-leaflet');
          MapContainer = reactLeafletModule.MapContainer;
          TileLayer = reactLeafletModule.TileLayer;
          useMapEvents = reactLeafletModule.useMapEvents;
          
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading map dependencies:', error);
        }
      }
    };

    loadMapDependencies();
  }, []);

  const handleLocationSelect = (location: FinalDestiny) => {
    setSelectedLocation(location);
  };

  const handleSave = () => {
    if (selectedLocation) {
      onSaved(selectedLocation);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-96 w-full">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedLocation 
            ? `Ubicación: ${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
            : 'Haz clic en el mapa para seleccionar una ubicación'
          }
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedLocation}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Guardar Ubicación
        </button>
      </div>
    </div>
  );
}

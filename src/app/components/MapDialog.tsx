"use client";

import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { useMapEvents } from 'react-leaflet';
import { getApiUrl } from '../utils/api';

interface FinalDestiny {
  id: number;
  latitude: number;
  longitude: number;
  tag: string;
  name: string;
}

interface MapDialogProps {
  open: boolean;
  onClose: () => void;
  finalDestiny: FinalDestiny;
  onSaved: (newDestiny: FinalDestiny) => void;
}

const markerIconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const markerIconShadow = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DynamicMapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const DynamicTileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

export default function MapDialog({ open, onClose, finalDestiny, onSaved }: MapDialogProps) {
  const [lat, setLat] = useState<number>(finalDestiny.latitude);
  const [lng, setLng] = useState<number>(finalDestiny.longitude);
  const [address, setAddress] = useState<string>(finalDestiny.name);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setLat(finalDestiny.latitude);
    setLng(finalDestiny.longitude);
    setAddress(finalDestiny.name);
  }, [finalDestiny]);

  const fetchAddressFromLatLng = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setAddress(data.display_name || '');
    } catch (e) {
      setAddress('No se pudo obtener la dirección');
    } finally {
      setLoading(false);
    }
  };

  function CenterWatcher() {
    useMapEvents({
      moveend: (e: L.LeafletEvent) => {
        const center = e.target.getCenter();
        setLat(center.lat);
        setLng(center.lng);
        fetchAddressFromLatLng(center.lat, center.lng);
      },
    });
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    await fetch(getApiUrl(`/point/${finalDestiny.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        tag: finalDestiny.tag,
        name: address,
      }),
    });
    setSaving(false);
    onSaved({ ...finalDestiny, latitude: lat, longitude: lng, name: address });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[700px] max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-purple-600">&times;</button>
        <h2 className="text-2xl font-bold text-center text-purple-600 mb-2">
          Ubicación del pedido #{finalDestiny.id}
        </h2>
        <div className="text-center mb-2 text-gray-700">
          Selecciona la ubicación exacta del pedido
        </div>
        <div className="text-center mb-4 text-gray-500">
          {loading ? 'Obteniendo dirección...' : address}
        </div>
        <div className="w-full h-96 mb-4 rounded overflow-hidden relative">
          <DynamicMapContainer
            center={[lat, lng]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            dragging={true}
            doubleClickZoom={true}
            scrollWheelZoom={true}
          >
            <DynamicTileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CenterWatcher />
          </DynamicMapContainer>
          <img
            src={markerIconUrl}
            alt="marker"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -100%)',
              zIndex: 500,
              pointerEvents: 'none',
              width: 30,
              height: 41,
            }}
          />
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded-lg">Volver</button>
          <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
} 
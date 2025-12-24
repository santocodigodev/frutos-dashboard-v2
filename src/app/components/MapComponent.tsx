"use client";
import React, { useEffect, useState, useRef } from "react";

// Import Leaflet dynamically to avoid SSR issues
let L: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let MapContainer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let TileLayer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Marker: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let useMap: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let useMapEvents: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Tooltip: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Rectangle: any; // eslint-disable-line @typescript-eslint/no-explicit-any

let blueMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let purpleMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let markerShadow: any; // eslint-disable-line @typescript-eslint/no-explicit-any

// Icons will be initialized after loading
let markerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let selectedMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface MapComponentProps {
  filtered: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedMarkers: Map<number, boolean>;
  onMarkerClick: (orderId: number) => void;
  mapBounds: L.LatLngBounds | null;
  selectionBox: {start: L.LatLng | null, end: L.LatLng | null};
  isSelecting: boolean;
  onSelectionStart: (latlng: L.LatLng) => void;
  onSelectionMove: (latlng: L.LatLng) => void;
  onSelectionEnd: () => void;
}

// Component to handle map bounds updates
function MapBoundsUpdater({ mapBounds }: { mapBounds: L.LatLngBounds | null }) {
  const map = useMap();
  const hasCentered = useRef(false);
  
  useEffect(() => {
    // Centrar SOLO la primera vez que hay bounds
    if (mapBounds && !hasCentered.current) {
      map.fitBounds(mapBounds);
      hasCentered.current = true;
    }
  }, []); // Array vacío = solo se ejecuta al montar el componente

  return null;
}

// Component to handle map events
function MapEvents({ onSelectionStart, onSelectionMove, onSelectionEnd, isSelecting, selectionBox, filtered, selectedMarkers, onMarkerClick }: {
  onSelectionStart: (latlng: L.LatLng) => void;
  onSelectionMove: (latlng: L.LatLng) => void;
  onSelectionEnd: () => void;
  isSelecting: boolean;
  selectionBox: {start: L.LatLng | null, end: L.LatLng | null};
  filtered: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedMarkers: Map<number, boolean>;
  onMarkerClick: (orderId: number) => void;
}) {
  const map = useMap();
  
  useMapEvents({
    mousedown: (e) => {
      if (e.originalEvent.button === 0) { // Left click only
        onSelectionStart(e.latlng);
        // Deshabilitar el dragging del mapa
        map.dragging.disable();
      }
    },
    mousemove: (e) => {
      if (isSelecting && selectionBox.start) {
        onSelectionMove(e.latlng);
      }
    },
    mouseup: () => {
      if (isSelecting && selectionBox.start && selectionBox.end) {
        const bounds = L.latLngBounds([selectionBox.start, selectionBox.end]);
        
        // Find all markers within the selection box
        const selectedIds = filtered
          .filter((order: any) => bounds.contains([order.finalDestiny.latitude, order.finalDestiny.longitude])) // eslint-disable-line @typescript-eslint/no-explicit-any
          .map((order: any) => order.o_id); // eslint-disable-line @typescript-eslint/no-explicit-any

        // Update selected markers
        selectedIds.forEach(id => {
          onMarkerClick(id);
        });
      }
      // Rehabilitar el dragging del mapa
      map.dragging.enable();
      onSelectionEnd();
    }
  });
  return null;
}

export default function MapComponent({
  filtered,
  selectedMarkers,
  onMarkerClick,
  mapBounds,
  selectionBox,
  isSelecting,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd
}: MapComponentProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const defaultCenter: [number, number] = [-34.6037, -58.3816]; // Buenos Aires
  const defaultZoom = 13;

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
          Marker = reactLeafletModule.Marker;
          useMap = reactLeafletModule.useMap;
          useMapEvents = reactLeafletModule.useMapEvents;
          Tooltip = reactLeafletModule.Tooltip;
          Rectangle = reactLeafletModule.Rectangle;
          
          // Import icons
          const blueIcon = await import('../icons/marker-blue.svg');
          const purpleIcon = await import('../icons/marker-purple.svg');
          const shadowIcon = await import('../icons/marker-shadow.svg');
          
          blueMarkerIcon = blueIcon.default;
          purpleMarkerIcon = purpleIcon.default;
          markerShadow = shadowIcon.default;
          
          // Create icon instances
          markerIcon = new L.Icon({
            iconUrl: blueMarkerIcon.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: markerShadow.src,
            shadowSize: [41, 41],
          });

          selectedMarkerIcon = new L.Icon({
            iconUrl: purpleMarkerIcon.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: markerShadow.src,
            shadowSize: [41, 41],
          });
          
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading map dependencies:', error);
        }
      }
    };

    loadMapDependencies();
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden mb-4 relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <MapBoundsUpdater mapBounds={mapBounds} />
        <MapEvents 
          onSelectionStart={onSelectionStart}
          onSelectionMove={onSelectionMove}
          onSelectionEnd={onSelectionEnd}
          isSelecting={isSelecting}
          selectionBox={selectionBox}
          filtered={filtered}
          selectedMarkers={selectedMarkers}
          onMarkerClick={onMarkerClick}
        />
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Selection Box */}
        {selectionBox.start && selectionBox.end && (
          <Rectangle
            bounds={[
              [selectionBox.start.lat, selectionBox.start.lng],
              [selectionBox.end.lat, selectionBox.end.lng]
            ]}
            pathOptions={{
              color: '#9333ea',
              fillColor: '#9333ea',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        )}
        {filtered.map((order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const isSelected = selectedMarkers.get(order.o_id) || false;
          return (
            <Marker
              key={order.o_id}
              position={[order.finalDestiny.latitude, order.finalDestiny.longitude]}
              icon={isSelected ? selectedMarkerIcon : markerIcon}
              eventHandlers={{
                click: () => onMarkerClick(order.o_id)
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                permanent={false}
              >
                <div className="text-center pointer-events-none select-none">
                  <b className="text-purple-600 text-base">#{order.TN_Order_number == 0 ? order.o_id : order.TN_Order_number}</b>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      {filtered.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg bg-white/80 z-10">
          No hay pedidos con ubicación para esta zona.
        </div>
      )}
    </div>
  );
}

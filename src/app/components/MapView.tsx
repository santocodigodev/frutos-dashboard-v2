"use client";
import React, { useEffect, useState, useRef } from "react";

let L: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let MapContainer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let TileLayer: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Marker: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let useMap: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let useMapEvents: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Tooltip: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let Rectangle: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let MapInstanceRef: any; // eslint-disable-line @typescript-eslint/no-explicit-any

let blueMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let purpleMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let markerShadow: any; // eslint-disable-line @typescript-eslint/no-explicit-any

let markerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
let selectedMarkerIcon: any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface MapViewProps {
  orders: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  onMarkersSelected: (selectedIds: number[]) => void;
}

// Component to update map bounds based on orders
function MapBoundsUpdater({ bounds }: { bounds: any[] }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const map = useMap();
  
  useEffect(() => {
    if (bounds.length > 0 && L) {
      const validOrders = bounds.filter(
        (o: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          o.finalDestiny &&
          typeof o.finalDestiny.latitude === "number" &&
          typeof o.finalDestiny.longitude === "number"
      );
      
      if (validOrders.length > 0) {
        const coordinates = validOrders.map((order: any) => [ // eslint-disable-line @typescript-eslint/no-explicit-any
          order.finalDestiny.latitude,
          order.finalDestiny.longitude
        ]);
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [bounds, map]);
  
  return null;
}

// (Removed MapEvents to avoid any potential overlay interference)

// Component for selection box
function SelectionBox({ 
  selectionBox, 
  onSelectionEnd, 
  onMarkersSelected, 
  orders 
}: { 
  selectionBox: { start: any, end: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  onSelectionEnd: () => void;
  onMarkersSelected: (selectedIds: number[]) => void;
  orders: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  useEffect(() => {
    if (selectionBox.start && selectionBox.end && L) {
      const bounds = L.latLngBounds([selectionBox.start, selectionBox.end]);
      
      const selectedIds = orders
        .filter((order: any) => order.finalDestiny && bounds.contains([order.finalDestiny.latitude, order.finalDestiny.longitude])) // eslint-disable-line @typescript-eslint/no-explicit-any
        .map((order: any) => order.o_id); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      onMarkersSelected(selectedIds);
      onSelectionEnd();
    }
  }, [selectionBox, orders, onMarkersSelected, onSelectionEnd]);
  
  if (!selectionBox.start || !selectionBox.end) return null;
  
  return (
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
  );
}

export default function MapView({ orders, onMarkersSelected }: MapViewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMarkers, setSelectedMarkers] = useState<Map<number, boolean>>(new Map());
  const [selectionBox, setSelectionBox] = useState<{ start: any, end: any }>({ start: null, end: null }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isSelecting, setIsSelecting] = useState(false);
  const mapRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const defaultCenter: [number, number] = [-34.6037, -58.3816];
  const defaultZoom = 13;

  useEffect(() => {
    const loadMapDependencies = async () => {
      if (typeof window !== 'undefined') {
        try {
          await import('leaflet/dist/leaflet.css');
          const leafletModule = await import('leaflet');
          L = leafletModule.default;
          const reactLeafletModule = await import('react-leaflet');
          MapContainer = reactLeafletModule.MapContainer;
          TileLayer = reactLeafletModule.TileLayer;
          Marker = reactLeafletModule.Marker;
          useMap = reactLeafletModule.useMap;
          useMapEvents = reactLeafletModule.useMapEvents;
          Tooltip = reactLeafletModule.Tooltip;
          Rectangle = reactLeafletModule.Rectangle;
          MapInstanceRef = function MapInstanceRefInternal({ onReady }: { onReady: (map: any) => void }) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const map = useMap();
            useEffect(() => {
              onReady(map);
            }, [map, onReady]);
            return null;
          };

          // Import marker icons
          const blueIcon = await import('../icons/marker-blue.svg');
          const purpleIcon = await import('../icons/marker-purple.svg');
          const shadowIcon = await import('../icons/marker-shadow.svg');

          // Create marker icons
          markerIcon = new L.Icon({
            iconUrl: blueIcon.default.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: shadowIcon.default.src,
            shadowSize: [41, 41],
          });

          selectedMarkerIcon = new L.Icon({
            iconUrl: purpleIcon.default.src,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: shadowIcon.default.src,
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

  useEffect(() => {
    onMarkersSelected(Array.from(selectedMarkers.entries()).filter(([, isSelected]) => isSelected).map(([id]) => id));
  }, [selectedMarkers, onMarkersSelected]);

  const handleMarkerClick = (orderId: number) => {
    setSelectedMarkers(prev => {
      const newMap = new Map(prev);
      newMap.set(orderId, !newMap.get(orderId));
      return newMap;
    });
  };

  const handleMouseDown = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (e.originalEvent?.button === 0) {
      setIsSelecting(true);
      setSelectionBox({ start: e.latlng, end: e.latlng });
      // Disable map drag while selecting
      try { mapRef.current?.dragging?.disable(); } catch {}
    }
  };

  const handleMouseMove = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (isSelecting && selectionBox.start) {
      setSelectionBox(prev => ({ ...prev, end: e.latlng }));
    }
  };

  const handleMouseUp = (e?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox({ start: null, end: null });
      // Re-enable map drag after selection
      try { mapRef.current?.dragging?.enable(); } catch {}
    }
  };

  // Ensure selection ends even if mouse is released outside the map
  useEffect(() => {
    if (!isSelecting) return;
    const onWindowMouseUp = () => {
      handleMouseUp();
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isSelecting]);

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden mb-4 relative" style={{ zIndex: 1, pointerEvents: 'auto' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}
        dragging={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleMouseUp}
      >
        {/* Bridge to capture map instance for drag enable/disable */}
        {useMap && (
          <MapInstanceRef onReady={(map: any) => { mapRef.current = map; }} />
        )}
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater bounds={orders} />
        {orders.map((order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!order.finalDestiny || 
              typeof order.finalDestiny.latitude !== "number" || 
              typeof order.finalDestiny.longitude !== "number") {
            return null;
          }
          
          const isSelected = selectedMarkers.get(order.o_id) || false;
          
          return (
            <Marker
              key={order.o_id}
              position={[order.finalDestiny.latitude, order.finalDestiny.longitude]}
              icon={isSelected ? selectedMarkerIcon : markerIcon}
              eventHandlers={{
                click: () => handleMarkerClick(order.o_id)
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -10]}
                opacity={1}
                permanent={false}
              >
                <div className="text-center pointer-events-none select-none">
                  <b className="text-purple-600 text-base">#{order.TN_Order_number || order.o_id}</b>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
        <SelectionBox
          selectionBox={selectionBox}
          onSelectionEnd={handleMouseUp}
          onMarkersSelected={onMarkersSelected}
          orders={orders}
        />
      </MapContainer>
    </div>
  );
}

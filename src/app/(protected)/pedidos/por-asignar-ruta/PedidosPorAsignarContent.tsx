"use client";

import { useUserOrRedirect } from "../../../utils/auth";
import { usePedidos } from "../PedidosContext";
import React, { useEffect, useState, useRef, useMemo } from "react";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Tooltip, Rectangle } from "react-leaflet";
import type { Map as LeafletMap } from 'leaflet';
import AssignRouteDialog from "../../../components/AssignRouteDialog";
import CreateRouteDialog from "../../../components/CreateRouteDialog";
import OrderDetailDialog from "../../../components/OrderDetailDialog";
import { getApiUrl, getAuthHeaders } from "../../../utils/api";
import { getFormattedPaymentType } from "../../../utils/formatPaymentType";
import { getFormattedDeliveryType } from "../../../utils/formatDeliveryType";
import blueMarkerIcon from '../../../icons/marker-blue.svg';
import purpleMarkerIcon from '../../../icons/marker-purple.svg';
import markerShadow from '../../../icons/marker-shadow.svg';

// Iconos personalizados - creados a nivel de módulo como en LiveMapDialog
const blueIcon = new L.Icon({
  iconUrl: blueMarkerIcon.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow.src,
  shadowSize: [41, 41],
});

const purpleIcon = new L.Icon({
  iconUrl: purpleMarkerIcon.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow.src,
  shadowSize: [41, 41],
});

export default function PedidosPorAsignarContent() {
  useUserOrRedirect();
  const { orders, loading, refreshOrders } = usePedidos();
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | undefined>(undefined);
  const [selectedMarkers, setSelectedMarkers] = useState<Map<number, boolean>>(new Map());
  const [mapBounds, setMapBounds] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const boundsInitialized = useRef<boolean>(false);
  const [fullOrders, setFullOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>({});
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{start: any | null, end: any | null}>({ start: null, end: null });
  const [isSelecting, setIsSelecting] = useState(false);
  const [timezones, setTimezones] = useState<any[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<string | undefined>(undefined);
  const [isAssignRouteOpen, setIsAssignRouteOpen] = useState(false);
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);

  // Initialize user from localStorage on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  // Fetch zones and timezones only once on mount
  useEffect(() => {
    if (!user.token) return;
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Fetch Zones
        const zonesRes = await fetch(getApiUrl('/zone'), {
          headers: getAuthHeaders()
        });
        const zonesData = await zonesRes.json();
        if (isMounted) {
          setZones(zonesData);
          if (zonesData.length > 0 && selectedZone === undefined) {
            setSelectedZone(zonesData[0].name);
          }
        }

        // Fetch Timezones
        const timezonesRes = await fetch(getApiUrl('/timezone'), {
          headers: getAuthHeaders()
        });
        const timezonesData = await timezonesRes.json();
        if (isMounted) {
          setTimezones(timezonesData);
          if (timezonesData.length > 0 && selectedTimezone === undefined) {
            setSelectedTimezone(timezonesData[0].name);
          }
        }

      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.token]);

  // Calculate filtered order IDs using useMemo to avoid unnecessary recalculations
  const filteredOrderIds = useMemo(() => {
    if (selectedZone === undefined || selectedTimezone === undefined || !orders || orders.length === 0) {
      return [];
    }
    
    const filteredOrders = orders.filter((o: any) =>
      o.o_localStatus === "pending_route_assignment" &&
      o.zone === selectedZone && 
      o.timezone === selectedTimezone
    );
    
    return filteredOrders.map((o: any) => o.o_id);
  }, [selectedZone, selectedTimezone, orders]);

  // Fetch orders when filtered IDs change
  useEffect(() => {
    if (filteredOrderIds.length === 0) {
      setFullOrders([]);
      setIsLoadingOrders(false);
      return;
    }
    
    let isMounted = true;
    
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await fetch(getApiUrl('/orders/get-by-ids'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ids: filteredOrderIds })
        });
        const data = await response.json();
        if (isMounted) {
          setFullOrders(data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (isMounted) {
          setFullOrders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrders(false);
        }
      }
    };

    fetchOrders();
    
    return () => {
      isMounted = false;
    };
  }, [filteredOrderIds]);

  // Component to handle map events
  function MapEventHandler() {
    const map = useMap();

    useEffect(() => {
      if (map && !boundsInitialized.current) {
        mapRef.current = map;
        // Only update bounds once when map is ready, not on every render
        const updateBounds = () => {
          if (boundsInitialized.current) return;
          try {
            const bounds = map.getBounds();
            if (bounds && bounds.isValid()) {
              setMapBounds(bounds);
              boundsInitialized.current = true;
            }
          } catch (e) {
            // Map might not be fully initialized yet
          }
        };
        // Update bounds after map is ready, only once
        map.whenReady(updateBounds);
      }
    }, [map]);

    useMapEvents({
      mousedown: (e) => {
        if (e.originalEvent.button === 0) { // Left click
          setIsSelecting(true);
          const latlng = map.mouseEventToLatLng(e.originalEvent);
          setSelectionBox({ start: latlng, end: null });
        }
      },
      mousemove: (e) => {
        if (isSelecting && selectionBox.start) {
          const latlng = map.mouseEventToLatLng(e.originalEvent);
          setSelectionBox(prev => ({ ...prev, end: latlng }));
        }
      },
      mouseup: () => {
        if (isSelecting && selectionBox.start && selectionBox.end) {
          handleBoxSelection(selectionBox.start, selectionBox.end);
        }
        setIsSelecting(false);
        setSelectionBox({ start: null, end: null });
      }
    });

    return null;
  }

  // Component to update map bounds to fit all orders
  function MapBoundsUpdater() {
    const map = useMap();

    useEffect(() => {
      if (map && ordersBounds && ordersBounds.isValid()) {
        // Ajustar bounds cuando cambien las órdenes filtradas
        setTimeout(() => {
          map.fitBounds(ordersBounds, { 
            padding: [50, 50],
            maxZoom: 15
          });
        }, 100);
      }
    }, [map, ordersBounds]);

    return null;
  }

  function handleBoxSelection(start: any, end: any) {
    if (!mapRef.current || !mapBounds) return;

    const minLat = Math.min(start.lat, end.lat);
    const maxLat = Math.max(start.lat, end.lat);
    const minLng = Math.min(start.lng, end.lng);
    const maxLng = Math.max(start.lng, end.lng);

    const boxBounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
    
    const ordersInBox = fullOrders.filter((order: any) => {
      if (!order.finalDestiny || !order.finalDestiny.latitude || !order.finalDestiny.longitude) return false;
      const orderLat = order.finalDestiny.latitude;
      const orderLng = order.finalDestiny.longitude;
      return boxBounds.contains([orderLat, orderLng]);
    });

    const newSelection = new Map(selectedMarkers);
    ordersInBox.forEach((order: any) => {
      newSelection.set(order.id, true);
    });
    setSelectedMarkers(newSelection);
  }

  function handleMarkerClick(orderId: number, e: any) {
    e.originalEvent.stopPropagation();
    const newSelection = new Map(selectedMarkers);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.set(orderId, true);
    }
    setSelectedMarkers(newSelection);
  }

  function handleCheckboxChange(orderId: number, checked: boolean) {
    const newSelection = new Map(selectedMarkers);
    if (checked) {
      newSelection.set(orderId, true);
    } else {
      newSelection.delete(orderId);
    }
    setSelectedMarkers(newSelection);
  }

  // Calcular el total de seleccionados
  const selectedCount = Array.from(selectedMarkers.values()).filter(v => v).length;
  const selectedOrderIds = Array.from(selectedMarkers.entries())
    .filter(([_, selected]) => selected)
    .map(([id, _]) => id);

  // Obtener las zonas y timezone únicos de las órdenes
  const availableZones = Array.from(new Set((orders || []).map((o: any) => o.zone).filter(Boolean)));
  const availableTimezones = Array.from(new Set((orders || []).map((o: any) => o.timezone).filter(Boolean)));

  // fullOrders ya viene filtrado por filteredOrderIds basado en zona y timezone
  const filtered = fullOrders;

  function handleSelectAll(checked: boolean) {
    const newSelection = new Map(selectedMarkers);
    if (checked) {
      filtered.forEach((order: any) => {
        newSelection.set(order.id, true);
      });
    } else {
      filtered.forEach((order: any) => {
        newSelection.delete(order.id);
      });
    }
    setSelectedMarkers(newSelection);
  }

  // Calcular bounds basado en órdenes filtradas con coordenadas válidas
  const ordersBounds = React.useMemo(() => {
    const ordersWithCoords = filtered.filter((order: any) => {
      return order.finalDestiny && 
             typeof order.finalDestiny.latitude === 'number' && 
             typeof order.finalDestiny.longitude === 'number' &&
             !isNaN(order.finalDestiny.latitude) &&
             !isNaN(order.finalDestiny.longitude);
    });

    if (ordersWithCoords.length === 0) return null;

    const locations: [number, number][] = ordersWithCoords.map((order: any) => [
      order.finalDestiny.latitude,
      order.finalDestiny.longitude
    ]);

    return L.latLngBounds(locations);
  }, [filtered]);
  const handleAssignRoute = () => {
    if (selectedOrderIds.length === 0) {
      alert('Debe seleccionar al menos un pedido');
      return;
    }
    
    if (!selectedZone || !selectedTimezone) {
      alert('Debe seleccionar una zona y zona horaria');
      return;
    }

    setIsAssignRouteOpen(true);
  };

  if (loading || isLoadingOrders) return <div className="text-gray-500">Cargando...</div>;

  const formatMoney = (n: any) => `$${Number(n).toLocaleString("es-AR")}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-500">Pedidos por asignar ruta</h2>
        {selectedZone && selectedTimezone && (
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            {viewMode === 'map' ? 'Ver lista' : 'Ver mapa'}
          </button>
        )}
      </div>
      {/* Tabs de zonas */}
      <div className="flex gap-6 mb-4 border-b">
        {zones.map((zone: any) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.name)}
            className={`px-4 py-2 font-semibold ${
              selectedZone === zone.name
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {/* Tabs de timezones */}
      {selectedZone && (
        <div className="flex gap-6 mb-4 border-b">
          {timezones.map((timezone: any) => (
            <button
              key={timezone.id}
              onClick={() => setSelectedTimezone(timezone.name)}
              className={`px-4 py-2 font-semibold ${
                selectedTimezone === timezone.name
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {timezone.name}
            </button>
          ))}
        </div>
      )}

      {/* Info y botones */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            {filtered.length} pedidos en {selectedZone || 'todas las zonas'} {selectedTimezone && `- ${selectedTimezone}`}
          </p>
          {selectedCount > 0 && (
            <p className="text-purple-600 font-semibold">
              {selectedCount} pedido(s) seleccionado(s)
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMarkers(new Map())}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={selectedCount === 0}
          >
            Deseleccionar todos
          </button>
          <button
            onClick={handleAssignRoute}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            disabled={selectedCount === 0}
          >
            Asignar a ruta ({selectedCount})
          </button>
          <button
            onClick={() => setIsCreateRouteOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Crear nueva ruta
          </button>
        </div>
      </div>

      {/* Mapa o Lista */}
      {selectedZone && selectedTimezone && filtered.length > 0 && (
        <>
          {viewMode === 'map' ? (
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <MapContainer
                center={[-34.6037, -58.3816]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapEventHandler />
                <MapBoundsUpdater />
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
              {(() => {
                const ordersWithCoords = filtered.filter((order: any) => {
                  return order.finalDestiny && 
                         typeof order.finalDestiny.latitude === 'number' && 
                         typeof order.finalDestiny.longitude === 'number' &&
                         !isNaN(order.finalDestiny.latitude) &&
                         !isNaN(order.finalDestiny.longitude);
                });
                return ordersWithCoords.map((order: any) => {
                  const isSelected = selectedMarkers.get(order.id) || false;
                  return (
                  <Marker
                    key={order.id}
                    position={[order.finalDestiny.latitude, order.finalDestiny.longitude]}
                    icon={isSelected ? purpleIcon : blueIcon}
                    eventHandlers={{
                        click: (e) => handleMarkerClick(order.id, e)
                    }}
                  >
                    {isSelected && (
                      <Tooltip 
                        permanent={true}
                        direction="top"
                        offset={[0, -40]}
                        opacity={.7}
                        className="!bg-white !border !border-gray-200 !shadow-lg !rounded-lg !px-4 !py-3 !text-sm !min-w-[50px] !max-w-[150px] !whitespace-normal !pointer-events-none !select-none"
                        position={[order.finalDestiny.latitude, order.finalDestiny.longitude]}
                        interactive={false}
                        sticky={false}
                      >
                        <div className="text-center pointer-events-none select-none">
                          <b className="text-purple-600 text-base">#{order.TN_Order_number == 0 ? order.id : order.TN_Order_number}</b>
                    </div>
                      </Tooltip>
                    )}
                  </Marker>
                  );
                });
              })()}
            </MapContainer>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="py-3 px-4 font-semibold w-12">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && filtered.every((order: any) => selectedMarkers.get(order.id) || false)}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      </th>
                      <th className="py-3 px-4 font-semibold">Nº Orden</th>
                      <th className="py-3 px-4 font-semibold">Método de pago</th>
                      <th className="py-3 px-4 font-semibold">Tipo de entrega</th>
                      <th className="py-3 px-4 font-semibold">Zona</th>
                      <th className="py-3 px-4 font-semibold">Zona horaria</th>
                      <th className="py-3 px-4 font-semibold">Total</th>
                      <th className="py-3 px-4 font-semibold">Dirección</th>
                      <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((order: any) => {
                      const isSelected = selectedMarkers.get(order.id) || false;
                      return (
                      <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-purple-50' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(order.id, e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          #{order.TN_Order_number || order.id}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getFormattedPaymentType(order.paymentType || order.TNOrder?.gateway_name || '')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getFormattedDeliveryType(order.shipmentType || order.TNOrder?.gateway || '')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {typeof order.zone === 'object' ? order.zone?.name : order.zone || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {(() => {
                            const tz = order.timezone || order.timeZone;
                            if (!tz) return '-';
                            if (typeof tz === 'object') return tz?.name || '-';
                            return tz;
                          })()}
                        </td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">
                          {formatMoney(order.totalToPay || order.TNOrder?.total || 0)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                          {order.finalDestiny?.address || order.finalDestiny?.name || order.default_address?.address || order.TNOrder?.default_address?.address || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              // Usar el ID de Tienda Nube (TN_ID o TNOrder.id) que es lo que espera el endpoint /orders/find-by-id/
                              const orderNumber = order.TN_ID || order.TNOrder?.id || order.TN_Order_number || order.id;
                              setSelectedOrderNumber(orderNumber);
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedZone && (
        <div className="text-center py-8 text-gray-500">
          Selecciona una zona para ver los pedidos en el mapa
        </div>
      )}

      {selectedZone && !selectedTimezone && (
        <div className="text-center py-8 text-gray-500">
          Selecciona una zona horaria para ver los pedidos en el mapa
        </div>
      )}

      {selectedZone && selectedTimezone && filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay pedidos para la zona y zona horaria seleccionadas
        </div>
      )}

      {isAssignRouteOpen && (
        <AssignRouteDialog
          isOpen={isAssignRouteOpen}
          onClose={() => setIsAssignRouteOpen(false)}
          onOpenCreateRoute={() => {
            setIsAssignRouteOpen(false);
            setIsCreateRouteOpen(true);
          }}
          selectedOrders={selectedOrderIds}
          zone={selectedZone || ''}
          timezone={selectedTimezone || ''}
          zoneId={zones.find((z: any) => z.name === selectedZone)?.id || 0}
          timezoneId={timezones.find((tz: any) => tz.name === selectedTimezone)?.id || 0}
          onRouteAssigned={async () => {
            await refreshOrders();
            setSelectedMarkers(new Map());
          }}
        />
      )}

      {isCreateRouteOpen && (
        <CreateRouteDialog
          open={isCreateRouteOpen}
          onClose={() => setIsCreateRouteOpen(false)}
          onRouteCreated={() => {
            setIsCreateRouteOpen(false);
          }}
        />
      )}

      {selectedOrderNumber && (
        <OrderDetailDialog
          o_TN_Order_number={selectedOrderNumber}
          onClose={() => setSelectedOrderNumber(null)}
          readOnly={true}
        />
      )}
    </div>
  );
}


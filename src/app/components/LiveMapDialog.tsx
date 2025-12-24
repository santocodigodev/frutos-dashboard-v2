"use client";
import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from 'leaflet';
import purpleMarkerIcon from '../icons/marker-purple.svg';
import blueMarkerIcon from '../icons/marker-blue.svg';
import greenMarkerIcon from '../icons/marker-green.svg';
import markerShadow from '../icons/marker-shadow.svg';
import io from 'socket.io-client';
import { getApiUrl, getSocketConfig } from '../utils/api';

interface LiveMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  route: any;
}

// Iconos personalizados
const purpleIcon = new L.Icon({
  iconUrl: purpleMarkerIcon.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow.src,
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: blueMarkerIcon.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: markerShadow.src,
  shadowSize: [41, 41],
});

// Icono personalizado para el conductor (pin de delivery)
const driverIcon = new L.Icon({
  iconUrl: '/assets/pin_delivery.png',
  iconSize: [25, 35],
  iconAnchor: [12, 35],
  popupAnchor: [0, -35],
});

// Función para crear icono con número de orden
const createOrderIcon = (orderNumber: number, isDelivered: boolean): L.DivIcon => {
  const bgColor = isDelivered ? '#15803d' : '#9333ea'; // Verde (más oscuro) o morado
  
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <img src="${isDelivered ? greenMarkerIcon.src : purpleMarkerIcon.src}" 
             style="width: 25px; height: 41px;" />
        <div style="
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: ${bgColor};
          border: 1px solid ${bgColor};
        ">
          ${orderNumber}
        </div>
      </div>
    `,
    className: 'custom-order-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

export default function LiveMapDialog({ isOpen, onClose, route }: LiveMapDialogProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [fullOrders, setFullOrders] = useState<any[]>([]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number, isOnline: boolean} | null>(null);
  const [hasInitialFit, setHasInitialFit] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const mapRef = useRef<L.Map | null>(null);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  // Resetear estado cuando se cierra el popup
  useEffect(() => {
    if (!isOpen) {
      setHasInitialFit(false);
      setDriverLocation(null);
      setFullOrders([]);
    }
  }, [isOpen]);

  // Cargar datos reales de los pedidos
  useEffect(() => {
    if (isOpen && route?.orders) {
      const fetchOrderDetails = async () => {
        try {
          const orderIds = route.orders.map((order: any) => order.id);
          
          if (orderIds.length > 0) {
            const response = await fetch(getApiUrl('/orders/get-by-ids'), {
              method: 'POST',
              headers: {
                'accept': 'application/json',
                'token': user.token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ids: orderIds })
            });
            const data = await response.json();
            setFullOrders(data);
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
          setFullOrders([]);
        }
      };

      fetchOrderDetails();
    }
  }, [isOpen, route, user.token]);

  // Establecer ubicación inicial del conductor INMEDIATAMENTE desde route
  useEffect(() => {
    if (isOpen && route?.delivery?.id && route?.delivery?.latitude && route?.delivery?.longitude && 
        route.delivery.latitude !== '0' && route.delivery.longitude !== '0' &&
        route.delivery.latitude !== 0 && route.delivery.longitude !== 0) {
      setDriverLocation({
        lat: parseFloat(route.delivery.latitude),
        lng: parseFloat(route.delivery.longitude),
        isOnline: true
      });
    }
  }, [isOpen, route?.delivery]);

  // Conectar al WebSocket para escuchar ubicación del conductor
  useEffect(() => {
    if (isOpen && route?.delivery?.id) {
      const driverId = route.delivery.id;
      
      // Conectar al WebSocket
      const socketConfig = getSocketConfig();
      const newSocket = io(`${socketConfig.url}/admin-location`, {
        path: socketConfig.path,
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        newSocket.emit('subscribe-to-admin', { adminId: driverId });
      });

      newSocket.on('subscribed-to-admin', (data: any) => {
        // Subscribed
      });

      newSocket.on('unsubscribed-from-admin', (data: any) => {
        // Unsubscribed
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('WebSocket Connection Error:', error);
      });

      newSocket.on('admin-location-update', (data: any) => {
        if (data.adminId === driverId) {
          setDriverLocation({
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            isOnline: data.isOnline || true
          });
        }
      });

      newSocket.on('admin-location-changed', (data: any) => {
        if (data.adminId === driverId) {
          setDriverLocation({
            lat: parseFloat(data.latitude),
            lng: parseFloat(data.longitude),
            isOnline: data.isOnline || true
          });
        }
      });

      newSocket.on('admin-location-status-changed', (data: any) => {
        if (data.adminId === driverId) {
          setDriverLocation(prev => prev ? { ...prev, isOnline: data.isOnline } : null);
        }
      });

      newSocket.on('disconnect', () => {
        // Disconnected
      });

      newSocket.on('error', (data: any) => {
        console.error('WebSocket Error:', data.message);
      });

      setSocket(newSocket);

      // Cleanup al cerrar
      return () => {
        if (newSocket) {
          newSocket.emit('unsubscribe-from-admin', { adminId: driverId });
          newSocket.disconnect();
        }
      };
    }
  }, [isOpen, route?.delivery?.id]);

  // Calcular bounds del mapa incluyendo conductor y todos los pedidos
  useEffect(() => {
    const validOrders = fullOrders.filter(
      (order: any) =>
        order.finalDestiny &&
        typeof order.finalDestiny.latitude === "number" &&
        typeof order.finalDestiny.longitude === "number"
    );

    // Construir array con todas las ubicaciones (pedidos + conductor)
    const allLocations: [number, number][] = validOrders.map((order: any) => [
      order.finalDestiny.latitude as number, 
      order.finalDestiny.longitude as number
    ]);
    
    // Incluir conductor si existe
    if (driverLocation) {
      allLocations.push([driverLocation.lat, driverLocation.lng]);
    }

    if (allLocations.length > 0) {
      const bounds = L.latLngBounds(allLocations);
      setMapBounds(bounds);
    } else {
      setMapBounds(null);
    }
  }, [fullOrders, driverLocation]);

  // Componente para ajustar bounds del mapa
  function MapBoundsUpdater() {
    const map = useMap();
    
    useEffect(() => {
      // Solo ajustar si tenemos bounds, no se ha hecho el ajuste inicial, y tenemos pedidos cargados
      if (mapBounds && !hasInitialFit && mapBounds.getNorthEast() && fullOrders.length > 0 && driverLocation) {
        // Ajustar bounds solo la primera vez incluyendo conductor y pedidos
        setTimeout(() => {
          map.fitBounds(mapBounds, { 
            padding: [30, 30],
            maxZoom: 15
          });
          setHasInitialFit(true);
        }, 100);
      }
    }, [mapBounds, map, hasInitialFit, fullOrders.length, driverLocation]);

    return null;
  }

  // Filtrar pedidos válidos
  const validOrders = fullOrders.filter(
    (order: any) =>
      order.finalDestiny &&
      typeof order.finalDestiny.latitude === "number" &&
      typeof order.finalDestiny.longitude === "number"
  );

  // Obtener orden de las órdenes desde routeOrder o usar el orden por defecto
  const getOrderedOrders = () => {
    if (!route?.routeOrder) {
      // Si no hay routeOrder, usar el orden por defecto
      return validOrders.map((order, index) => ({ ...order, displayOrder: index + 1 }));
    }

    // Parsear routeOrder y crear mapa de orden
    const orderIds = route.routeOrder.split(',').map((id: string) => parseInt(id.trim()));
    const orderMap = new Map(orderIds.map((id: number, index: number) => [id, index + 1]));

    // Ordenar pedidos según routeOrder
    const sortedOrders = [...validOrders].sort((a, b) => {
      const orderA = orderMap.get(a.id) || 9999; // Pedidos no en routeOrder van al final
      const orderB = orderMap.get(b.id) || 9999;
      return (orderA as number) - (orderB as number);
    });

    // Asignar números consecutivos empezando desde 1
    return sortedOrders.map((order, index) => ({
      ...order,
      displayOrder: index + 1
    }));
  };

  const orderedOrders = getOrderedOrders();

  // Contar pedidos por estado
  const deliveredOrders = orderedOrders.filter((order: any) => 
    order.localStatus === 'finished' || order.localStatus === 'delivered'
  );
  const pendingOrders = orderedOrders.filter((order: any) => 
    order.localStatus !== 'finished' && order.localStatus !== 'delivered'
  );

  // Calcular centro dinámico del mapa
  const getMapCenter = (): [number, number] => {
    if (validOrders.length === 0) {
      return [10.4806, -66.9036]; // Caracas por defecto
    }
    
    const avgLat = validOrders.reduce((sum, order) => sum + order.finalDestiny.latitude, 0) / validOrders.length;
    const avgLng = validOrders.reduce((sum, order) => sum + order.finalDestiny.longitude, 0) / validOrders.length;
    
    return [avgLat, avgLng];
  };

  const mapCenter = getMapCenter();
  const defaultZoom = validOrders.length > 1 ? 12 : 15;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-[200]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <HeadlessDialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    Vista en vivo - Ruta #{route?.id?.toString().padStart(6, '0')}
                  </HeadlessDialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                {/* Mapa real con Leaflet */}
                <div className="bg-gray-100 rounded-lg h-96 mb-6 relative overflow-hidden">
                  <MapContainer
                    center={mapCenter}
                    zoom={defaultZoom}
                    style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
                    scrollWheelZoom={true}
                    ref={mapRef}
                    key={`map-${isOpen}-${mapCenter[0]}-${mapCenter[1]}-${orderedOrders.length}`}
                  >
                    <MapBoundsUpdater />
                    <TileLayer
                      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Marcadores de pedidos */}
                    {orderedOrders.map((order: any) => {
                      const isDelivered = order.localStatus === 'finished' || order.localStatus === 'delivered';
                      return (
                        <Marker
                          key={order.id}
                          position={[order.finalDestiny.latitude, order.finalDestiny.longitude]}
                          icon={createOrderIcon(order.displayOrder, isDelivered)}
                        >
                          <Popup>
                            <div className="text-sm">
                              <div className="font-semibold text-gray-900">
                                Orden #{order.TN_Order_number || order.id}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {order.finalDestiny?.address || 
                                 order.finalDestiny?.street || 
                                 order.finalDestiny?.fullAddress || 
                                 order.finalDestiny?.description ||
                                 order.finalDestiny?.name ||
                                 'Sin dirección'}
                              </div>
                              {order.finalDestiny && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Lat: {order.finalDestiny.latitude?.toFixed(4)}, 
                                  Lng: {order.finalDestiny.longitude?.toFixed(4)}
                                </div>
                              )}
          <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                                isDelivered 
                              ? 'bg-green-200 text-green-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {isDelivered ? 'Entregada' : 'Pendiente'}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Marcador del conductor */}
                    {driverLocation && (
                      <Marker
                        key="driver"
                        position={[driverLocation.lat, driverLocation.lng]}
                        icon={driverIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              Conductor: {route?.delivery?.name || 'Sin nombre'}
                            </div>
                            <div className="text-gray-600 mt-1">
                              Estado: {driverLocation.isOnline ? '🟢 En línea' : '🔴 Desconectado'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Lat: {driverLocation.lat.toFixed(4)}, 
                              Lng: {driverLocation.lng.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Actualizado: {new Date().toLocaleTimeString()}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                  
                  {orderedOrders.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg bg-white/80 z-10">
                      No hay pedidos con ubicación válida en esta ruta.
                    </div>
                  )}
                </div>

                {/* Leyenda */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Leyenda</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <img src={purpleMarkerIcon.src} alt="Pendiente" className="h-6 w-4" />
                      <span className="text-sm text-gray-700">Pedidos pendientes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={greenMarkerIcon.src} alt="Entregada" className="h-6 w-4" />
                      <span className="text-sm text-gray-700">Pedidos entregados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src="/assets/pin_delivery.png" alt="Conductor" className="h-9 w-6" />
                      <span className="text-sm text-gray-700">Conductor</span>
                    </div>
                  </div>
                </div>

                {/* Información de la ruta */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Total pedidos</div>
                    <div className="text-lg font-semibold text-gray-900">{orderedOrders.length}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Entregadas</div>
                    <div className="text-lg font-semibold text-green-600">
                      {deliveredOrders.length}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Pendientes</div>
                    <div className="text-lg font-semibold text-purple-600">
                      {pendingOrders.length}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Conductor</div>
                    <div className="text-lg font-semibold text-red-600">
                      {driverLocation ? (driverLocation.isOnline ? '🟢 En línea' : '🔴 Desconectado') : '❓ Sin datos'}
                    </div>
                  </div>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import CreateRouteDialog from './CreateRouteDialog';
import { usePedidos } from '../(protected)/pedidos/PedidosContext';
import { useRutas } from '../(protected)/rutas/RutasContext';
import { useSidebarRutas } from '../(protected)/rutas/SidebarContext';
import { getApiUrl } from '../utils/api';

interface AssignRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateRoute: () => void;
  selectedOrders: number[];
  zone: string;
  timezone: string;
  zoneId: number;
  timezoneId: number;
  totalKg?: number;
  onRouteAssigned?: () => void;
}

export default function AssignRouteDialog({ 
  isOpen, 
  onClose, 
  onOpenCreateRoute,
  selectedOrders, 
  zone, 
  timezone,
  zoneId,
  timezoneId,
  totalKg = 0,
  onRouteAssigned
}: AssignRouteDialogProps) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [isCreateRouteOpen, setIsCreateRouteOpen] = useState(false);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const router = useRouter();
  const { refreshOrders } = usePedidos();
  const { refreshRutas } = useRutas();
  const { refreshCounts } = useSidebarRutas();
  console.log(selectedOrders);
  console.log(zoneId);
  console.log(timezoneId);

  const fetchRoutes = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/route/get-by-timezone-and-zone?zoneName=${zone}&timeZoneName=${timezone}`),
        {
          headers: {
            'accept': 'application/json',
            'token': user.token
          }
        }
      );
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoutes();
    }
  }, [isOpen, zoneId, timezoneId]);

  const handleAssignRoute = async () => {
    if (!selectedRoute) return;

    try {
      const response = await fetch(getApiUrl(`/route/${selectedRoute}`), {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'token': user.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orders: selectedOrders
        })
      });

      if (response.ok) {
        // Wait for backend response before refreshing
        const result = await response.json();
        if (result) {
          await Promise.all([
            refreshOrders(),
            refreshRutas(),
            refreshCounts()
          ]);
          router.refresh();
          if (onRouteAssigned) {
            onRouteAssigned();
          }
        }
        onClose();
      } else {
        console.error('Error assigning route:', response.statusText);
      }
    } catch (error) {
      console.error('Error assigning route:', error);
    }
  };

  const handleRouteCreated = () => {
    fetchRoutes(); // Actualizar la lista de rutas cuando se crea una nueva
    setIsCreateRouteOpen(false); // Cerrar el diálogo de crear ruta
    onClose(); // Cerrar el diálogo de asignar ruta
  };

  const handleCreateRouteClose = () => {
    console.log('Cerrando diálogo de crear ruta');
    setIsCreateRouteOpen(false);
  };

  const handleCreateRouteOpen = () => {
    console.log('Abriendo diálogo de crear ruta');
    setIsCreateRouteOpen(true);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose} 
        className="relative z-[1000]"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="mx-auto w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-lg flex flex-col">
            <div className="p-6 flex-shrink-0">
              <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
                Asignar pedidos a ruta
              </Dialog.Title>
              
              <div className="mb-6">
                <p className="text-gray-600">Zona: <span className="font-semibold">{zone}</span></p>
                <p className="text-gray-600">Zona horaria: <span className="font-semibold">{timezone}</span></p>
                <p className="text-gray-600">Pedidos seleccionados: <span className="font-semibold">{selectedOrders.length}</span></p>
                {totalKg > 0 && (
                  <p className="text-gray-600">Peso total: <span className="font-semibold">{totalKg.toFixed(2)} kg</span></p>
                )}
              </div>

              <div className="mb-6">
                <button
                  onClick={onOpenCreateRoute}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Crear nueva ruta
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando rutas...</div>
              ) : (
                <div className="space-y-4">
                  {routes.map((route) => (
                    <div
                      key={route.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoute === route.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-400'
                      }`}
                      onClick={() => setSelectedRoute(route.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">Ruta #{route.id}</h3>
                          <p className="text-sm text-gray-500">
                            {route.observations || 'Sin observaciones'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {route.orders ? 
                              (route.orders.length === 0 ? 
                                'Sin orden asignada' : 
                                route.orders.length === 1 ? 
                                  '1 orden asignada' : 
                                  `${route.orders.length} órdenes asignadas`
                              ) : 
                              'Sin ordenes asignadas'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(route.scheduledDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {route.delivery?.name || 'Sin repartidor asignado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-4 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignRoute}
                disabled={!selectedRoute}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
              >
                Asignar a ruta
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {isCreateRouteOpen && (
        <CreateRouteDialog
          open={isCreateRouteOpen}
          onClose={handleCreateRouteClose}
          onRouteCreated={handleRouteCreated}
        />
      )}
    </>
  );
} 
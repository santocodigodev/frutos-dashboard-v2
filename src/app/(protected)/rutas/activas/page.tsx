"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { useRutas } from "../RutasContext";
import RouteTable from "../../../components/RouteTable";
import CreateRouteDialog from "../../../components/CreateRouteDialog";
import RouteDetailDialog from "../../../components/RouteDetailDialog";
import OrderDetailDialog from "../../../components/OrderDetailDialog";
import { useState } from 'react';
import { useSidebarRutas } from '../SidebarContext';
import { getApiUrl } from "../../../utils/api";

export default function RutasActivas() {
  useUserOrRedirect();
  const { rutas, loading, refreshRutas } = useRutas();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const { refreshCounts } = useSidebarRutas();

  const rutasActivas = rutas.filter(r => r.localStatus === "active");

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  const handleRouteCreated = () => {
    refreshRutas(); // Refresh the list of routes after creation
    refreshCounts(); // Refresh sidebar counts
  };

  const handleRouteClick = async (route: any) => {
    setLoadingRoute(true);
    setIsDetailDialogOpen(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/${route.id}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (response.ok) {
        const routeData = await response.json();
        setSelectedRoute(routeData);
      } else {
        console.error('Error fetching route details');
        setIsDetailDialogOpen(false);
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      setIsDetailDialogOpen(false);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedRoute(null);
  };

  const handleRouteUpdated = () => {
    refreshRutas();
    refreshCounts();
  };

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-500">Rutas activas</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg" onClick={handleOpenDialog}>Nueva Ruta</button>
      </div>
       <p className="text-gray-600 mb-6">Ver y editar rutas activas</p>

      {rutasActivas.length === 0 ? (
        <div className="text-gray-500">No hay rutas activas.</div>
      ) : (
        <RouteTable routes={rutasActivas} onRouteClick={handleRouteClick} />
      )}

       <CreateRouteDialog 
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onRouteCreated={handleRouteCreated}
      />

      {isDetailDialogOpen && selectedRoute && (
        <RouteDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          route={selectedRoute}
          onRouteUpdated={handleRouteUpdated}
          onShowOrderDetail={(orderNumber) => setSelectedOrderNumber(orderNumber)}
          isActive={selectedRoute.localStatus === "active"}
          canRemoveOrders={selectedRoute.localStatus === "created"}
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
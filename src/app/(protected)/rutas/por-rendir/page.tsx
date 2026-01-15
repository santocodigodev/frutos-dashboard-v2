"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { useState, useEffect } from "react";
import RouteTable from "../../../components/RouteTable";
import RouteDetailDialog from "../../../components/RouteDetailDialog";
import OrderDetailDialog from "../../../components/OrderDetailDialog";
import { getApiUrl } from "../../../utils/api";

export default function RutasPorRendir() {
  useUserOrRedirect();
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);

  const fetchRutasPorRendir = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/by-status?status=closed&page=${page}&limit=${limit}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRutas(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (error) {
      console.error('Error fetching routes to render:', error);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutasPorRendir();
  }, [page]);

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

  const handleRouteUpdated = async () => {
    fetchRutasPorRendir();
    // Refresh the selected route data
    if (selectedRoute?.id) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await fetch(getApiUrl(`/route/${selectedRoute.id}`), {
          headers: {
            'accept': 'application/json',
            'token': user.token
          }
        });
        if (response.ok) {
          const routeData = await response.json();
          setSelectedRoute(routeData);
        }
      } catch (error) {
        console.error('Error refreshing route data:', error);
      }
    }
  };

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-500">Rutas por rendir</h2>
      </div>
      <p className="text-gray-600 mb-6">Rutas cerradas pendientes de rendición</p>

      {rutas.length === 0 ? (
        <div className="text-gray-500">No hay rutas por rendir.</div>
      ) : (
        <>
          <RouteTable routes={rutas} onRouteClick={handleRouteClick} />
          
          {/* Paginación */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {isDetailDialogOpen && selectedRoute && (
        <RouteDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          route={selectedRoute}
          onRouteUpdated={handleRouteUpdated}
          onShowOrderDetail={(orderNumber) => setSelectedOrderNumber(orderNumber)}
          isActive={selectedRoute.localStatus === "closed"}
          canRemoveOrders={false}
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

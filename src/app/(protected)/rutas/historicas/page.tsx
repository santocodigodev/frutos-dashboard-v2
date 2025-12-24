"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { useState, useEffect } from "react";
import CreateRouteDialog from "../../../components/CreateRouteDialog";
import { getApiUrl } from "../../../utils/api";

export default function RutasHistoricas() {
  useUserOrRedirect();
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);
  const handleRouteCreated = () => {
    // No need to refresh the list of historical routes after creating a new one
    // as historical routes are closed routes.
    console.log('New route created, historical list does not need refresh.');
  };

  const fetchRutasHistoricas = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/closed?page=${page}&limit=${limit}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      const data = await response.json();
      setRutas(data.routes || []);
      setTotalPages(Math.ceil(data.total / limit));
    } catch (error) {
      console.error('Error fetching historical routes:', error);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutasHistoricas();
  }, [page]);

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-500">Rutas históricas</h2>
         <button className="bg-purple-600 text-white px-4 py-2 rounded-lg" onClick={handleOpenDialog}>Nueva Ruta</button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-2xl font-bold text-purple-600 mb-4">
          {rutas.length} rutas en esta página
        </div>
        
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

        {/* Aquí irá el contenido de la página */}
      </div>

      <CreateRouteDialog 
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onRouteCreated={handleRouteCreated}
      />
    </div>
  );
} 
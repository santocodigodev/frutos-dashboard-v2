"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';

interface SidebarRutasContextType {
  rutasCreadas: number;
  rutasActivas: number;
  rutasPorRendir: number;
  loading: boolean;
  refreshCounts: () => Promise<void>;
}

const SidebarRutasContext = createContext<SidebarRutasContextType>({
  rutasCreadas: 0,
  rutasActivas: 0,
  rutasPorRendir: 0,
  loading: true,
  refreshCounts: async () => {},
});

export function SidebarRutasProvider({ children }: { children: React.ReactNode }) {
  const [rutasCreadas, setRutasCreadas] = useState(0);
  const [rutasActivas, setRutasActivas] = useState(0);
  const [rutasPorRendir, setRutasPorRendir] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        console.error('No user token found');
        setRutasCreadas(0);
        setRutasActivas(0);
        setRutasPorRendir(0);
        setLoading(false);
        return;
      }

      // Fetch routes with status created and active
      const response = await fetch(getApiUrl('/route?filter=localStatus||$in||active,created'), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Route counts data:', data); // Debug log
      
      const routes = Array.isArray(data) ? data : (data.routes && Array.isArray(data.routes) ? data.routes : []);
      
      // Contar rutas por estado
      const creadas = routes.filter((r: any) => r.localStatus === "created").length;
      const activas = routes.filter((r: any) => r.localStatus === "active").length;
      
      setRutasCreadas(creadas);
      setRutasActivas(activas);

      // Fetch routes with status closed (por rendir)
      const responsePorRendir = await fetch(getApiUrl('/route?filter=localStatus||$eq||closed'), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });

      if (responsePorRendir.ok) {
        const dataPorRendir = await responsePorRendir.json();
        const routesPorRendir = Array.isArray(dataPorRendir) ? dataPorRendir : (dataPorRendir.routes && Array.isArray(dataPorRendir.routes) ? dataPorRendir.routes : []);
        setRutasPorRendir(routesPorRendir.length);
      } else {
        setRutasPorRendir(0);
      }
    } catch (error) {
      console.error('Error fetching route counts:', error);
      setRutasCreadas(0);
      setRutasActivas(0);
      setRutasPorRendir(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const refreshCounts = async () => {
    setLoading(true);
    await fetchCounts();
  };

  return (
    <SidebarRutasContext.Provider value={{ rutasCreadas, rutasActivas, rutasPorRendir, loading, refreshCounts }}>
      {children}
    </SidebarRutasContext.Provider>
  );
}

export const useSidebarRutas = () => useContext(SidebarRutasContext); 
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';

interface RutasContextType {
  rutas: any[];
  loading: boolean;
  refreshRutas: () => Promise<void>;
}

const RutasContext = createContext<RutasContextType>({
  rutas: [],
  loading: true,
  refreshRutas: async () => {},
});

export function RutasProvider({ children }: { children: React.ReactNode }) {
  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRutas = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        console.error('No user token found');
        setRutas([]);
        setLoading(false);
        return;
      }

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
      console.log('Rutas fetched:', data); // Debug log
      
      if (Array.isArray(data)) {
        setRutas(data);
      } else if (data.routes && Array.isArray(data.routes)) {
        setRutas(data.routes);
      } else {
        console.error('Unexpected data format:', data);
        setRutas([]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRutas();
  }, []);

  const refreshRutas = async () => {
    setLoading(true);
    await fetchRutas();
  };

  return (
    <RutasContext.Provider value={{ rutas, loading, refreshRutas }}>
      {children}
    </RutasContext.Provider>
  );
}

export const useRutas = () => useContext(RutasContext); 
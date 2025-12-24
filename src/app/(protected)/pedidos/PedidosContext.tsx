"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl } from '../../utils/api';

interface PedidosContextType {
  orders: any[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
}

const PedidosContext = createContext<PedidosContextType>({
  orders: [],
  loading: true,
  refreshOrders: async () => {},
});

export function PedidosProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl("/orders/find-by-states?states=created&states=data_completed&states=data_rejected&states=pending_route_assignment&states=pending_assembler_assignment&states=pending_assembly&states=pending_pick_up&states=pending_delivery_pick_up&states=in_route&states=returned&states=finished&states=canceled"));
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const refreshOrders = async () => {
    await fetchOrders();
  };

  return (
    <PedidosContext.Provider value={{ orders, loading, refreshOrders }}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos() {
  return useContext(PedidosContext);
} 
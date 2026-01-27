"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl } from '../../utils/api';

const ORDER_STATES = "states=created&states=data_completed&states=data_rejected&states=pending_route_assignment&states=pending_assembler_assignment&states=pending_assembly&states=pending_pick_up&states=pending_delivery_pick_up&states=in_route&states=returned&states=finished&states=canceled";

interface PedidosContextType {
  orders: any[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  setSort: (field: string, order: 'asc' | 'desc') => void;
}

const PedidosContext = createContext<PedidosContextType>({
  orders: [],
  loading: true,
  refreshOrders: async () => {},
  sortField: 'id',
  sortOrder: 'desc',
  setSort: () => {},
});

export function PedidosProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders/find-by-states?${ORDER_STATES}`;
      url += `&sortBy=${encodeURIComponent(sortField)}&sort=${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      const response = await fetch(getApiUrl(url));
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
  }, [sortField, sortOrder]);

  const refreshOrders = async () => {
    await fetchOrders();
  };

  const setSort = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  };

  return (
    <PedidosContext.Provider value={{ orders, loading, refreshOrders, sortField, sortOrder, setSort }}>
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos() {
  return useContext(PedidosContext);
} 
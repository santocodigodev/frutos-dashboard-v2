"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { usePedidos } from "../PedidosContext";
import OrdersTable from "../../../components/OrdersTable";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PedidosCompletados() {
  useUserOrRedirect();
  const { orders, loading } = usePedidos();
  const filtered = (orders || []).filter((o: unknown) => {
    const status = (o as any).o_localStatus ?? (o as any).localStatus; // eslint-disable-line @typescript-eslint/no-explicit-any
    return status === "data_completed";
  });

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return <OrdersTable orders={filtered as unknown as any} isMain={false} />; // eslint-disable-line @typescript-eslint/no-explicit-any
} 
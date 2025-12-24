"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { usePedidos } from "../PedidosContext";
import OrdersTable from "../../../components/OrdersTable";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PedidosRechazados() {
  useUserOrRedirect();
  const { orders, loading } = usePedidos();
  const filtered = (orders || []).filter((o: unknown) => (o as any).o_localStatus === "rejected"); // eslint-disable-line @typescript-eslint/no-explicit-any

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return <OrdersTable orders={filtered as unknown as any} isMain={false} />; // eslint-disable-line @typescript-eslint/no-explicit-any
} 
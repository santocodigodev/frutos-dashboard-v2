"use client";
import { useUserOrRedirect } from "../../../utils/auth";
import { usePedidos } from "../PedidosContext";
import OrdersTable from "../../../components/OrdersTable";
import AssignAssemblerDialog from "../../../components/AssignAssemblerDialog";
import { useState } from "react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PedidosPorAsignarArmador() {
  useUserOrRedirect();
  const { orders, loading } = usePedidos();
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isAssignAssemblerOpen, setIsAssignAssemblerOpen] = useState(false);

  const filtered = (orders || []).filter((o: unknown) => (o as any).o_localStatus === "pending_assembler_assignment"); // eslint-disable-line @typescript-eslint/no-explicit-any

  const handleAssignAssembler = (order: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setSelectedOrder(order);
    setIsAssignAssemblerOpen(true);
  };

  const handleCloseAssignAssembler = () => {
    setIsAssignAssemblerOpen(false);
    setSelectedOrder(null);
  };

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return (
    <>
      <OrdersTable
        orders={filtered as unknown as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        isMain={false}
      />
      {isAssignAssemblerOpen && selectedOrder && (
        <AssignAssemblerDialog
          order={selectedOrder} // eslint-disable-line @typescript-eslint/no-explicit-any
          onClose={handleCloseAssignAssembler}
        />
      )}
    </>
  );
} 
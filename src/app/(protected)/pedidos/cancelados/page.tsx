"use client";
import { useState, useEffect, useMemo } from "react";
import { useUserOrRedirect } from "../../../utils/auth";
import { usePedidos } from "../PedidosContext";
import OrdersTable from "../../../components/OrdersTable";
import Pagination from "../../../components/Pagination";

export default function PedidosCancelados() {
  useUserOrRedirect();
  const { orders, loading } = usePedidos();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOrders, setCurrentOrders] = useState([]);
  
  const allFiltered = useMemo(() => 
    (orders || []).filter((o: any) => o.o_localStatus === "canceled"), [orders]
  );
  const total = allFiltered.length;

  // Paginación del lado del cliente
  useEffect(() => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    const paginatedOrders = allFiltered.slice(startIndex, endIndex);
    setCurrentOrders(paginatedOrders);
  }, [allFiltered, currentPage]);

  if (loading) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-500">Pedidos cancelados</h2>
      <OrdersTable orders={currentOrders} isMain={false} readOnly={true} />
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / 10)}
          total={total}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
} 
"use client";
import { useUserOrRedirect } from "../utils/auth";
import StatsCard from "../components/StatsCard";
import SalesChart from "../components/SalesChart";
import OrdersTable from "../components/OrdersTable";
import { usePedidos } from "./pedidos/PedidosContext";
import { useEffect, useState } from "react";
import LoadingDialog from "../components/LoadingDialog";
import { getApiUrl } from "../utils/api";

interface Statistics {
  name: string;
  data: {
    total: number;
    lastMonth: number | null;
  };
}

export default function Dashboard() {
  const user = useUserOrRedirect();
  const { orders, loading: ordersLoading } = usePedidos();
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getApiUrl("/orders/get-statistics"))
      .then(res => res.json())
      .then(data => {
        setStatistics(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const confirmedSales = statistics.find(s => s.name === "confirmed_sales");
  const createdOrders = statistics.find(s => s.name === "created");
  const dataCompletedOrders = statistics.find(s => s.name === "data_completed");
  const finishedOrders = statistics.find(s => s.name === "finished");

  const lastMonthEarnings = confirmedSales?.data.lastMonth ?? 0;
  const newOrdersCount = createdOrders?.data.total ?? 0;
  const dataCompletedCount = dataCompletedOrders?.data.total ?? 0;
  const completedOrdersCount = finishedOrders?.data.total ?? 0;

  if (loading) {
    return <LoadingDialog text="Cargando estadísticas..." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-purple-700">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Nuevos pedidos" 
          value={newOrdersCount} 
          change={createdOrders?.data.lastMonth ? `${createdOrders.data.lastMonth >= 0 ? "+" : ""}${createdOrders.data.lastMonth}%` : undefined}
          color={createdOrders?.data.lastMonth && createdOrders.data.lastMonth >= 0 ? "green" : "red"} 
        />
        <StatsCard 
          title="Datos completados" 
          value={dataCompletedCount} 
          change={dataCompletedOrders?.data.lastMonth ? `${dataCompletedOrders.data.lastMonth >= 0 ? "+" : ""}${dataCompletedOrders.data.lastMonth}%` : undefined}
          color={dataCompletedOrders?.data.lastMonth && dataCompletedOrders.data.lastMonth >= 0 ? "green" : "red"} 
        />
        <StatsCard 
          title="Pedidos completados" 
          value={completedOrdersCount} 
          change={finishedOrders?.data.lastMonth ? `${finishedOrders.data.lastMonth >= 0 ? "+" : ""}${finishedOrders.data.lastMonth}%` : undefined}
          color={finishedOrders?.data.lastMonth && finishedOrders.data.lastMonth >= 0 ? "green" : "red"} 
        />
        <StatsCard 
          title="Ganancias del mes" 
          value={`$${Math.abs(lastMonthEarnings).toLocaleString()}`} 
          color={lastMonthEarnings >= 0 ? "green" : "red"} 
        />
      </div>
      <div className="mb-8">
        <SalesChart />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-500">Últimos pedidos</h2>
        <OrdersTable orders={orders.slice(0, 5)} isMain={true} />
      </div>
    </div>
  );
}

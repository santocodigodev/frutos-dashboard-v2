"use client";

import { useUserOrRedirect } from "../utils/auth";
import OrdersTable from "../components/OrdersTable";
import { usePedidos } from "./pedidos/PedidosContext";
import { useEffect, useState, useMemo } from "react";
import LoadingDialog from "../components/LoadingDialog";
import { getApiUrl } from "../utils/api";
import { FiChevronDown, FiBox, FiArrowRight } from "react-icons/fi";

type DateRangeKey = "today" | "week" | "month" | "custom";

interface DashboardStats {
  totals: { total: number; orders: number; difference: number };
  validPayments: { total: number; payments: number };
  pendingPayments: { total: number; orders: number };
  average: { total: number };
  orders: {
    created: number;
    pending_route_assignment: number;
    pending_assembler_assignment: number;
    pending_assembly: number;
    pending_delivery_pick_up: number;
    pending_pick_up: number;
    in_route: number;
    returned: number;
    finished: number;
    canceled: number;
    confirmed_sales: number;
  };
  monthlySales: number[];
  byPaymentMethod: { effective: number; transfer: number; pagoNube: number };
}

function getTodayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getDateRange(key: DateRangeKey, customFrom?: string, customTo?: string): { from: string; to: string } {
  const today = new Date();
  const to = getTodayISO();
  let from: string;

  if (key === "custom" && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  switch (key) {
    case "today":
      from = to;
      break;
    case "week": {
      const week = new Date(today);
      week.setDate(week.getDate() - 6);
      from = week.toISOString().slice(0, 10);
      break;
    }
    case "month": {
      const month = new Date(today);
      month.setMonth(month.getMonth() - 1);
      month.setDate(1);
      from = month.toISOString().slice(0, 10);
      break;
    }
    default:
      const month = new Date(today);
      month.setMonth(month.getMonth() - 1);
      from = month.toISOString().slice(0, 10);
  }
  return { from, to };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "decimal", maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const user = useUserOrRedirect();
  const { orders, loading: ordersLoading } = usePedidos();
  const [dateRangeKey, setDateRangeKey] = useState<DateRangeKey>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomPopup, setShowCustomPopup] = useState(false);
  const [customFromError, setCustomFromError] = useState("");
  const [customToError, setCustomToError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const { from, to } = useMemo(
    () => getDateRange(dateRangeKey, customFrom, customTo),
    [dateRangeKey, customFrom, customTo]
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.token : "";
    setStatsLoading(true);
    fetch(getApiUrl(`/dashboard/stats?from=${from}&to=${to}`), {
      headers: { accept: "application/json", token: token || "" },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [from, to]);

  const handleApplyCustomRange = () => {
    setCustomFromError("");
    setCustomToError("");
    if (!customFrom.trim()) {
      setCustomFromError("La fecha desde es requerida");
      return;
    }
    if (!customTo.trim()) {
      setCustomToError("La fecha hasta es requerida");
      return;
    }
    const fromDate = new Date(customFrom);
    const toDate = new Date(customTo);
    if (fromDate > toDate) {
      setCustomToError("La fecha hasta debe ser mayor o igual que la fecha desde");
      return;
    }
    setDateRangeKey("custom");
    setShowCustomPopup(false);
  };

  const pickUpCount = stats
    ? (stats.orders.pending_route_assignment ?? 0) +
      (stats.orders.pending_assembler_assignment ?? 0) +
      (stats.orders.pending_assembly ?? 0) +
      (stats.orders.pending_delivery_pick_up ?? 0) +
      (stats.orders.pending_pick_up ?? 0)
    : 0;

  // monthlySales[0]=actual, [1]=anterior, [2]=hace 2, [3]=hace 3. En gráfica: izquierda a derecha = [3],[2],[1],[0] (Nov, Dic, Ene, Feb)
  const monthLabels = useMemo(() => {
    const now = new Date();
    const names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return [3, 2, 1, 0].map((i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return names[d.getMonth()] + (i === 0 ? " " + d.getFullYear() : "");
    });
  }, []);

  const maxMonthly = Math.max(1, ...(stats?.monthlySales ?? [0]));

  const pieData = useMemo(() => {
    if (!stats?.byPaymentMethod) return [];
    const { effective = 0, transfer = 0, pagoNube = 0 } = stats.byPaymentMethod;
    const total = effective + transfer + pagoNube || 1;
    return [
      { name: "Efectivo", value: effective, percent: (effective / total) * 100 },
      { name: "Transferencia", value: transfer, percent: (transfer / total) * 100 },
      { name: "PagoNube", value: pagoNube, percent: (pagoNube / total) * 100 },
    ].filter((d) => d.value > 0);
  }, [stats?.byPaymentMethod]);


  if (statsLoading && !stats) {
    return <LoadingDialog text="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header + date filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-3xl">❄</span>
          Dashboard - Frutos Congelados
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {(["today", "week", "month"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setDateRangeKey(key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRangeKey === key
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {key === "today" ? "Hoy" : key === "week" ? "Esta Semana" : "Este Mes"}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowCustomPopup(!showCustomPopup)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition ${
                dateRangeKey === "custom" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Rango personalizado <FiChevronDown className="w-4 h-4" />
            </button>
            {showCustomPopup && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCustomPopup(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
                  <div className="text-sm font-medium text-gray-700 mb-2">Desde</div>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => {
                      setCustomFrom(e.target.value);
                      setCustomFromError("");
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  {customFromError && <p className="text-red-500 text-xs mt-1">{customFromError}</p>}
                  <div className="text-sm font-medium text-gray-700 mt-3 mb-2">Hasta</div>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => {
                      setCustomTo(e.target.value);
                      setCustomToError("");
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  {customToError && <p className="text-red-500 text-xs mt-1">{customToError}</p>}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowCustomPopup(false)}
                      className="flex-1 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleApplyCustomRange}
                      className="flex-1 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 cards: Ventas totales, Pagos validados, Pendiente por cobrar, Promedio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-500 rounded-xl p-5 text-white shadow">
          <div className="text-sm font-medium opacity-90">Ventas Totales</div>
          <div className="text-2xl font-bold mt-1">${formatCurrency(stats?.totals?.total ?? 0)}</div>
          <div className="text-sm opacity-90 mt-1">{(stats?.totals?.orders ?? 0)} Pedidos</div>
          {stats?.totals?.difference != null && stats.totals.difference !== 0 && (
            <div className="text-xs mt-2 flex items-center gap-1">
              <span className={stats.totals.difference >= 0 ? "text-green-200" : "text-red-200"}>
                {stats.totals.difference >= 0 ? "↑" : "↓"} {Math.abs(stats.totals.difference)}% vs periodo anter.
              </span>
            </div>
          )}
        </div>
        <div className="bg-green-500 rounded-xl p-5 text-white shadow">
          <div className="text-sm font-medium opacity-90">Pagos Validados</div>
          <div className="text-2xl font-bold mt-1">${formatCurrency(stats?.validPayments?.total ?? 0)}</div>
          <div className="text-sm opacity-90 mt-1">{(stats?.validPayments?.payments ?? 0)} Pagos Confirmados</div>
        </div>
        <div className="bg-amber-400 rounded-xl p-5 text-amber-900 shadow">
          <div className="text-sm font-medium opacity-90">Pendiente por Cobrar</div>
          <div className="text-2xl font-bold mt-1">${formatCurrency(stats?.pendingPayments?.total ?? 0)}</div>
          <div className="text-sm opacity-90 mt-1">{(stats?.pendingPayments?.orders ?? 0)} Pedidos Pendientes</div>
        </div>
        <div className="bg-blue-400 rounded-xl p-5 text-white shadow">
          <div className="text-sm font-medium opacity-90">Ticket Promedio</div>
          <div className="text-2xl font-bold mt-1">${formatCurrency(stats?.average?.total ?? 0)}</div>
          <div className="text-sm opacity-90 mt-1">Promedio por Pedido</div>
        </div>
      </div>

      {/* 4 cards: Pedidos nuevos, Pick up / En preparación, En camino, Finalizados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Pedidos Nuevos</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.orders?.created ?? 0}</div>
          <a href="/pedidos/nuevos" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Pick Up / En Preparación</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{pickUpCount}</div>
          <a href="/pedidos/por-asignar-ruta" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">En Camino</div>
          <div className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-1">
            <span className="text-gray-400">🚚</span> {stats?.orders?.in_route ?? 0}
          </div>
          <a href="/pedidos/en-camino" className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm text-gray-500">Finalizados</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.orders?.finished ?? 0}</div>
        </div>
      </div>

      {/* Charts row: Ventas mensuales (bar) + Ventas por método de pago (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas Mensuales</h3>
          <div className="flex items-end gap-4 h-64">
            {[3, 2, 1, 0].map((idx, i) => {
              const val = (stats?.monthlySales ?? [0, 0, 0, 0])[idx] ?? 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                  </span>
                  <div
                    className="w-full bg-green-500 rounded-t min-h-[8px] transition-all"
                    style={{ height: `${Math.max(8, (val / maxMonthly) * 200)}px` }}
                  />
                  <span className="text-xs text-gray-500">{monthLabels[i] ?? ""}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Método de Pago</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-48 h-48 flex-shrink-0">
              {pieData.length === 0 ? (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Sin datos
                </div>
              ) : (
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const colors = ["#22c55e", "#86efac", "#4f46e5"];
                    let acc = 0;
                    return (
                      <>
                        {pieData.map((d, i) => {
                          const start = acc;
                          const len = (d.percent / 100) * 360;
                          acc += len;
                          const x1 = 50 + 50 * Math.cos((start * Math.PI) / 180);
                          const y1 = 50 - 50 * Math.sin((start * Math.PI) / 180);
                          const x2 = 50 + 50 * Math.cos(((start + len) * Math.PI) / 180);
                          const y2 = 50 - 50 * Math.sin(((start + len) * Math.PI) / 180);
                          const big = len > 180 ? 1 : 0;
                          const dPath = `M 50 50 L ${x1} ${y1} A 50 50 0 ${big} 1 ${x2} ${y2} Z`;
                          return <path key={i} d={dPath} fill={colors[i % colors.length]} />;
                        })}
                        <circle cx="50" cy="50" r="35" fill="white" />
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-700">
                          {stats?.totals?.orders ?? 0}
                        </text>
                      </>
                    );
                  })()}
                </svg>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {pieData.map((d, i) => {
                const totalSum = stats?.totals?.total || 1;
                const orderCount = stats?.totals?.orders
                  ? Math.round((d.value / totalSum) * stats.totals.orders)
                  : 0;
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700">{d.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{orderCount} Pedidos</div>
                      <div className="text-sm text-gray-600">${formatCurrency(d.value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Últimos pedidos - mismo endpoint que ahora (context) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-500">Últimos Pedidos</h2>
        <OrdersTable orders={orders.slice(0, 5)} isMain={true} />
      </div>
    </div>
  );
}

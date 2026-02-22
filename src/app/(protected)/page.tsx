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

  // Siempre mostrar los 3 métodos (incluso con 0). Porcentaje para el gráfico; si total 0, todos 0%.
  const pieData = useMemo(() => {
    const { effective = 0, transfer = 0, pagoNube = 0 } = stats?.byPaymentMethod ?? {};
    const total = effective + transfer + pagoNube || 0;
    return [
      { name: "Efectivo", value: effective, percent: total ? (effective / total) * 100 : 0 },
      { name: "Transferencia", value: transfer, percent: total ? (transfer / total) * 100 : 0 },
      { name: "PagoNube", value: pagoNube, percent: total ? (pagoNube / total) * 100 : 0 },
    ];
  }, [stats?.byPaymentMethod]);


  if (statsLoading && !stats) {
    return <LoadingDialog text="Cargando estadísticas..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header + date filters - colores app (purple) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(["today", "week", "month"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setDateRangeKey(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                dateRangeKey === key
                  ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600 shadow-sm"
                  : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
              }`}
            >
              {key === "today" ? "Hoy" : key === "week" ? "Esta Semana" : "Este Mes"}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowCustomPopup(!showCustomPopup)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                dateRangeKey === "custom" ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600 shadow-sm" : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
              }`}
            >
              Rango personalizado <FiChevronDown className="w-4 h-4" />
            </button>
            {showCustomPopup && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCustomPopup(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-purple-200 rounded-xl shadow-xl p-5 min-w-[300px] ring-2 ring-purple-100">
                  <div className="text-sm font-bold text-purple-900 mb-2">Desde</div>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => {
                      setCustomFrom(e.target.value);
                      setCustomFromError("");
                    }}
                    className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {customFromError && <p className="text-red-500 text-xs mt-1">{customFromError}</p>}
                  <div className="text-sm font-bold text-purple-900 mt-3 mb-2">Hasta</div>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => {
                      setCustomTo(e.target.value);
                      setCustomToError("");
                    }}
                    className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {customToError && <p className="text-red-500 text-xs mt-1">{customToError}</p>}
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setShowCustomPopup(false)}
                      className="flex-1 py-2.5 rounded-lg border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleApplyCustomRange}
                      className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md transition"
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

      {/* 4 cards superiores: más bonitas, colores app (purple) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200/50 border border-purple-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="text-sm font-bold text-white/90 uppercase tracking-wide">Ventas Totales</div>
            <div className="text-3xl font-bold mt-2">${formatCurrency(stats?.totals?.total ?? 0)}</div>
            <div className="text-sm font-semibold text-white/90 mt-1">{(stats?.totals?.orders ?? 0)} Pedidos</div>
            {stats?.totals?.difference != null && stats.totals.difference !== 0 && (
              <div className="text-xs font-semibold mt-3 flex items-center gap-1">
                <span className={stats.totals.difference >= 0 ? "text-purple-200" : "text-red-200"}>
                  {stats.totals.difference >= 0 ? "↑" : "↓"} {Math.abs(stats.totals.difference)}% vs periodo anter.
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200/50 border border-purple-500/20 overflow-hidden relative">
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="text-sm font-bold text-white/90 uppercase tracking-wide">Pagos Validados</div>
            <div className="text-3xl font-bold mt-2">${formatCurrency(stats?.validPayments?.total ?? 0)}</div>
            <div className="text-sm font-semibold text-white/90 mt-1">{(stats?.validPayments?.payments ?? 0)} Pagos Confirmados</div>
          </div>
        </div>
        <div className="bg-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-md overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-purple-200/30 rounded-full" />
          <div className="relative">
            <div className="text-sm font-bold text-purple-800 uppercase tracking-wide">Pendiente por Cobrar</div>
            <div className="text-3xl font-bold text-purple-700 mt-2">${formatCurrency(stats?.pendingPayments?.total ?? 0)}</div>
            <div className="text-sm font-semibold text-purple-600 mt-1">{(stats?.pendingPayments?.orders ?? 0)} Pedidos Pendientes</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-md overflow-hidden relative">
          <div className="absolute bottom-2 right-2 w-20 h-20 bg-purple-100 rounded-full" />
          <div className="relative">
            <div className="text-sm font-bold text-purple-700 uppercase tracking-wide">Ticket Promedio</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">${formatCurrency(stats?.average?.total ?? 0)}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Promedio por Pedido</div>
          </div>
        </div>
      </div>

      {/* 4 cards: Pedidos por estado - colores app */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md hover:shadow-lg hover:border-purple-200 transition">
          <div className="text-sm font-bold text-purple-700 uppercase tracking-wide">Pedidos Nuevos</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.orders?.created ?? 0}</div>
          <a href="/pedidos/nuevos" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md hover:shadow-lg hover:border-purple-200 transition">
          <div className="text-sm font-bold text-purple-700 uppercase tracking-wide">Pick Up / En Preparación</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{pickUpCount}</div>
          <a href="/pedidos/por-asignar-ruta" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md hover:shadow-lg hover:border-purple-200 transition">
          <div className="text-sm font-bold text-purple-700 uppercase tracking-wide">En Camino</div>
          <div className="text-3xl font-bold text-gray-900 mt-2 flex items-center gap-2">
            <span className="text-purple-400">🚚</span> {stats?.orders?.in_route ?? 0}
          </div>
          <a href="/pedidos/en-camino" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md transition">
            <FiBox className="w-4 h-4" /> Ver Pedidos <FiArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md hover:shadow-lg hover:border-purple-200 transition">
          <div className="text-sm font-bold text-purple-700 uppercase tracking-wide">Finalizados</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.orders?.finished ?? 0}</div>
        </div>
      </div>

      {/* Charts row - colores app (purple) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md">
          <h3 className="text-lg font-bold text-purple-800 mb-5">Ventas Mensuales</h3>
          <div className="flex items-end gap-4 h-64">
            {[3, 2, 1, 0].map((idx, i) => {
              const val = (stats?.monthlySales ?? [0, 0, 0, 0])[idx] ?? 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-purple-700">
                    {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                  </span>
                  <div
                    className="w-full bg-purple-500 rounded-t-lg min-h-[8px] transition-all shadow-sm"
                    style={{ height: `${Math.max(8, (val / maxMonthly) * 200)}px` }}
                  />
                  <span className="text-xs font-medium text-gray-600">{monthLabels[i] ?? ""}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md">
          <h3 className="text-lg font-bold text-purple-800 mb-5">Ventas por Método de Pago</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-52 h-52 flex-shrink-0">
              {/* Donut con stroke-dasharray: colores del sistema (purple) */}
              <svg viewBox="0 0 100 100" className="w-full h-full block">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e9d5ff" strokeWidth="14" />
                {(() => {
                  const C = 2 * Math.PI * 42;
                  const colors = ["#9333ea", "#a855f7", "#c084fc"]; // purple-600, purple-500, purple-400
                  let offset = C / 4;
                  return pieData.map((d, i) => {
                    const length = (d.percent / 100) * C;
                    const seg = (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth="14"
                        strokeDasharray={`${length} ${C + 10}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                      />
                    );
                    offset += length;
                    return seg;
                  });
                })()}
                <circle cx="50" cy="50" r="28" fill="white" />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xl font-bold fill-purple-700"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {stats?.totals?.orders ?? 0}
                </text>
              </svg>
            </div>
            <div className="flex-1 w-full space-y-4">
              {pieData.map((d, i) => {
                const totalSum = stats?.totals?.total || 1;
                const orderCount = stats?.totals?.orders && totalSum > 0
                  ? Math.round((d.value / totalSum) * stats.totals.orders)
                  : 0;
                const dotColors = ["bg-purple-600", "bg-purple-500", "bg-purple-400"];
                return (
                  <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColors[i]}`} />
                      <span className="text-base font-bold text-gray-900">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-gray-900">{orderCount} Pedidos</div>
                      <div className="text-base font-semibold text-purple-700">${formatCurrency(d.value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Últimos pedidos - colores app */}
      <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 shadow-md">
        <h2 className="text-xl font-bold text-purple-800 mb-4">Últimos Pedidos</h2>
        <OrdersTable orders={orders.slice(0, 5)} isMain={true} />
      </div>
    </div>
  );
}

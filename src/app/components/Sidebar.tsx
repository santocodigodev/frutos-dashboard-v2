"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiHome, FiBox, FiMap, FiUsers, FiDollarSign, FiChevronDown, FiChevronUp, FiSettings } from "react-icons/fi";
import { usePedidos } from "../(protected)/pedidos/PedidosContext";
import { getFormattedAdminRole } from "../utils/formatAdminRole";
import { useSidebarRutas } from "../(protected)/rutas/SidebarContext";

const pedidoEstados = [
  { key: "nuevos", label: "Nuevos", href: "/pedidos/nuevos", estado: "created" , count: 0},
  { key: "por-asignar", label: "Por asignar ruta", href: "/pedidos/por-asignar-ruta", estado: "pending_route_assignment" , count: 0},
  { key: "por-armar", label: "Por armar", href: "/pedidos/por-armar", estado: "pending_assembly" , count: 0},
  { key: "por-recoger", label: "Por recoger (cliente)", href: "/pedidos/por-recoger", estado: "pending_pick_up" , count: 0},
  { key: "por-recoger-delivery", label: "Por recoger (delivery)", href: "/pedidos/por-recoger-delivery", estado: "pending_delivery_pick_up" , count: 0},
  { key: "en-camino", label: "En camino", href: "/pedidos/en-camino", estado: "in_route" , count: 0},
  { key: "devueltos", label: "Por devolver", href: "/pedidos/devueltos", estado: "returned" , count: 0},
  { key: "finalizados", label: "Finalizados", href: "/pedidos/finalizados", estado: "finished" , count: 0},
  { key: "cancelados", label: "Cancelados", href: "/pedidos/cancelados", estado: "canceled" , count: 0},
];

const rutasMenu = [
  { label: "Creadas", href: "/rutas/creadas", estado: "created" },
  { label: "Activas", href: "/rutas/activas", estado: "active" },
  { label: "Históricas", href: "/rutas/historicas" },
];

const personalMenu = [
  { label: "Administradores", href: "/personal/administradores" },
  { label: "Cajeros", href: "/personal/cajeros" },
  { label: "Armadores", href: "/personal/armadores" },
  { label: "Repartidores", href: "/personal/repartidores" },
];

const configMenu = [
  { label: "Zonas", href: "/configuracion/zonas" },
  { label: "Zonas Horarias", href: "/configuracion/zonas-horarias" },
  { label: "Ubicaciones", href: "/configuracion/ubicaciones" },
  { label: "Sucursales", href: "/configuracion/sucursales" },
  { label: "Descuentos", href: "/configuracion/descuentos" },
  { label: "Cajas", href: "/configuracion/cajas" },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string, role?: string } | null>(null);
  const pedidosContext = usePedidos?.();
  const orders = pedidosContext?.orders || [];
  const { rutasCreadas, rutasActivas } = useSidebarRutas();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Expandir automáticamente la categoría según la ruta actual
  useEffect(() => {
    if (pathname.startsWith("/pedidos")) {
      setExpanded("pedidos");
    } else if (pathname.startsWith("/rutas")) {
      setExpanded("rutas");
    } else if (pathname.startsWith("/personal")) {
      setExpanded("personal");
    } else if (pathname.startsWith("/configuracion")) {
      setExpanded("configuracion");
    }
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("user");
    router.push("/login");
  }

  function handleExpand(key: string) {
    setExpanded(expanded === key ? null : key);
  }

  // Calcular los counts por estado para Pedidos
  const counts: Record<string, number> = {};
  pedidoEstados.forEach(({ estado }) => {
    counts[estado] = orders.filter((o: any) => o.o_localStatus === estado).length;
  });

  const menuItems = [
    {
      title: "Rutas",
      items: [
        {
          name: "Creadas",
          href: "/rutas/creadas",
          count: rutasCreadas
        },
        {
          name: "Activas",
          href: "/rutas/activas",
          count: rutasActivas
        },
        {
          name: "Históricas",
          href: "/rutas/historicas"
        }
      ]
    }
  ];

  return (
    <aside className="bg-white shadow-lg h-screen w-60 flex flex-col justify-between fixed left-0 top-0 z-20">
      <div>
        <div className="flex items-center gap-2 px-6 py-6">
          <Image src="/assets/logo.png" alt="Logo" width={40} height={40} />
          <span className="font-bold text-xl text-purple-700">ZN</span>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          <Link
            href="/"
            className={`flex items-center gap-2 px-6 py-2 rounded transition font-medium ${
              pathname === "/" ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
            }`}
          >
            <FiHome /> Inicio
          </Link>
          {/* Pedidos */}
          <div>
            <button
              className={`flex items-center gap-2 px-6 py-2 rounded w-full transition font-medium ${
                expanded === "pedidos" ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
              }`}
              onClick={() => handleExpand("pedidos")}
            >
              <FiBox /> Pedidos
              <span className="ml-auto">{expanded === "pedidos" ? <FiChevronUp /> : <FiChevronDown />}</span>
            </button>
            {expanded === "pedidos" && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                {pedidoEstados.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                      pathname === item.href ? "bg-purple-100 text-purple-700 font-semibold" : "hover:bg-purple-50"
                    }`}
                  >
                    <span className={pathname === item.href ? "text-purple-700" : "text-black"}>{item.label}</span>
                    {counts[item.estado] > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                        {counts[item.estado]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Rutas */}
          <div>
            <button
              className={`flex items-center gap-2 px-6 py-2 rounded w-full transition font-medium ${
                expanded === "rutas" ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
              }`}
              onClick={() => handleExpand("rutas")}
            >
              <FiMap /> Rutas
              <span className="ml-auto">{expanded === "rutas" ? <FiChevronUp /> : <FiChevronDown />}</span>
            </button>
            {expanded === "rutas" && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                {rutasMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                      pathname === item.href ? "bg-purple-100 text-purple-700 font-semibold" : "hover:bg-purple-50"
                    }`}
                  >
                    <span className={pathname === item.href ? "text-purple-700" : "text-black"}>{item.label}</span>
                    {item.estado && (
                      (item.estado === "created" && rutasCreadas > 0) || 
                      (item.estado === "active" && rutasActivas > 0) ? (
                      <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                          {item.estado === "created" ? rutasCreadas : rutasActivas}
                      </span>
                      ) : null
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Personal */}
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <div>
              <button
                className={`flex items-center gap-2 px-6 py-2 rounded w-full transition font-medium ${
                  expanded === "personal" ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
                }`}
                onClick={() => handleExpand("personal")}
              >
                <FiUsers /> Personal
                <span className="ml-auto">{expanded === "personal" ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>
              {expanded === "personal" && (
                <div className="ml-4 mt-1 flex flex-col gap-1">
                  {personalMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-2 py-1 rounded text-sm ${
                        pathname === item.href ? "bg-purple-100 text-purple-700 font-semibold" : "hover:bg-purple-50"
                      }`}
                    >
                      <span className={pathname === item.href ? "text-purple-700" : "text-black"}>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Balance */}
          <Link
            href="/balance"
            className={`flex items-center gap-2 px-6 py-2 rounded transition font-medium ${
              pathname.startsWith("/balance") ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
            }`}
          >
            <FiDollarSign /> Balance
          </Link>

          {/* Configuración */}
          <div>
            <button
              className={`flex items-center gap-2 px-6 py-2 rounded w-full transition font-medium ${
                expanded === "configuracion" ? "bg-purple-100 text-purple-700" : "text-gray-700 hover:bg-purple-50"
              }`}
              onClick={() => handleExpand("configuracion")}
            >
              <FiSettings /> Configuración
              <span className="ml-auto">{expanded === "configuracion" ? <FiChevronUp /> : <FiChevronDown />}</span>
            </button>
            {expanded === "configuracion" && (
              <div className="ml-4 mt-1 flex flex-col gap-1">
                {configMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-2 py-1 rounded text-sm ${
                      pathname === item.href ? "bg-purple-100 text-purple-700 font-semibold" : "hover:bg-purple-50"
                    }`}
                  >
                    <span className={pathname === item.href ? "text-purple-700" : "text-black"}>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
      <div className="px-6 py-4 border-t">
        <div className="text-xs text-gray-500">{getFormattedAdminRole(user?.role || "")}</div>
        <div className="font-semibold text-gray-500">{user?.name || "Anita Cruz"}</div>
        <div className="text-xs text-gray-400 mb-2">{user?.email || "anita@znfrutas.com"}</div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 py-1 px-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm transition"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

"use client";
import { PedidosProvider } from "./pedidos/PedidosContext";
import { RutasProvider } from "./rutas/RutasContext";
import { SidebarRutasProvider } from "./rutas/SidebarContext";
import Sidebar from "../components/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PedidosProvider>
      <RutasProvider>
        <SidebarRutasProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 p-8 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarRutasProvider>
      </RutasProvider>
    </PedidosProvider>
  );
} 
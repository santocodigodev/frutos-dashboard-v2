"use client";
import { PedidosProvider } from "./pedidos/PedidosContext";
import { RutasProvider } from "./rutas/RutasContext";
import { SidebarRutasProvider } from "./rutas/SidebarContext";
import Sidebar from "../components/Sidebar";
import { useUserOrRedirect } from "../utils/auth";
import LoadingDialog from "../components/LoadingDialog";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUserOrRedirect();

  // Si está cargando o no hay usuario, mostrar loading mientras redirige
  if (loading || !user || !user.token) {
    return <LoadingDialog text="Verificando autenticación..." />;
  }

  return (
    <PedidosProvider>
      <RutasProvider>
        <SidebarRutasProvider>
          <div className="flex min-h-screen bg-[#f3f4f6] relative">
            <Sidebar />
            <div className="flex-1 ml-60 relative z-0">
              <main className="p-8">
                {children}
              </main>
            </div>
          </div>
        </SidebarRutasProvider>
      </RutasProvider>
    </PedidosProvider>
  );
}
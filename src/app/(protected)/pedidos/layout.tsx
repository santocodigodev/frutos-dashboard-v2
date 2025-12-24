"use client";
import { PedidosProvider } from "./PedidosContext";

// Force dynamic rendering for all child pages
export const dynamic = 'force-dynamic';

export default function PedidosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PedidosProvider>{children}</PedidosProvider>;
} 
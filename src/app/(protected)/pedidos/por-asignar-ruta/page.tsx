"use client";

import dynamic from 'next/dynamic';

const PedidosPorAsignarContent = dynamic(() => import('./PedidosPorAsignarContent'), {
  ssr: false
});

export default function PedidosPorAsignar() {
  return <PedidosPorAsignarContent />;
}

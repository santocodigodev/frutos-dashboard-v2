export function getFormattedStatus(status: string): string {
  switch (status) {
    case "created":
      return "Nuevo";
    case "data_completed":
      return "Datos completados";
    case "data_rejected":
      return "Datos rechazados";
    case "pending_route_assignment":
      return "Por asignar ruta";
    case "pending_assembly":
      return "Por armar";
    case "pending_pick_up":
      return "Por recoger";
    case "in_route":
      return "En camino";
    case "returned":
      return "Devuelto";
    case "finished":
      return "Finalizado";
    case "canceled":
      return "Cancelado";
    case "pending_delivery_pick_up":
      return "Por recoger (delivery)";
    default:
      return status;
  }
}

export function getFormattedStatusIcon(status: string): string {
  switch (status) {
    case "created":
      return "⏳";
    case "data_completed":
      return "✅";
    case "data_rejected":
      return "❌ rechazados";
    case "pending_route_assignment":
      return "📦";
    case "pending_assembly":
      return "📦";
    case "pending_pick_up":
      return "🚚";
    case "in_route":
      return "🚚";
    case "returned":
      return "❌";
    case "finished":
      return "✨";
    case "canceled":
      return "❌";
    case "pending_delivery_pick_up":
      return "🚚";
    default:
      return status;
  }
}

export function getFormattedDeliveryType(deliveryType: string): string {
  switch (deliveryType?.toLowerCase()) {
    case "ship":
    case "delivery":
      return "Delivery";
    case "pickup":
    case "pick_up":
    case "retiro":
      return "Retiro en tienda";
    default:
      return deliveryType;
  }
} 
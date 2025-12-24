export function getFormattedPaymentType(paymentType: string): string {
  switch (paymentType?.toLowerCase()) {
    case "transfer":
    case "transferencia":
      return "Transferencia";
    case "cash":
    case "effective":
      return "Efectivo";
    case "pagonube":
    case "tarjeta":
    case "card":
      return "Pagado por la plataforma";
    default:
      return "No definido";
  }
} 
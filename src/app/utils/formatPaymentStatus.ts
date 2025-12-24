export function getFormattedPaymentStatus(paymentType: string): string {
  switch (paymentType?.toLowerCase()) {
    case "payment_accepted":
      return "Pago aceptado";
    case "payment_sent":
      return "Pago enviado";
    case "payment_rejected":
      return "Pago rechazado";
    case "pending":
      return "Pago pendiente";
    default:
      return "Acordar con el vendedor";
  }
} 
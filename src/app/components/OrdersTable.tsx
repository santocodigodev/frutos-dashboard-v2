import { getFormattedPaymentType } from "../utils/formatPaymentType";
import { getFormattedDeliveryType } from "../utils/formatDeliveryType";
import OrderDetailDialog from "./OrderDetailDialog";
import { useState } from "react";
import { getFormattedStatus } from "../utils/formatStatus";

interface Order {
  o_id: number;
  o_TN_Order_number: number;
  o_paymentType: string;
  o_shipmentType: string;
  o_TN_ID: number;
  zone: string;
  o_createdAt: string;
  o_localStatus: string;
  o_totalToPay: number;
}

export default function OrdersTable({ orders, isMain = false, readOnly = false }: { orders: Order[], isMain: boolean, readOnly?: boolean }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const formatMoney = (n: any) => `$${Number(n).toLocaleString("es-AR")}`;

  if (!orders.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 w-full text-center text-gray-500">
        No hay órdenes recientes.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 px-3">Nº Orden</th>
            <th className="py-2 px-3">Método de pago</th>
            <th className="py-2 px-3">Tipo de entrega</th>
            <th className="py-2 px-3">Zona</th>
            {isMain ? (<th className="py-2 px-3">Estado</th>) : ""}
            <th className="py-2 px-3">Subtotal</th>
            <th className="py-2 px-3">Fecha de compra</th>
            <th className="py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.o_id} className="border-t text-gray-500">
              <td className="py-2 px-3">#{o.o_TN_Order_number || o.o_id}</td>
              <td className="py-2 px-3">{getFormattedPaymentType(o.o_paymentType)}</td>
              <td className="py-2 px-3">{getFormattedDeliveryType(o.o_shipmentType)}</td>
              <td className="py-2 px-3">{o.zone}</td>
              {isMain ? (<td className="py-2 px-3">{getFormattedStatus(o.o_localStatus)}</td>) : ""}
              <td className="py-2 px-3">{formatMoney(o.o_totalToPay)}</td>
              <td className="py-2 px-3">{new Date(o.o_createdAt).toLocaleString()}</td>
              <td className="py-2 px-3">
                <button 
                  className="bg-purple-600 text-white px-3 py-1 rounded text-xs"
                  onClick={() => {
                    setSelectedOrderNumber(o.o_TN_ID || o.o_TN_Order_number || o.o_id);
                    setShowDialog(true);
                  }}
                >
                  Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showDialog && selectedOrderNumber && (
        <OrderDetailDialog 
          o_TN_Order_number={selectedOrderNumber} 
          onClose={() => {
            setShowDialog(false);
            setSelectedOrderNumber(null);
          }}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

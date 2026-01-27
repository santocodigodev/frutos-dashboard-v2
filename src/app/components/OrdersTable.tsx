import { getFormattedPaymentType } from "../utils/formatPaymentType";
import { getFormattedDeliveryType } from "../utils/formatDeliveryType";
import OrderDetailDialog from "./OrderDetailDialog";
import { useState } from "react";
import { getFormattedStatus } from "../utils/formatStatus";
import { usePedidos } from "../(protected)/pedidos/PedidosContext";

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

function SortableTh({ label, fieldKey, sortField, sortOrder, onSort }: { label: string; fieldKey: string; sortField: string; sortOrder: 'asc' | 'desc'; onSort: (f: string) => void }) {
  const active = sortField === fieldKey;
  return (
    <th className="py-2 px-3">
      <button type="button" onClick={() => onSort(fieldKey)} className="text-left font-medium hover:text-purple-600 flex items-center gap-1">
        {label}
        {active && <span className="text-purple-600">{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>}
      </button>
    </th>
  );
}

export default function OrdersTable({ orders, isMain = false, readOnly = false }: { orders: Order[], isMain: boolean, readOnly?: boolean }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<number | null>(null);
  const { sortField = 'id', sortOrder = 'desc', setSort } = usePedidos();
  const formatMoney = (n: any) => `$${Number(n).toLocaleString("es-AR")}`;

  const handleSort = (field: string) => {
    setSort(field, sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
  };

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
            <SortableTh label="Nº Orden" fieldKey="id" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
            <SortableTh label="Método de pago" fieldKey="paymentType" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
            <SortableTh label="Tipo de entrega" fieldKey="shipmentType" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
            <th className="py-2 px-3">Zona</th>
            {isMain ? (<SortableTh label="Estado" fieldKey="localStatus" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />) : null}
            <SortableTh label="Subtotal" fieldKey="totalToPay" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
            <SortableTh label="Fecha de compra" fieldKey="createdAt" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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

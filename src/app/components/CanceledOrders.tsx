import React, { useEffect, useState } from 'react';
import OrderDetailDialog from './OrderDetailDialog';
import LoadingDialog from './LoadingDialog';
import { getFormattedStatus, getFormattedStatusIcon } from '../utils/formatStatus';
import { getFormattedPaymentType } from '../utils/formatPaymentType';
import { getFormattedDeliveryType } from '../utils/formatDeliveryType';
import { getApiUrl } from '../utils/api';

export default function CanceledOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(getApiUrl('/orders'), {
          headers: {
            'accept': 'application/json',
            'token': user.token
          }
        });
        const data = await response.json();
        // Filter only canceled orders
        const canceledOrders = data.filter((order: any) => order.localStatus === 'canceled');
        setOrders(canceledOrders);
      } catch (error) {
        console.error('Error fetching canceled orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user.token]);

  if (loading) {
    return <LoadingDialog text="Cargando órdenes canceladas..." />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-6">Órdenes Canceladas</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          No hay órdenes canceladas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const tn = order.TNOrder || {};
            const payment = (order.payment && order.payment[0]) || {};
            const customer = tn.customer || {};
            const shipping = tn.shipping_address || {};

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedOrder(order.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">{getFormattedStatusIcon(order.localStatus)}</span>
                    <span className="text-sm font-semibold text-gray-600">
                      {getFormattedStatus(order.localStatus)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Cliente:</span> {customer.name}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Teléfono:</span> {customer.phone}
                  </div>
                  {shipping.address && (
                    <div className="text-sm">
                      <span className="font-semibold">Dirección:</span> {shipping.address}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-semibold">Método de pago:</span>{' '}
                    {getFormattedPaymentType(order.paymentType || tn.gateway_name || '')}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Tipo de entrega:</span>{' '}
                    {getFormattedDeliveryType(order.shipmentType || tn.gateway || '')}
                  </div>
                  <div className="text-sm font-semibold text-red-600">
                    Total: ${Number(tn.total || 0).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailDialog
          o_TN_Order_number={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
} 
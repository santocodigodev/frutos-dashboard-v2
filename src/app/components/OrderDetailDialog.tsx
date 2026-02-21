"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import LoadingDialog from "./LoadingDialog";
import VoucherDialog from "./VoucherDialog";
import EvidenceDialog from "./EvidenceDialog";
import { getFormattedPaymentStatus } from "../utils/formatPaymentStatus";
import { getFormattedPaymentType } from "../utils/formatPaymentType";
import { getFormattedDeliveryType } from "../utils/formatDeliveryType";
import { getFormattedStatus, getFormattedStatusIcon } from "../utils/formatStatus";
import MapDialog from './MapDialog';
import { usePedidos } from '../(protected)/pedidos/PedidosContext';
import { useSidebarRutas } from '../(protected)/rutas/SidebarContext';
import { getApiUrl, getAuthHeaders } from "../utils/api";

export enum PaymentTypeEnum {
  TRANSFER = 'transfer',
  EFFECTIVE = 'effective',
  PAGO_NUBE = 'pagonube',
  NOT_DEFINED = 'not_defined',
}

export enum ShipmentTypeEnum {
  SHIP = 'ship',
  PICKUP = 'pickup',
}

interface Zone {
  id: number;
  name: string;
  price: number;
}

interface TimeZone {
  id: number;
  name: string;
}

const RESTRICTED_STATUSES = ['in_route', 'finished', 'canceled', 'returned'];

const CANCEL_MOTIVES = [
  "Olvidé agregar un producto",
  "Cambié de opinión",
  "Producto no disponible",
  "Precio incorrecto",
  "Error en la dirección",
  "Problema con el método de pago",
  "Duplicado",
  "Otro"
];

interface OrderDetailDialogProps {
  o_TN_Order_number: number;
  onClose: () => void;
  readOnly?: boolean;
}

export default function OrderDetailDialog({ o_TN_Order_number, onClose, readOnly = false }: OrderDetailDialogProps) {
  const [priceDiscount, setPriceDiscount] = useState<number>(80000);
  const [effectiveDiscount, setEffectiveDiscount] = useState<number>(3000);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVoucher, setShowVoucher] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
  const [editedOrder, setEditedOrder] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMap, setShowMap] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMotive, setCancelMotive] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");
  const { refreshOrders } = usePedidos();
  const { refreshCounts } = useSidebarRutas();
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Ensure focus and ESC to close
  useEffect(() => {
    setIsMounted(true);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Focus container when it mounts
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [isMounted]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [orderRes, zonesRes, timeZonesRes] = await Promise.all([
          fetch(getApiUrl(`/orders/find-by-id/${o_TN_Order_number}`), {
            headers: getAuthHeaders()
          }),
          fetch(getApiUrl('/zone'), {
            headers: getAuthHeaders()
          }),
          fetch(getApiUrl('/timezone'), {
            headers: getAuthHeaders()
          })
        ]);

        const [orderData, zonesData, timeZonesData] = await Promise.all([
          orderRes.json(),
          zonesRes.json(),
          timeZonesRes.json()
        ]);

        setOrder(orderData);
        setEditedOrder(orderData);
        setZones(zonesData);
        setTimeZones(timeZonesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [o_TN_Order_number]);

  // Watch for changes
  useEffect(() => {
    if (order && editedOrder) {
      const hasChanges = JSON.stringify(order) !== JSON.stringify(editedOrder);
      setHasChanges(hasChanges);
    }
  }, [order, editedOrder]);

  const handleInputChange = (field: string, value: any) => {
    setEditedOrder((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const canEdit = order?.localStatus && !RESTRICTED_STATUSES.includes(order.localStatus);
  const canCancel = order?.localStatus && 
                    order.localStatus !== 'in_route' && 
                    order.localStatus !== 'finished' && 
                    order.localStatus !== 'canceled';

  const handleSave = async () => {
    if (!canEdit) return;
    
    setIsSaving(true);
    try {
      const updateData = {
        zone: editedOrder.zone?.id,
        timeZone: editedOrder.timeZone?.id,
        isClosedNeighborhood: editedOrder.isClosedNeighborhood,
        paymentType: editedOrder.paymentType,
        shipmentType: editedOrder.shipmentType,
        adminDetails: editedOrder.adminDetails
      };

      const response = await fetch(getApiUrl(`/orders/${order.id}/update-by-admin`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la orden');
      }

      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setEditedOrder(updatedOrder);
      setHasChanges(false);
      
      // Actualizar los contextos para reflejar los cambios en el sidebar
      await Promise.all([
        refreshOrders(),
        refreshCounts()
      ]);
      
      // Recargar la página para actualizar el sidebar cuando cambia el estado de la orden
      window.location.reload();
    } catch (error) {
      console.error('Error saving changes:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapSave = () => {
    setShowMap(false);
    // Refrescar la orden
    setLoading(true);
    fetch(getApiUrl(`/orders/find-by-id/${o_TN_Order_number}`))
      .then(res => res.json())
      .then(orderData => {
        setOrder(orderData);
        setEditedOrder(orderData);
      })
      .finally(() => setLoading(false));
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!editedOrder?.TNOrder?.products) return 0;

    // Calculate products subtotal
    const productsSubtotal = editedOrder.TNOrder.products.reduce((total: number, product: any) => {
      return total + (Number(product.price) * product.quantity);
    }, 0);

    // Add shipping cost only if shipment type is 'ship'
    const shippingCost = editedOrder.shipmentType === 'ship' ? (editedOrder.zone?.price || 0) : 0;

    // Subtract cash discount if payment type is 'effective'
    const cashDiscount = editedOrder.paymentType === PaymentTypeEnum.EFFECTIVE ? 
      (editedOrder.TNOrder.discount || 0) : 0;

    return productsSubtotal + shippingCost - cashDiscount;
  };

  // Calculate client total
  const calculateClientTotal = () => {
    if (!editedOrder?.TNOrder?.products) return 0;
    
    const productsSubtotal = editedOrder.TNOrder.products.reduce((total: number, product: any) => 
      total + (Number(product.price) * product.quantity), 0);
    
    const shippingCost = editedOrder.shipmentType === 'ship' ? 
      (productsSubtotal < 80000 ? (editedOrder.zone?.price || 0) : 0) : 0;
    
    const totalBeforeDiscount = productsSubtotal + shippingCost;
    
    // Calcular descuento: 10% para efectivo, 5% para transferencia, 0% para PagoNube
    let discount = 0;
    const paymentType = editedOrder.paymentType || editedOrder?.paymentType;
    const isPagoNube = paymentType === PaymentTypeEnum.PAGO_NUBE || 
                       paymentType === 'pagonube' || 
                       paymentType === 'tarjeta' || 
                       paymentType === 'card';
    const isEffective = paymentType === PaymentTypeEnum.EFFECTIVE || paymentType === 'effective';
    const isTransfer = paymentType === PaymentTypeEnum.TRANSFER || paymentType === 'transfer';
    
    if (isEffective) {
      discount = Math.round(totalBeforeDiscount * 0.10); // 10% para efectivo
    } else if (isTransfer) {
      discount = Math.round(totalBeforeDiscount * 0.05); // 5% para transferencia
    }
    // PagoNube no tiene descuento (discount = 0)
    
    return totalBeforeDiscount - discount;
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      const clientTotal = calculateClientTotal();
      const isTransfer = editedOrder?.paymentType === PaymentTypeEnum.TRANSFER || editedOrder?.paymentType === 'transfer';
      
      // Create payment
      const paymentData: any = {
        voucher: null,
        name: isTransfer ? "Transferencia" : "Efectivo",
        status: "payment_accepted",
        order: order.id,
        price: clientTotal
      };

      const paymentResponse = await fetch(getApiUrl('/payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify(paymentData),
      });

      if (!paymentResponse.ok) {
        throw new Error('Error al crear el pago');
      }

      const payment = await paymentResponse.json();

      // Marcar como pagada en Tienda Nube
      if (order.TN_ID) {
        try {
          const markPaidResponse = await fetch(getApiUrl(`/payment/mark-as-paid/${order.TN_ID}`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'token': user.token
            }
          });

          if (!markPaidResponse.ok) {
            console.error('Error al marcar como pagada en Tienda Nube');
          }
        } catch (error) {
          console.error('Error al marcar como pagada en Tienda Nube:', error);
        }
      }

      // Update order with payment
      const updateData = {
        zone: editedOrder.zone?.id,
        timeZone: editedOrder.timeZone?.id,
        isClosedNeighborhood: editedOrder.isClosedNeighborhood,
        paymentType: editedOrder.paymentType,
        shipmentType: editedOrder.shipmentType,
        payment: payment.id
      };

      const orderResponse = await fetch(getApiUrl(`/orders/${order.id}/update-by-admin`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify(updateData),
      });

      if (!orderResponse.ok) {
        throw new Error('Error al actualizar la orden');
      }

      const updatedOrder = await orderResponse.json();
      setOrder(updatedOrder);
      setEditedOrder(updatedOrder);
      setShowPaymentConfirmation(false);
      
      // Refresh order data
      setLoading(true);
      const refreshResponse = await fetch(getApiUrl(`/orders/find-by-id/${o_TN_Order_number}`));
      const refreshedOrder = await refreshResponse.json();
      setOrder(refreshedOrder);
      setEditedOrder(refreshedOrder);
      setLoading(false);
    } catch (error) {
      console.error('Error confirming payment:', error);
      // TODO: Add proper error handling/notification
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelMotive) {
      alert('Por favor seleccione un motivo de cancelación');
      return;
    }

    setIsCanceling(true);
    try {
      const cancelData = {
        cancelMotive: cancelMotive,
        cancelReason: cancelDetails || ""
      };

      const response = await fetch(getApiUrl(`/orders/${order.id}/cancel`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify(cancelData),
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la orden');
      }

      // Refresh order data
      const refreshResponse = await fetch(getApiUrl(`/orders/find-by-id/${o_TN_Order_number}`));
      const refreshedOrder = await refreshResponse.json();
      setOrder(refreshedOrder);
      setEditedOrder(refreshedOrder);
      
      // Refresh orders context
      await Promise.all([
        refreshOrders(),
        refreshCounts()
      ]);

      setShowCancelConfirmation(false);
      setCancelMotive("");
      setCancelDetails("");
      
      // Recargar la página para actualizar el sidebar cuando se cancela una orden
      window.location.reload();
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Error al cancelar la orden. Por favor intente nuevamente.');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) {
    return <LoadingDialog text="Cargando detalle de la orden..." />;
  }

  if (!order) {
    const errorDialog = (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-lg shadow-lg p-8 min-w-[600px] relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-purple-600">&times;</button>
          <div className="text-xl font-bold text-red-600">No se pudo cargar la orden.</div>
        </div>
      </div>
    );
    return typeof window !== 'undefined' ? createPortal(errorDialog, document.body) : null;
  }

  const tn = order.TNOrder || {};
  const shipping = tn.default_address || {};
  const customer = tn.customer || {};
  const products = tn.products || [];
  const payment = (order.payment && order.payment[0]) || {};
  const zone = order.zone || {};
  const isCanceled = order?.localStatus === 'canceled';
  const paymentType = editedOrder?.paymentType ?? order?.paymentType ?? tn?.gateway_name ?? '';
  const isEffectiveOrTransferPayment = paymentType === PaymentTypeEnum.EFFECTIVE || paymentType === 'effective' ||
    paymentType === PaymentTypeEnum.TRANSFER || paymentType === 'transfer';
  const paymentPending = !payment.status || payment.status === 'pending';
  const canMarkAsPaid = !isCanceled && isEffectiveOrTransferPayment && paymentPending;
  const timeZone = order.timeZone || {};
  console.log(timeZone);

  // Utilidades para formato
  const formatMoney = (n: any) => `$${Number(n).toLocaleString("es-AR")}`;

  const dialogContent = (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto py-8" 
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 min-w-[900px] max-w-4xl w-full relative my-auto mx-4"
        onClick={e => e.stopPropagation()}
        ref={containerRef}
        tabIndex={-1}
      >
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm pb-4 z-10 border-b mb-6">
            <button onClick={onClose} className="absolute top-0 right-0 text-4xl text-purple-600 hover:text-purple-800">&times;</button>
            <h2 className="text-3xl font-bold text-center text-purple-600">
              Detalle del pedido <span className="text-[#7c3aed]">#{tn.number || o_TN_Order_number}</span>
              {!canEdit && (
                <span className="block text-sm text-red-500 mt-2">
                  No se puede editar: {getFormattedStatus(order?.localStatus || '')}
                </span>
              )}
            </h2>
            <span className="block text-center text-[#7c3aed] mb-5">
              {getFormattedStatusIcon(order?.localStatus || '')} {getFormattedStatus(order?.localStatus || '')}
            </span>
            <div className="absolute top-0 right-12 flex gap-3">
              {hasChanges && canEdit && !readOnly && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              )}
              {canCancel && !readOnly && (
                <button
                  onClick={() => {
                    setCancelMotive("");
                    setCancelDetails("");
                    setShowCancelConfirmation(true);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Cancelar orden
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-16rem)] pr-2">
          {/* Customer and Shipping Info */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
              <input 
                className="w-full border rounded px-2 py-1 text-black bg-white" 
                value={editedOrder?.TNOrder?.customer?.name || ""} 
                disabled
                onChange={(e) => handleInputChange('TNOrder.customer.name', e.target.value)}
                placeholder="Nombre completo" 
              />
            </div>
            <div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Numero de telefono <span className="inline-block align-middle ml-1 text-green-500">&#128222;</span></label>
                  <input 
                    className="w-full border rounded px-2 py-1 text-black bg-white" 
                    value={editedOrder?.TNOrder?.customer?.phone || ""} 
                    disabled
                    onChange={(e) => handleInputChange('TNOrder.customer.phone', e.target.value)}
                    placeholder="+54 1 2345 6789"  
                  />
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/${editedOrder?.TNOrder?.customer?.phone?.replace(/\D/g, '')}`, '_blank')}
                  className="bg-green-800 text-white px-3 py-1 rounded text-xs mb-1 hover:bg-green-600"
                >
                  WhatsApp
                </button>
              </div>
            </div>
            {order.shipmentType === 'ship' && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Direccion completa</label>
                  <input 
                    className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                    disabled={!canEdit || readOnly}
                    value={editedOrder?.finalDestiny?.name || editedOrder?.TNOrder?.billing_address || ""} 
                    onChange={(e) => handleInputChange('TNOrder.billing_address', e.target.value)}
                    placeholder="Dirección" 
                  />
                  </div>
                  <button 
                    className={`px-3 py-1 rounded text-xs mb-1 ${
                      !canEdit || readOnly
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
                    onClick={() => {
                      if (canEdit && !readOnly) {
                        setShowMap(true);
                      }
                    }}
                    disabled={!canEdit || readOnly}
                  >
                    Ubicar
                  </button>
              </div>
            )}
            {order.shipmentType === 'ship' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.TNOrder?.billing_number || ""} 
                  disabled={!canEdit || readOnly}
                  onChange={(e) => handleInputChange('TNOrder.billing_number', e.target.value)}
                  placeholder="Número" 
                />
            </div>
            )}
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Depto</label>
                <input 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.TNOrder?.billing_floor || ""} 
                  disabled={!canEdit || readOnly}
                  onChange={(e) => handleInputChange('TNOrder.billing_floor', e.target.value)}
                  placeholder="Depto" 
                />
              </div>
            )}
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Codigo postal</label>
                <input 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.TNOrder?.billing_zipcode || ""} 
                  disabled={!canEdit || readOnly}
                  onChange={(e) => handleInputChange('TNOrder.billing_zipcode', e.target.value)}
                  placeholder="Código postal" 
                />
              </div>
            )}
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
                <input 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.TNOrder?.billing_city || ""} 
                  disabled={!canEdit || readOnly}
                  onChange={(e) => handleInputChange('TNOrder.billing_city', e.target.value)}
                  placeholder="Ciudad" 
                />
              </div>
            )}
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Barrio</label>
                <input 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.TNOrder?.billing_locality || ""}
                  disabled={!canEdit || readOnly}
                  onChange={(e) => handleInputChange('TNOrder.billing_locality', e.target.value)}
                  placeholder="Barrio" 
                />
              </div>
            )}
            {order.shipmentType === 'ship' && (
              <div className="flex items-center mt-6">
                <input 
                  type="checkbox" 
                  checked={editedOrder?.isClosedNeighborhood || false} 
                  onChange={(e) => handleInputChange('isClosedNeighborhood', e.target.checked)}
                  disabled={!canEdit || readOnly}
                  className={`mr-2 ${!canEdit ? 'opacity-50' : ''}`}
                />
                <span className="text-xs text-gray-500">Barrio cerrado</span>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="col-span-3 mb-6">
            <label className="block text-xs text-gray-500 mb-1">Comentarios del cliente</label>
            <textarea 
              className="w-full border rounded px-2 py-1 text-black bg-gray-100" 
              value={order?.details || editedOrder?.details || ""} 
              disabled 
              placeholder="Comentarios del cliente"
              rows={3}
            />
          </div>

          {/* Admin Details */}
          <div className="col-span-3 mb-6">
            <label className="block text-xs text-gray-500 mb-1">Comentarios del administrador</label>
            <textarea 
              className={`w-full border rounded px-2 py-1 text-black ${canEdit && !readOnly ? 'bg-white' : 'bg-gray-100'}`}
              value={editedOrder?.adminDetails || ""} 
              disabled={!canEdit || readOnly}
              onChange={(e) => handleInputChange('adminDetails', e.target.value)}
              placeholder="Comentarios del administrador"
              rows={3}
            />
          </div>

          {/* Payment and Delivery Info */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Metodo de pago</label>
              <select 
                className={`w-full border rounded px-2 py-1 text-black ${canEdit ? 'bg-white' : 'bg-gray-100'}`}
                value={editedOrder?.paymentType || tn.gateway_name || PaymentTypeEnum.NOT_DEFINED}
                onChange={(e) => handleInputChange('paymentType', e.target.value)}
                disabled={
                  !canEdit || 
                  readOnly || 
                  payment.status === 'payment_accepted' ||
                  editedOrder?.paymentType === PaymentTypeEnum.PAGO_NUBE ||
                  editedOrder?.paymentType === 'pagonube' ||
                  editedOrder?.paymentType === 'tarjeta' ||
                  editedOrder?.paymentType === 'card' ||
                  tn.gateway_name === 'pagonube' ||
                  tn.gateway_name === 'tarjeta' ||
                  tn.gateway_name === 'card'
                }
              >
                {(() => {
                  const currentPaymentType = editedOrder?.paymentType || tn.gateway_name || PaymentTypeEnum.NOT_DEFINED;
                  const isPagoNube = currentPaymentType === PaymentTypeEnum.PAGO_NUBE || 
                                     currentPaymentType === 'pagonube' || 
                                     currentPaymentType === 'tarjeta' || 
                                     currentPaymentType === 'card';
                  const isEffective = currentPaymentType === PaymentTypeEnum.EFFECTIVE || currentPaymentType === 'effective';
                  const isTransfer = currentPaymentType === PaymentTypeEnum.TRANSFER || currentPaymentType === 'transfer';
                  
                  // Si es PagoNube, mostrar solo PagoNube
                  if (isPagoNube) {
                    return (
                      <option value={PaymentTypeEnum.PAGO_NUBE}>
                        {getFormattedPaymentType(PaymentTypeEnum.PAGO_NUBE)}
                      </option>
                    );
                  }
                  
                  // Si es efectivo, mostrar efectivo y transferencia
                  if (isEffective) {
                    return [
                      <option key={PaymentTypeEnum.EFFECTIVE} value={PaymentTypeEnum.EFFECTIVE}>
                        {getFormattedPaymentType(PaymentTypeEnum.EFFECTIVE)}
                      </option>,
                      <option key={PaymentTypeEnum.TRANSFER} value={PaymentTypeEnum.TRANSFER}>
                        {getFormattedPaymentType(PaymentTypeEnum.TRANSFER)}
                      </option>
                    ];
                  }
                  
                  // Si es transferencia, mostrar transferencia y efectivo
                  if (isTransfer) {
                    return [
                      <option key={PaymentTypeEnum.TRANSFER} value={PaymentTypeEnum.TRANSFER}>
                        {getFormattedPaymentType(PaymentTypeEnum.TRANSFER)}
                      </option>,
                      <option key={PaymentTypeEnum.EFFECTIVE} value={PaymentTypeEnum.EFFECTIVE}>
                        {getFormattedPaymentType(PaymentTypeEnum.EFFECTIVE)}
                      </option>
                    ];
                  }
                  
                  // Por defecto, mostrar todos excepto PagoNube
                  return Object.values(PaymentTypeEnum)
                    .filter(type => type !== PaymentTypeEnum.PAGO_NUBE)
                    .map((type) => (
                      <option key={type} value={type}>
                        {getFormattedPaymentType(type)}
                      </option>
                    ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estado de la transaccion</label>
              <div className="flex items-center gap-2">
                <input 
                  className="w-full border rounded px-2 py-1 text-black bg-gray-200 font-semibold" 
                  value={getFormattedPaymentStatus(payment.status || "pending")} 
                  disabled 
                  style={{background:'#ede9fe', color:'#7c3aed'}} 
                />
                {payment.voucher && (
                  <button 
                    onClick={() => setShowVoucher(true)} 
                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs ml-2 hover:bg-purple-700"
                  >
                    Ver comprobante
                  </button>
                )}
                {canMarkAsPaid && (
                  <button 
                    onClick={() => setShowPaymentConfirmation(true)} 
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs ml-2 hover:bg-green-700"
                  >
                    Confirmar pago
                  </button>
                )}
              </div>
            </div>
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Franja horaria</label>
                <select 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.timeZone?.id || ""}
                  onChange={(e) => {
                    const selectedTimeZone = timeZones.find(tz => tz.id === Number(e.target.value));
                    handleInputChange('timeZone', selectedTimeZone);
                  }}
                  disabled={!canEdit || readOnly}
                >
                  <option value="">Seleccionar franja horaria</option>
                  {timeZones.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de entrega</label>
              <select 
                className={`w-full border rounded px-2 py-1 text-black ${canEdit ? 'bg-white' : 'bg-gray-100'}`}
                value={editedOrder?.shipmentType || tn.gateway || ShipmentTypeEnum.SHIP}
                onChange={(e) => handleInputChange('shipmentType', e.target.value)}
                disabled={!canEdit || readOnly}
              >
                {Object.values(ShipmentTypeEnum).map((type) => (
                  <option key={type} value={type}>
                    {getFormattedDeliveryType(type)}
                  </option>
                ))}
              </select>
            </div>
            {order.shipmentType === 'ship' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Zona de entrega</label>
                <select 
                  className={`w-full border rounded px-2 py-1 text-black ${canEdit ? 'bg-white' : 'bg-gray-100'}`}
                  value={editedOrder?.zone?.id || ""}
                  onChange={(e) => {
                    const selectedZone = zones.find(z => z.id === Number(e.target.value));
                    handleInputChange('zone', selectedZone);
                  }}
                  disabled={!canEdit || readOnly}
                >
                  <option value="">Seleccionar zona</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} - ${zone.price}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs mb-1"
              onClick={() => window.open(order.completionLink, '_blank')}
            >
              URL enviada
            </button>
          </div>

          {/* Campos específicos según estado */}
          {order.localStatus === 'finished' && order.shipmentDeliveredEvidence && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-green-900 mb-1">Evidencia de entrega</h3>
                  <p className="text-xs text-green-700">El pedido fue entregado exitosamente</p>
                </div>
                <button
                  onClick={() => setShowEvidence(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Ver evidencia
                </button>
              </div>
            </div>
          )}

          {order.localStatus === 'returned' && 
           (order.shipmentFailedMotive || order.shipmentFailedReason || order.shipmentFailedDetails || order.shipmentFailedEvidence) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-900 mb-3">Detalles de devolución</h3>
              <div className="grid grid-cols-2 gap-4">
                {order.shipmentFailedMotive && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Motivo</label>
                    <input 
                      className="w-full border rounded px-2 py-1 text-black bg-gray-100" 
                      value={order.shipmentFailedMotive} 
                      disabled 
                    />
                  </div>
                )}
                {order.shipmentFailedReason && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Razón</label>
                    <input 
                      className="w-full border rounded px-2 py-1 text-black bg-gray-100" 
                      value={order.shipmentFailedReason} 
                      disabled 
                    />
                  </div>
                )}
                {order.shipmentFailedDetails && (
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Detalles</label>
                    <textarea 
                      className="w-full border rounded px-2 py-1 text-black bg-gray-100 min-h-[60px]" 
                      value={order.shipmentFailedDetails} 
                      disabled 
                    />
                  </div>
                )}
                {order.shipmentFailedEvidence && (
                  <div className="col-span-2">
                    <button
                      onClick={() => setShowEvidence(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Ver evidencia de fallo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full text-sm border-t border-b">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-3">Cantidad</th>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3">Precio</th>
                  <th className="py-2 px-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-t text-gray-500">
                    <td className="py-2 px-3 align-top">{p.quantity}</td>
                    <td className="py-2 px-3 align-top">
                      {p.name}
                      <div className="text-xs text-gray-400">{p.sku || p.product_id}</div>
                    </td>
                    <td className="py-2 px-3 align-top">{formatMoney(p.price)}</td>
                    <td className="py-2 px-3 align-top">{formatMoney(Number(p.price) * p.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            {/* Administrative Total */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Administrativo</h3>
              <div className="space-y-1">
                {editedOrder?.kg !== undefined && editedOrder?.kg !== null && (
                  <div className="text-gray-700 mb-2">
                    Peso total <span className="ml-2 font-bold">{editedOrder.kg} kg</span>
                  </div>
                )}
                <div className="text-gray-700">
                  Subtotal productos <span className="ml-2 font-bold">{formatMoney(editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0)}</span>
                </div>
                {editedOrder.shipmentType === 'ship' && (
                  <div className="text-gray-700">
                    Costo de envío <span className="ml-2 font-bold">{formatMoney(editedOrder.zone?.price || 0)}</span>
                  </div>
                )}
                {editedOrder.isClosedNeighborhood && (
                  <div className="text-gray-700">
                    Adicional barrio cerrado <span className="ml-2 font-bold">{formatMoney(1000)}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 text-lg font-bold text-gray-800">
                  Total Administrativo <span className="ml-4 text-purple-700">{formatMoney(
                    (editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0) +
                    (editedOrder.shipmentType === 'ship' ? (editedOrder.zone?.price || 0) : 0) +
                    (editedOrder.isClosedNeighborhood ? 1000 : 0) -
                    (editedOrder.paymentType === PaymentTypeEnum.EFFECTIVE ? (editedOrder.TNOrder?.discount || 0) : 0)
                  )}</span>
                </div>
              </div>
            </div>

            {/* Client Total */}
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Cliente</h3>
              <div className="space-y-1">
                <div className="text-gray-700">
                  Subtotal productos <span className="ml-2 font-bold">{formatMoney(editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0)}</span>
                </div>
                {editedOrder.shipmentType === 'ship' && (
                  (() => {
                    const productsSubtotal = editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0;
                    if (productsSubtotal < 80000) {
                      return (
                        <div className="text-gray-700">
                          Costo de envío <span className="ml-2 font-bold">{formatMoney(editedOrder.zone?.price || 0)}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-gray-700">
                          Costo de envío <span className="ml-2 font-bold text-green-600">Gratis (Compra mayor a $80,000)</span>
                        </div>
                      );
                    }
                  })()
                )}
                {(() => {
                  const paymentType = editedOrder.paymentType;
                  const isPagoNube = paymentType === PaymentTypeEnum.PAGO_NUBE || 
                                     paymentType === 'pagonube' || 
                                     paymentType === 'tarjeta' || 
                                     paymentType === 'card';
                  const isEffective = paymentType === PaymentTypeEnum.EFFECTIVE || paymentType === 'effective';
                  const isTransfer = paymentType === PaymentTypeEnum.TRANSFER || paymentType === 'transfer';
                  
                  // Solo mostrar descuento si no es PagoNube
                  if (isPagoNube) return null;
                  
                  const productsSubtotal = editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0;
                  const shippingCost = productsSubtotal < 80000 ? (editedOrder.zone?.price || 0) : 0;
                  const totalBeforeDiscount = productsSubtotal + shippingCost;
                  
                  let discount = 0;
                  let discountLabel = "";
                  
                  if (isEffective) {
                    discount = Math.round(totalBeforeDiscount * 0.10); // 10% para efectivo
                    discountLabel = "Descuento por efectivo (10%)";
                  } else if (isTransfer) {
                    discount = Math.round(totalBeforeDiscount * 0.05); // 5% para transferencia
                    discountLabel = "Descuento por transferencia (5%)";
                  }
                  
                  if (discount > 0) {
                    return (
                      <div className="text-gray-700">
                        {discountLabel} <span className="ml-2 font-bold text-red-600">-{formatMoney(discount)}</span>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
                <div className="border-t pt-2 mt-2 text-lg font-bold text-gray-800">
                  Total Cliente <span className="ml-4 text-purple-700">{formatMoney(
                    (() => {
                      const productsSubtotal = editedOrder.TNOrder?.products?.reduce((total: number, product: any) => total + (Number(product.price) * product.quantity), 0) || 0;
                      const shippingCost = editedOrder.shipmentType === 'ship' ? (productsSubtotal < 80000 ? (editedOrder.zone?.price || 0) : 0) : 0;
                      const totalBeforeDiscount = productsSubtotal + shippingCost;
                      
                      // Calcular descuento: 10% para efectivo, 5% para transferencia, 0% para PagoNube
                      const paymentType = editedOrder.paymentType;
                      const isPagoNube = paymentType === PaymentTypeEnum.PAGO_NUBE || 
                                         paymentType === 'pagonube' || 
                                         paymentType === 'tarjeta' || 
                                         paymentType === 'card';
                      const isEffective = paymentType === PaymentTypeEnum.EFFECTIVE || paymentType === 'effective';
                      const isTransfer = paymentType === PaymentTypeEnum.TRANSFER || paymentType === 'transfer';
                      
                      let discount = 0;
                      if (isEffective) {
                        discount = Math.round(totalBeforeDiscount * 0.10); // 10% para efectivo
                      } else if (isTransfer) {
                        discount = Math.round(totalBeforeDiscount * 0.05); // 5% para transferencia
                      }
                      // PagoNube no tiene descuento (discount = 0)
                      
                      return totalBeforeDiscount - discount;
                    })()
                  )}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Dialog */}
      {showVoucher && payment.voucher && (
        <VoucherDialog 
          voucherUrl={payment.voucher} 
          onClose={() => setShowVoucher(false)} 
        />
      )}

      {showMap && (
        <MapDialog
          open={showMap}
          onClose={() => setShowMap(false)}
          finalDestiny={order.finalDestiny}
          onSaved={handleMapSave}
        />
      )}

      {showPaymentConfirmation && (() => {
        const isTransfer = editedOrder?.paymentType === PaymentTypeEnum.TRANSFER || editedOrder?.paymentType === 'transfer';
        const paymentTypeName = isTransfer ? "Transferencia" : "Efectivo";
        return (
          <div 
            className="fixed inset-0 z-[2100] flex items-center justify-center overflow-y-auto py-8" 
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowPaymentConfirmation(false)}
          >
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 min-w-[500px] max-w-2xl w-full relative my-auto mx-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <button 
                  onClick={() => setShowPaymentConfirmation(false)} 
                  className="absolute top-4 right-4 text-3xl text-purple-600 hover:text-purple-800"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-purple-600 mb-2">
                  Confirmar pago en {paymentTypeName.toLowerCase()}
                </h2>
                <div className="w-16 h-1 bg-purple-600 mx-auto rounded-full"></div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="text-6xl mb-4">{isTransfer ? "💳" : "💰"}</div>
                  <p className="text-lg text-gray-700 mb-4">
                    ¿Estás seguro de que quieres confirmar el pago en {paymentTypeName.toLowerCase()}?
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Monto a confirmar:</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatMoney(calculateClientTotal())}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Esta acción creará un registro de pago y actualizará el estado del pedido.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowPaymentConfirmation(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirmingPayment}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isConfirmingPayment ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirmando...
                    </>
                  ) : (
                    'Confirmar pago'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Evidence Dialog */}
      {showEvidence && order && (
        <EvidenceDialog
          isOpen={showEvidence}
          onClose={() => setShowEvidence(false)}
          imageUrl={
            order.localStatus === 'finished' 
              ? order.shipmentDeliveredEvidence 
              : order.shipmentFailedEvidence
          }
          title={
            order.localStatus === 'finished' 
              ? 'Evidencia de entrega' 
              : 'Evidencia de devolución'
          }
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      {showCancelConfirmation && (
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center overflow-y-auto py-8" 
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => {
            setShowCancelConfirmation(false);
            setCancelMotive("");
            setCancelDetails("");
          }}
        >
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 min-w-[500px] max-w-2xl w-full relative my-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <button 
                onClick={() => {
                  setShowCancelConfirmation(false);
                  setCancelMotive("");
                  setCancelDetails("");
                }} 
                className="absolute top-4 right-4 text-3xl text-red-600 hover:text-red-800"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Cancelar orden
              </h2>
              <div className="w-16 h-1 bg-red-600 mx-auto rounded-full"></div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <div className="mb-6">
                <div className="text-6xl mb-4 text-center">⚠️</div>
                <p className="text-lg text-gray-700 mb-4 text-center">
                  ¿Estás seguro de que quieres cancelar esta orden?
                </p>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              {/* Motivo de cancelación */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Motivo de cancelación <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancelMotive}
                  onChange={(e) => setCancelMotive(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Seleccione un motivo</option>
                  {CANCEL_MOTIVES.map((motive) => (
                    <option key={motive} value={motive}>
                      {motive}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalles (opcional) */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Detalles (opcional)
                </label>
                <textarea
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Agregue detalles adicionales sobre la cancelación"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowCancelConfirmation(false);
                  setCancelMotive("");
                  setCancelDetails("");
                }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={isCanceling}
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCanceling || !cancelMotive}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cancelando...
                  </>
                ) : (
                  'Confirmar cancelación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(dialogContent, document.body) : null;
}
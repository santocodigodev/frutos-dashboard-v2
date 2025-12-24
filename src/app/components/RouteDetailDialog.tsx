"use client";

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { FiX, FiMoreVertical } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import LiveMapDialog from './LiveMapDialog';
import { getApiUrl } from '../utils/api';

interface RouteDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  route: any;
  onRouteUpdated?: () => void;
  onShowOrderDetail?: (orderNumber: number) => void;
  isActive?: boolean;
  canRemoveOrders?: boolean;
}

export default function RouteDetailDialog({ isOpen, onClose, route, onRouteUpdated, onShowOrderDetail, isActive = true, canRemoveOrders = true }: RouteDetailDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isRemovingOrder, setIsRemovingOrder] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showLiveMap, setShowLiveMap] = useState(false);
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedOrderId !== null) {
        setSelectedOrderId(null);
      }
    };

    if (selectedOrderId !== null) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedOrderId]);

  if (!route) return null;

  // Check if route is historical
  const isHistorical = route.localStatus === "closed";
  // rendered === true means "Rendida", otherwise "Por rendir"
  const isRendida = isHistorical && route.rendered === true;
  const routeStatus = isHistorical ? (isRendida ? "Rendida" : "Por rendir") : null;

  // Calculate route statistics
  const totalOrders = route.orders?.length || 0;
  const deliveredOrders = route.orders?.filter((order: any) => 
    order.localStatus === 'delivered' || order.shipmentDeliveredEvidence
  ).length || 0;
  const deliveryPercentage = totalOrders > 0 ? (deliveredOrders / totalOrders * 100).toFixed(1) : '0';
  
  const totalCollection = route.orders?.reduce((sum: number, order: any) => {
    // Only include cash payments (effective) in the collection total
    if (order.paymentType === 'effective') {
      return sum + (order.totalToPay || 0);
    }
    return sum;
  }, 0) || 0;
  
  const deliveryEarnings = route.orders?.reduce((sum: number, order: any) => 
    sum + (route.zone?.price || 0), 0) || 0;
  
  const tollsTotal = route.routeTolls?.reduce((sum: number, toll: any) => 
    sum + (toll.price || 0), 0) || 0;
  
  const closedNeighborhoodsCount = route.orders?.filter((order: any) => 
    order.isClosedNeighborhood
  ).length || 0;
  const closedNeighborhoodsCost = closedNeighborhoodsCount * 1000; // Assuming 1000 per closed neighborhood
  
  const totalToPayDelivery = deliveryEarnings + tollsTotal + closedNeighborhoodsCost;
  const totalToSettle = totalCollection - totalToPayDelivery;

  const formatPaymentType = (paymentType: string) => {
    switch (paymentType) {
      case 'effective': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'not_defined': return 'No definido';
      default: return paymentType;
    }
  };

  const formatOrderStatus = (order: any) => {
    // Map order status to Spanish
    const statusMap: { [key: string]: string } = {
      'created': 'Creado',
      'data_completed': 'Datos completados',
      'data_rejected': 'Datos rechazados',
      'pending_route_assignment': 'Pendiente asignación de ruta',
      'pending_assembler_assignment': 'Pendiente asignación de armador',
      'pending_assembly': 'Pendiente armado',
      'pending_delivery_pick_up': 'Pendiente recogida por delivery',
      'pending_pick_up': 'Pendiente recogida',
      'in_route': 'En camino',
      'returned': 'Devuelto',
      'finished': 'Finalizado',
      'canceled': 'Cancelado',
      'confirmed_sales': 'Ventas confirmadas'
    };
    
    // Use localStatus as primary source, only override if there's evidence of delivery failure
    if (order.shipmentFailedEvidence && !order.shipmentDeliveredEvidence) {
      return 'No entregado';
    }
    
    return statusMap[order.localStatus] || 'Estado desconocido';
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('ARS', '$');
  };

  const handleShowOrderDetail = (order: any) => {
    const orderNumber = order.TN_ID || order.TN_Order_number;
    setSelectedOrderId(null); // Close the dropdown menu
    if (onShowOrderDetail) {
      onShowOrderDetail(orderNumber);
    }
  };

  const handleRemoveOrderFromRoute = async (order: any) => {
    if (!route?.id || !order?.id) return;
    
    setIsRemovingOrder(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/${route.id}/remove-order/${order.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
      });

      if (response.ok) {
        // Call the callback to refresh the route data
        if (onRouteUpdated) {
          onRouteUpdated();
        }
        setSelectedOrderId(null); // Close the dropdown menu
        // Refresh the entire page to update sidebar counts
        window.location.reload();
      } else {
        console.error('Error removing order from route');
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error removing order from route:', error);
      // You might want to show a toast notification here
    } finally {
      setIsRemovingOrder(false);
    }
  };

  const handleDropdownToggle = (orderId: number, buttonElement: HTMLButtonElement) => {
    if (!isActive) return; // Ignore clicks when not active
    
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 150 // 150px is min-w-[150px]
      });
      setSelectedOrderId(orderId);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className={`relative z-[50] ${!isActive ? 'pointer-events-none' : ''}`} onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <HeadlessDialog.Title
                      as="h3"
                      className="text-xl font-semibold text-gray-900"
                    >
                      Detalle de la ruta #{route.id.toString().padStart(6, '0')}
                    </HeadlessDialog.Title>
                    {routeStatus && (
                      <div className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        isRendida 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {routeStatus}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!canRemoveOrders && route.localStatus !== "closed" && (
                      <button
                        onClick={(e) => {
                          if (!isActive) return;
                          e.stopPropagation();
                          setShowLiveMap(true);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Ver en vivo
                      </button>
                    )}
                    <button
                      onClick={isActive ? onClose : () => {}}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Orders Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="py-3 px-4 font-medium">N° de Orden</th>
                          <th className="py-3 px-4 font-medium">Dirección</th>
                          <th className="py-3 px-4 font-medium">Ciudad</th>
                          <th className="py-3 px-4 font-medium">Pago</th>
                          <th className="py-3 px-4 font-medium">Precio</th>
                          <th className="py-3 px-4 font-medium">Estado</th>
                          <th className="py-3 px-4 font-medium">Costo de envío</th>
                          <th className="py-3 px-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.orders?.map((order: any, index: number) => (
                          <tr key={order.id} className="border-t border-gray-200">
                            <td className="py-3 px-4 text-gray-700">
                              <div>
                                <div className="font-medium">{index + 1}</div>
                                <div className="text-xs text-gray-500">#{order.TN_Order_number}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {order.finalDestiny?.name?.split(',')[0] || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {order.finalDestiny?.name?.split(',')[1]?.trim() || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {formatPaymentType(order.paymentType)}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {formatCurrency(order.totalToPay || 0)}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {formatOrderStatus(order)}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {formatCurrency(route.zone?.price || 0)}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              <button
                                ref={(el) => { buttonRefs.current[order.id] = el; }}
                                onClick={(e) => {
                                  if (!isActive) return; // Ignore clicks when not active
                                  e.stopPropagation();
                                  if (buttonRefs.current[order.id]) {
                                    handleDropdownToggle(order.id, buttonRefs.current[order.id]!);
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <FiMoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Route Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {isHistorical ? "Pedidos entregados:" : "Pedidos entregados:"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {deliveredOrders} de {totalOrders} ({deliveryPercentage}%)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {isHistorical ? "Recaudación total:" : "Recaudación total:"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(totalCollection)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {isHistorical ? "Ganancia del delivery:" : "Ganancia del delivery:"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(deliveryEarnings)}
                      </span>
                    </div>
                  </div>

                  {/* Additional Costs */}
                  {(tollsTotal > 0 || closedNeighborhoodsCost > 0) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Adicionales:</h4>
                      <div className="space-y-2 text-sm">
                        {tollsTotal > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              • Peajes: {formatCurrency(tollsTotal)} ({route.routeTolls?.length || 0})
                            </span>
                          </div>
                        )}
                        {closedNeighborhoodsCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              • Ingreso a barrios cerrados: {formatCurrency(closedNeighborhoodsCost)} ({closedNeighborhoodsCount})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Final Totals */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-900">
                        {isHistorical ? "Total pagado al delivery:" : "Total a pagar al delivery:"}
                      </span>
                      <span className="text-gray-900">{formatCurrency(totalToPayDelivery)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-900">
                        {isHistorical ? "Total rendido:" : "Total a rendir:"}
                      </span>
                      <span className="text-gray-900">{formatCurrency(totalToSettle)}</span>
                    </div>
                  </div>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>

      {/* Dropdown Menu Portal */}
      {selectedOrderId !== null && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[99999] min-w-[150px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
                                  <button 
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                                    onClick={(e) => {
                                      if (!isActive) return; // Ignore clicks when not active
                                      e.stopPropagation();
                                      const order = route.orders?.find((o: any) => o.id === selectedOrderId);
                                      if (order) {
                                        handleShowOrderDetail(order);
                                      }
                                    }}
                                  >
                                    Detalles
                                  </button>
                                  <button 
                                    className={`w-full text-left px-3 py-2 text-sm last:rounded-b-lg ${
                                      !canRemoveOrders 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                    onClick={(e) => {
                                      if (!isActive || !canRemoveOrders) return; // Ignore clicks when not active or can't remove
                                      e.stopPropagation();
                                      const order = route.orders?.find((o: any) => o.id === selectedOrderId);
                                      if (order) {
                                        handleRemoveOrderFromRoute(order);
                                      }
                                    }}
                                    disabled={isRemovingOrder || !canRemoveOrders}
                                  >
            {isRemovingOrder ? 'Quitando...' : 'Quitar de la ruta'}
          </button>
        </div>,
        document.body
      )}

      {/* Live Map Dialog */}
      <LiveMapDialog 
        isOpen={showLiveMap}
        onClose={() => setShowLiveMap(false)}
        route={route}
      />
    </Transition>
  );
}

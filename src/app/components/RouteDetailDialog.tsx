"use client";

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { FiX, FiMoreVertical, FiUser, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import LiveMapDialog from './LiveMapDialog';
import AssignDriverDialog from './AssignDriverDialog';
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
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
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

  // Initialize edited date and name when route changes
  useEffect(() => {
    if (route?.scheduledDate) {
      const date = new Date(route.scheduledDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setEditedDate(`${year}-${month}-${day}`);
    }
    setEditedName(route?.name ?? '');
  }, [route]);

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
    
    // Siempre mostrar el estado específico de la orden (cancelado, devuelto, etc.)
    if (order.localStatus && statusMap[order.localStatus]) {
      return statusMap[order.localStatus];
    }
    // Solo "No entregado" cuando hay evidencia de fallo y no es un estado terminal conocido
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

  const handleCancelRoute = async () => {
    if (!route?.id || route.localStatus !== "created") return;
    
    setIsCanceling(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/${route.id}/cancel`), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'token': user.token
        },
      });

      if (response.ok) {
        setShowCancelConfirmation(false);
        // Call the callback to refresh the route data
        if (onRouteUpdated) {
          onRouteUpdated();
        }
        onClose(); // Close the dialog
        // Refresh the entire page to update sidebar counts
        window.location.reload();
      } else {
        console.error('Error canceling route');
        alert('Error al cancelar la ruta. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error canceling route:', error);
      alert('Error al cancelar la ruta. Por favor, intenta nuevamente.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleSaveDate = async () => {
    if (!editedDate || !route?.id) return;
    
    setIsSavingDate(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Parse the timezone name to extract time if available
      const timezoneName = route.timeZone?.name || '';
      const timeMatch = timezoneName.match(/^De (\d{1,2}):(\d{2})/);
      
      let scheduledDateTime = editedDate;
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, '0');
        const minutes = timeMatch[2];
        scheduledDateTime = `${editedDate}T${hours}:${minutes}:00Z`;
      } else {
        scheduledDateTime = `${editedDate}T00:00:00Z`;
      }

      const response = await fetch(getApiUrl(`/route/${route.id}`), {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'token': user.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledDate: scheduledDateTime
        })
      });

      if (response.ok) {
        setIsEditingDate(false);
        if (onRouteUpdated) {
          onRouteUpdated();
        }
        // Recargar la página para actualizar el sidebar
        window.location.reload();
      } else {
        console.error('Error updating route date');
        alert('Error al actualizar la fecha de la ruta. Por favor intente nuevamente.');
      }
    } catch (error) {
      console.error('Error updating route date:', error);
      alert('Error al actualizar la fecha de la ruta. Por favor intente nuevamente.');
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleCancelEditDate = () => {
    if (route?.scheduledDate) {
      const date = new Date(route.scheduledDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setEditedDate(`${year}-${month}-${day}`);
    }
    setIsEditingDate(false);
  };

  const handleSaveName = async () => {
    if (!route?.id) return;
    setIsSavingName(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(getApiUrl(`/route/${route.id}`), {
        method: 'PATCH',
        headers: { 'accept': 'application/json', 'token': user.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() || null }),
      });
      if (response.ok) {
        setIsEditingName(false);
        if (onRouteUpdated) onRouteUpdated();
        window.location.reload();
      } else {
        alert('Error al actualizar el nombre de la ruta.');
      }
    } catch (err) {
      console.error('Error updating route name:', err);
      alert('Error al actualizar el nombre de la ruta.');
    } finally {
      setIsSavingName(false);
    }
  };

  const getOrderPhone = (order: any) => {
    const phone = order?.client?.phone || order?.TNOrder?.customer?.phone || order?.customer?.phone || '';
    return String(phone).replace(/\D/g, '').trim() || null;
  };

  const formatPhoneForWhatsApp = (rawPhone: string): string => {
    const digits = String(rawPhone ?? '').replace(/\D/g, '').trim();
    if (!digits) return '';
    if (digits.startsWith('54') && digits.length >= 12) {
      return digits.slice(2);
    }
    return '+' + digits;
  };

  const handleExportWhatsAppNumbers = () => {
    const phones = (route.orders || [])
      .map((o: any) => getOrderPhone(o))
      .filter(Boolean) as string[];
    const formatted = phones.map((p) => formatPhoneForWhatsApp(p));
    const uniq = [...new Set(formatted)];
    const text = uniq.join('\n');
    if (!text) {
      alert('No hay números de teléfono para exportar.');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => alert('Números copiados al portapapeles. Pegá la lista en WhatsApp.'),
      () => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ruta_${route.id}_numeros_whatsapp.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    );
  };

  const escapeCsv = (v: string) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[;\n",]/.test(s) ? `"${s}"` : s;
  };

  const toLatin1Bytes = (s: string): Uint8Array => {
    const out: number[] = [];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      out.push(c <= 0xff ? c : 0x3f);
    }
    return new Uint8Array(out);
  };

  const formatPriceForExcel = (amount: number) => {
    const n = Math.round(Number(amount) || 0);
    const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `$ ${s}`;
  };

  const handleExportExcel = () => {
    const headers = [
      'Franja Horaria',
      'Observaciones del administrador',
      'Kilos',
      'Tipo de pago',
      'Nombre del cliente',
      'Numero de pedido TN',
      'Direccion completa',
      'Telefono del cliente',
      'Precio del delivery',
      'Precio total de la orden',
    ];
    const rows: string[][] = [
      headers,
      ...(route.orders || []).map((order: any) => [
        route.timeZone?.name ?? '',
        order.adminDetails ?? '',
        String(order.kg ?? ''),
        formatPaymentType(order.paymentType ?? ''),
        order.client?.fullName ?? order.client?.name ?? '',
        String(order.TN_Order_number ?? order.TN_ID ?? ''),
        order.finalDestiny?.name ?? '',
        order.client?.phone ?? '',
        formatPriceForExcel(Number(route.zone?.price ?? 0)),
        formatPriceForExcel(Number(order.totalToPay ?? 0)),
      ]),
    ];
    const csv = rows.map((r) => r.map(escapeCsv).join(';')).join('\n');
    const bytes = toLatin1Bytes(csv);
    const blob = new Blob([new Uint8Array(bytes)], { type: 'text/csv;charset=ISO-8859-1' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruta_${route.id.toString().padStart(6, '0')}_detalle.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-[50]" onClose={() => {}}>
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
                      {route.name ? `Detalle de la ruta: ${route.name} (#${route.id.toString().padStart(6, '0')})` : `Detalle de la ruta #${route.id.toString().padStart(6, '0')}`}
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
                    {route.localStatus === "created" && (
                      <>
                        <button
                          onClick={(e) => {
                            if (!isActive) return;
                            e.stopPropagation();
                            setShowAssignDriver(true);
                          }}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiUser className="h-4 w-4" />
                          {route.delivery ? 'Reasignar Repartidor' : 'Asignar Repartidor'}
                        </button>
                        <button
                          onClick={(e) => {
                            if (!isActive) return;
                            e.stopPropagation();
                            setShowCancelConfirmation(true);
                          }}
                          className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancelar Ruta
                        </button>
                      </>
                    )}
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
                    <span className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportWhatsAppNumbers(); }}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        title="Copiar números para WhatsApp"
                      >
                        <FiDownload className="h-4 w-4" />
                        Números WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportExcel(); }}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        title="Exportar detalle de la ruta a Excel"
                      >
                        <FiDownload className="h-4 w-4" />
                        Exportar Excel
                      </button>
                    </span>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Route Info - Name and Date Editing */}
                  {route.localStatus === "created" && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la ruta</label>
                        {isEditingName ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-[200px]"
                              placeholder="Ej: Ruta Palermo mañana"
                              disabled={isSavingName}
                            />
                            <button type="button" onClick={handleSaveName} disabled={isSavingName} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {isSavingName ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" onClick={() => { setEditedName(route?.name ?? ''); setIsEditingName(false); }} disabled={isSavingName} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{route.name || 'Sin nombre'}</span>
                            <button type="button" onClick={() => setIsEditingName(true)} className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                              Editar nombre
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha programada
                          </label>
                          {isEditingDate ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={editedDate}
                                onChange={(e) => setEditedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isSavingDate}
                              />
                              <button
                                onClick={handleSaveDate}
                                disabled={isSavingDate}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingDate ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => {
                                  if (route?.scheduledDate) {
                                    const date = new Date(route.scheduledDate);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setEditedDate(`${year}-${month}-${day}`);
                                  }
                                  setIsEditingDate(false);
                                }}
                                disabled={isSavingDate}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-medium">
                                {route.scheduledDate ? new Date(route.scheduledDate).toLocaleDateString('es-AR') : 'No definida'}
                              </span>
                              <button
                                onClick={() => setIsEditingDate(true)}
                                className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Editar fecha
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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

      {/* Assign Driver Dialog */}
      <AssignDriverDialog
        isOpen={showAssignDriver}
        onClose={() => setShowAssignDriver(false)}
        routeId={route.id}
        currentDriver={route.delivery}
        onDriverAssigned={() => {
          if (onRouteUpdated) {
            onRouteUpdated();
          }
        }}
      />

      {/* Cancel Route Confirmation Dialog */}
      {showCancelConfirmation && (
        <Transition appear show={showCancelConfirmation} as={Fragment}>
          <HeadlessDialog as="div" className="relative z-[100]" onClose={() => setShowCancelConfirmation(false)}>
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
                  <HeadlessDialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <FiAlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <HeadlessDialog.Title
                          as="h3"
                          className="text-lg font-semibold text-gray-900"
                        >
                          Cancelar Ruta
                        </HeadlessDialog.Title>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        ¿Estás seguro de que deseas cancelar la ruta <strong>#{route.id.toString().padStart(6, '0')}</strong>?
                      </p>
                      <p className="text-sm text-red-600 font-medium">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirmation(false)}
                        disabled={isCanceling}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        No, mantener
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRoute}
                        disabled={isCanceling}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                          'Sí, cancelar ruta'
                        )}
                      </button>
                    </div>
                  </HeadlessDialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </HeadlessDialog>
        </Transition>
      )}
    </Transition>
  );
}

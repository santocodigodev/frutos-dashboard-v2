"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { getApiUrl, getSocketConfig } from '@/app/utils/api';
import Pagination from '@/app/components/Pagination';

interface Sucursal {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  name: string;
  description: string;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  identification: string;
}

interface Caja {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  name: string;
  description: string;
  status: string;
  isConnected: boolean;
  hardwareId: string;
  hardwareName: string;
  balance: number;
  isOnline: boolean;
  admin: Admin | null;
  sucursal: Sucursal;
}

interface CashBoxStatusChange {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  action: string;
  observations: string;
  funds: string;
  difference: number;
  cashBox: Caja;
  admin: Admin;
}

interface Product {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  TN_ID: string;
  TN_Variant_ID: string;
  quantity: number;
}

interface Client {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  fullName: string;
  phone: string;
  email: string;
  DNI: string;
}

interface Discount {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  title: string;
  discountPercentage: number;
  isActive: boolean;
}

interface Voucher {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  voucherType: string;
  voucher: string;
  isSameClient: boolean;
  client: Client;
}

interface Payment {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  paymentType: string;
  totalPaid: number;
  discount: string;
}

interface CashTransaction {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  productQuantity: string;
  totalPrice: string;
  subTotalPrice: string;
  sendResumeEmail: boolean;
  sendResumeWhatsApp: boolean;
  requireVoucher: boolean;
  cashBox: Caja;
  client: Client | null;
  products: Product[];
  discounts: Discount | null;
  vouchers: Voucher[];
  payments: Payment[];
  admin: Admin;
}

interface CashChangeBalance {
  id: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  action: string;
  amount: number;
  paymentType: string;
  observations: string;
  isCashBoxClosingWithdrawal: boolean;
  cashBox: Caja;
  admin: Admin;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export default function CajaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cajaId = params.id as string;

  const [caja, setCaja] = useState<Caja | null>(null);
  const [statusChanges, setStatusChanges] = useState<CashBoxStatusChange[]>([]);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [changeBalances, setChangeBalances] = useState<CashChangeBalance[]>([]);
  
  const [statusChangesTotal, setStatusChangesTotal] = useState(0);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [changeBalancesTotal, setChangeBalancesTotal] = useState(0);
  
  const [statusChangesPage, setStatusChangesPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [changeBalancesPage, setChangeBalancesPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeCaja, setRealTimeCaja] = useState<Caja | null>(null);

  const fetchCaja = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        return;
      }

      const response = await fetch(getApiUrl(`/cash-box/${cajaId}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching caja');
      const data = await response.json();
      setCaja(data);
    } catch (error) {
      toast.error('Error al cargar los datos de la caja');
    }
  };

  const fetchStatusChanges = async (page: number = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) return;

      const response = await fetch(getApiUrl(`/cash-box-status-change/paginated?page=${page}&limit=10&cashBoxId=${cajaId}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching status changes');
      const data: PaginatedResponse<CashBoxStatusChange> = await response.json();
      setStatusChanges(data.data);
      setStatusChangesTotal(data.total);
    } catch (error) {
      console.error('Error fetching status changes:', error);
    }
  };

  const fetchTransactions = async (page: number = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) return;

      const response = await fetch(getApiUrl(`/cash-transaction/paginated?page=${page}&limit=10&cashBoxId=${cajaId}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching transactions');
      const data: PaginatedResponse<CashTransaction> = await response.json();
      setTransactions(data.data);
      setTransactionsTotal(data.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchChangeBalances = async (page: number = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) return;

      const response = await fetch(getApiUrl(`/cash-change-balance/paginated?page=${page}&limit=10&cashBoxId=${cajaId}`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching change balances');
      const data: PaginatedResponse<CashChangeBalance> = await response.json();
      setChangeBalances(data.data);
      setChangeBalancesTotal(data.total);
    } catch (error) {
      console.error('Error fetching change balances:', error);
    }
  };

  useEffect(() => {
    if (cajaId) {
      Promise.all([
        fetchCaja(),
        fetchStatusChanges(1),
        fetchTransactions(1),
        fetchChangeBalances(1)
      ]).finally(() => setIsLoading(false));
    }
  }, [cajaId]);

  // WebSocket connection
  useEffect(() => {
    const socketConfig = getSocketConfig();
    const newSocket = io(socketConfig.url, {
      path: socketConfig.path,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      newSocket.emit('join-admin-room', {});
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    newSocket.on('cash-box-status-changed', (data: any) => {
      console.log('Cash box status changed:', data);
      if (data.cashBoxId === parseInt(cajaId)) {
        setRealTimeCaja(prev => prev ? {
          ...prev,
          isOnline: data.isOnline,
          isConnected: data.isConnected,
          status: data.status || prev.status
        } : null);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [cajaId]);

  const currentCaja = realTimeCaja || caja;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const formatCurrency = (amount: number | string) => {
    return `$${Number(amount).toLocaleString()}`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'money_in': return 'bg-blue-100 text-blue-800';
      case 'money_out': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'open': return 'Abierta';
      case 'closed': return 'Cerrada';
      case 'money_in': return 'Ingreso';
      case 'money_out': return 'Egreso';
      default: return action;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'effective': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'qr': return 'QR';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Cargando detalles de la caja...</p>
        </div>
      </div>
    );
  }

  if (!currentCaja) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Caja no encontrada</p>
          <button
            onClick={() => router.push('/configuracion/cajas')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/configuracion/cajas')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </button>
              <div className="ml-4">
                <h1 className="text-2xl font-semibold text-gray-900">{currentCaja.name}</h1>
                <p className="text-sm text-gray-500">{currentCaja.sucursal.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </div>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentCaja.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${currentCaja.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                {currentCaja.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        {/* Caja Info */}
        <div className="bg-white rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Información de la Caja</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Información General</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-900"><strong>Nombre:</strong> {currentCaja.name}</p>
                  <p className="text-sm text-gray-900"><strong>Descripción:</strong> {currentCaja.description}</p>
                  <p className="text-sm text-gray-900"><strong>Sucursal:</strong> {currentCaja.sucursal.name}</p>
                  <p className="text-sm text-gray-900"><strong>Balance:</strong> {formatCurrency(currentCaja.balance)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estado y Conexión</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-900">
                    <strong>Estado:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentCaja.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentCaja.status === 'open' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-900">
                    <strong>Conexión:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentCaja.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentCaja.isConnected ? 'Conectada' : 'Desconectada'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-900"><strong>Hardware ID:</strong> {currentCaja.hardwareId}</p>
                  <p className="text-sm text-gray-900"><strong>Hardware Name:</strong> {currentCaja.hardwareName}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cajero Asignado</h3>
                <div className="mt-2">
                  {currentCaja.admin ? (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-900"><strong>Nombre:</strong> {currentCaja.admin.name}</p>
                      <p className="text-sm text-gray-900"><strong>Email:</strong> {currentCaja.admin.email}</p>
                      <p className="text-sm text-gray-900"><strong>Rol:</strong> {currentCaja.admin.role}</p>
                      <p className="text-sm text-gray-900"><strong>Identificación:</strong> {currentCaja.admin.identification}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin cajero asignado</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Changes */}
        <div className="bg-white rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Cambios de Estado</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fondos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusChanges.map((change) => (
                  <tr key={change.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(change.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(change.action)}`}>
                        {getActionLabel(change.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(change.funds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`${change.difference !== 0 ? 'text-red-600 font-bold text-base' : 'text-green-600'}`}>
                        {formatCurrency(change.difference)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.admin.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {change.observations || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={statusChangesPage}
            totalPages={Math.ceil(statusChangesTotal / 10)}
            total={statusChangesTotal}
            onPageChange={(page) => {
              setStatusChangesPage(page);
              fetchStatusChanges(page);
            }}
          />
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Transacciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cajero
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.client ? transaction.client.fullName : 'Cliente anónimo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.productQuantity} productos
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.admin.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={transactionsPage}
            totalPages={Math.ceil(transactionsTotal / 10)}
            total={transactionsTotal}
            onPageChange={(page) => {
              setTransactionsPage(page);
              fetchTransactions(page);
            }}
          />
        </div>

        {/* Change Balances */}
        <div className="bg-white rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Transacciones internas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {changeBalances.map((change) => (
                  <tr key={change.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(change.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(change.action)}`}>
                        {getActionLabel(change.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(change.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPaymentTypeLabel(change.paymentType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {change.admin.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {change.observations || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={changeBalancesPage}
            totalPages={Math.ceil(changeBalancesTotal / 10)}
            total={changeBalancesTotal}
            onPageChange={(page) => {
              setChangeBalancesPage(page);
              fetchChangeBalances(page);
            }}
          />
        </div>
      </div>
    </div>
  );
}

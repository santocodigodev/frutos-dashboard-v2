"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiEye } from 'react-icons/fi';
import Dialog from '@/app/components/Dialog';
import Pagination from '@/app/components/Pagination';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { getApiUrl, getSocketConfig } from '@/app/utils/api';

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

interface CajaFormData {
  name: string;
  description: string;
  balance: number;
  sucursal: number;
  admin?: number;
  isOnline?: boolean;
}

interface PaginatedResponse {
  data: Caja[];
  total: number;
}

interface SucursalResponse {
  data: Sucursal[];
  total: number;
}

interface AdminResponse {
  data: Admin[];
  total: number;
}

export default function CajasPage() {
  const router = useRouter();
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCajas, setOnlineCajas] = useState<Caja[]>([]);

  const { register, handleSubmit, reset, formState: { errors }, setValue, control } = useForm<CajaFormData>({
    defaultValues: {
      name: "",
      description: "",
      balance: 0,
      sucursal: 0,
      admin: undefined,
      isOnline: false
    }
  });

  const fetchCajas = async (page: number = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        console.error('No user token found');
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      const response = await fetch(getApiUrl(`/cash-box/paginated?page=${page}&limit=10`), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching cajas');
      const data: PaginatedResponse = await response.json();
      setCajas(data.data);
      setTotal(data.total);
    } catch (error) {
      toast.error('Error al cargar las cajas');
    }
  };

  const fetchSucursales = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) return;

      const response = await fetch(getApiUrl('/sucursal/paginated?page=1&limit=100'), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching sucursales');
      const data: SucursalResponse = await response.json();
      setSucursales(data.data);
    } catch (error) {
      console.error('Error fetching sucursales:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) return;

      const response = await fetch(getApiUrl('/admin/paginated?page=1&limit=100'), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      if (!response.ok) throw new Error('Error fetching admins');
      const data: AdminResponse = await response.json();
      setAdmins(data.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  useEffect(() => {
    fetchCajas(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchSucursales();
    fetchAdmins();
  }, []);

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

    newSocket.on('online-cash-boxes', (data: Caja[]) => {
      console.log('Online cash boxes received:', data);
      setOnlineCajas(data);
    });

    newSocket.on('cash-box-status-changed', (data: any) => {
      console.log('Cash box status changed:', data);
      // Update the specific caja in the list
      setCajas(prev => prev.map(caja => 
        caja.id === data.cashBoxId 
          ? { ...caja, isOnline: data.isOnline, isConnected: data.isConnected }
          : caja
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const onSubmit = async (data: CajaFormData) => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      const url = editingCaja 
        ? getApiUrl(`/cash-box/${editingCaja.id}`)
        : getApiUrl('/cash-box');
      
      const payload = editingCaja 
        ? { ...data, isOnline: data.isOnline }
        : { name: data.name, description: data.description, balance: data.balance, sucursal: data.sucursal };
      
      const response = await fetch(url, {
        method: editingCaja ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'token': user.token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error saving caja');
      
      toast.success(editingCaja ? 'Caja actualizada' : 'Caja creada');
      setIsDialogOpen(false);
      fetchCajas(currentPage);
    } catch (error) {
      toast.error('Error al guardar la caja');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (caja: Caja) => {
    setEditingCaja(caja);
    setValue('name', caja.name);
    setValue('description', caja.description);
    setValue('balance', caja.balance);
    setValue('sucursal', caja.sucursal.id);
    setValue('admin', caja.admin?.id);
    setValue('isOnline', caja.isOnline);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (caja: Caja) => {
    router.push(`/configuracion/cajas/${caja.id}`);
  };

  const openNewCajaDialog = () => {
    setEditingCaja(null);
    reset();
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(total / 10);
  const onlineCount = onlineCajas.length;
  const connectedCount = cajas.filter(caja => caja.isConnected).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cajas Registradoras</h1>
        <button
          onClick={openNewCajaDialog}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          Nueva Caja
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cajas</dt>
                  <dd className="text-lg font-medium text-gray-900">{total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🟢</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cajas Online</dt>
                  <dd className="text-lg font-medium text-gray-900">{onlineCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔗</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cajas Conectadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{connectedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
                  <span className="text-white font-bold text-sm">{isConnected ? '🟢' : '🔴'}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Conexión WebSocket</dt>
                  <dd className="text-lg font-medium text-gray-900">{isConnected ? 'Conectado' : 'Desconectado'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conexión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cajero
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cajas.map((caja) => (
                <tr key={caja.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caja.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caja.sucursal.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      caja.status === 'open' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {caja.status === 'open' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      caja.isOnline 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caja.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caja.admin ? caja.admin.name : 'Sin cajero'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(caja)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(caja)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Editar"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCaja(null);
          reset();
        }}
        title={editingCaja ? "Editar Caja" : "Nueva Caja"}
        isLoading={isLoading}
        onSave={handleSubmit(onSubmit)}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="space-y-6">
              <div className="relative group">
                <label htmlFor="name" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Nombre de la caja
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { required: 'El nombre es requerido' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-400"
                    placeholder="Ej: Caja Principal"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <label htmlFor="description" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Descripción
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <textarea
                    id="description"
                    rows={3}
                    {...register('description', { required: 'La descripción es requerida' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-400 resize-none"
                    placeholder="Descripción de la caja..."
                  />
                </div>
                {errors.description && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <label htmlFor="balance" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Balance inicial
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-400 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    id="balance"
                    min="0"
                    {...register('balance', { 
                      required: 'El balance es requerido',
                      min: { value: 0, message: 'El balance debe ser mayor o igual a 0' }
                    })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-400"
                    placeholder="0"
                  />
                </div>
                {errors.balance && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.balance.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <label htmlFor="sucursal" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Sucursal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <select
                    id="sucursal"
                    {...register('sucursal', { required: 'La sucursal es requerida' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Seleccionar sucursal</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.sucursal && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.sucursal.message}
                  </p>
                )}
              </div>

            </div>
          </div>
        </form>
      </Dialog>

    </div>
  );
}

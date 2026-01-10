"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import Dialog from '@/app/components/Dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/app/utils/api';

interface CashBox {
  id: number;
  name: string;
  description: string;
  status: string;
  isConnected: boolean;
  hardwareId: string;
  hardwareName: string;
  balance: number;
  isOnline: boolean;
}

interface Sucursal {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  cashBoxes: CashBox[];
}

interface SucursalFormData {
  name: string;
  description: string;
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<SucursalFormData>();

  const fetchSucursales = async () => {
    try {
      const response = await fetch(getApiUrl('/sucursal/paginated?page=1&limit=100'), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error fetching sucursales');
      const data = await response.json();
      setSucursales(data.data || []);
    } catch (error) {
      toast.error('Error al cargar las sucursales');
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const onSubmit = async (data: SucursalFormData) => {
    setIsLoading(true);
    try {
      const url = editingSucursal 
        ? getApiUrl(`/sucursal/${editingSucursal.id}`)
        : getApiUrl('/sucursal');
      
      const response = await fetch(url, {
        method: editingSucursal ? 'PATCH' : 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error saving sucursal');
      
      toast.success(editingSucursal ? 'Sucursal actualizada' : 'Sucursal creada');
      setIsDialogOpen(false);
      fetchSucursales();
    } catch (error) {
      toast.error('Error al guardar la sucursal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setValue('name', sucursal.name);
    setValue('description', sucursal.description);
    setIsDialogOpen(true);
  };

  const openNewSucursalDialog = () => {
    setEditingSucursal(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sucursales</h1>
        <button
          onClick={openNewSucursalDialog}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          Nueva Sucursal
        </button>
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
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cajas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sucursales.map((sucursal) => (
                <tr key={sucursal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sucursal.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {sucursal.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sucursal.cashBoxes?.length || 0} caja(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(sucursal)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingSucursal(null);
          reset();
        }}
        title={editingSucursal ? "Editar Sucursal" : "Nueva Sucursal"}
        isLoading={isLoading}
        onSave={handleSubmit(onSubmit)}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="space-y-6">
              <div className="relative group">
                <label htmlFor="name" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Nombre de la sucursal
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="Ej: Sucursal Norte"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="Descripción de la sucursal"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

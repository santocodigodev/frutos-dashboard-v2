"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import Dialog from '@/app/components/Dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/app/utils/api';

interface Discount {
  id: number;
  title: string;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface DiscountFormData {
  title: string;
  discountPercentage: number;
  isActive: boolean;
}

export default function DescuentosPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<DiscountFormData>({
    defaultValues: {
      isActive: true
    }
  });

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(getApiUrl('/cash-discount?limit=100&page=1'), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error fetching discounts');
      const data = await response.json();
      setDiscounts(data.data || []);
    } catch (error) {
      toast.error('Error al cargar los descuentos');
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const onSubmit = async (data: DiscountFormData) => {
    setIsLoading(true);
    try {
      const url = editingDiscount 
        ? getApiUrl(`/cash-discount/${editingDiscount.id}`)
        : getApiUrl('/cash-discount');
      
      const response = await fetch(url, {
        method: editingDiscount ? 'PATCH' : 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error saving discount');
      
      toast.success(editingDiscount ? 'Descuento actualizado' : 'Descuento creado');
      setIsDialogOpen(false);
      fetchDiscounts();
    } catch (error) {
      toast.error('Error al guardar el descuento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setValue('title', discount.title);
    setValue('discountPercentage', discount.discountPercentage);
    setValue('isActive', discount.isActive);
    setIsDialogOpen(true);
  };

  const openNewDiscountDialog = () => {
    setEditingDiscount(null);
    reset({ isActive: true });
    setIsDialogOpen(true);
  };

  const isActive = watch('isActive');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Descuentos</h1>
        <button
          onClick={openNewDiscountDialog}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          Nuevo Descuento
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.discountPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      discount.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {discount.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(discount)}
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
          setEditingDiscount(null);
          reset({ isActive: true });
        }}
        title={editingDiscount ? "Editar Descuento" : "Nuevo Descuento"}
        isLoading={isLoading}
        onSave={handleSubmit(onSubmit)}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="space-y-6">
              <div className="relative group">
                <label htmlFor="title" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Título del descuento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: 'El título es requerido' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="Ej: Descuento de empleados"
                  />
                </div>
                {errors.title && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="relative group">
                <label htmlFor="discountPercentage" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Porcentaje de descuento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-400 font-medium">%</span>
                  </div>
                  <input
                    type="number"
                    id="discountPercentage"
                    step="0.1"
                    {...register('discountPercentage', { 
                      required: 'El porcentaje es requerido',
                      min: { value: 0, message: 'El porcentaje debe ser mayor o igual a 0' },
                      max: { value: 100, message: 'El porcentaje debe ser menor o igual a 100' }
                    })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="0"
                  />
                </div>
                {errors.discountPercentage && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.discountPercentage.message}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-purple-900">
                  Descuento activo
                </label>
              </div>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

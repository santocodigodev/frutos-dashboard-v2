"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import Dialog from '@/app/components/Dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/app/utils/api';

interface Zone {
  id: number;
  name: string;
  price: number;
}

interface ZoneFormData {
  name: string;
  price: number;
}

export default function ZonasPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ZoneFormData>();

  const fetchZones = async () => {
    try {
      const response = await fetch(getApiUrl('/zone'), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error fetching zones');
      const data = await response.json();
      setZones(data);
    } catch (error) {
      toast.error('Error al cargar las zonas');
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const onSubmit = async (data: ZoneFormData) => {
    setIsLoading(true);
    try {
      const url = editingZone 
        ? getApiUrl(`/zone/${editingZone.id}`)
        : getApiUrl('/zone');
      
      const response = await fetch(url, {
        method: editingZone ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error saving zone');
      
      toast.success(editingZone ? 'Zona actualizada' : 'Zona creada');
      setIsDialogOpen(false);
      fetchZones();
    } catch (error) {
      toast.error('Error al guardar la zona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setValue('name', zone.name);
    setValue('price', zone.price);
    setIsDialogOpen(true);
  };

  const openNewZoneDialog = () => {
    setEditingZone(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Zonas</h1>
        <button
          onClick={openNewZoneDialog}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          Nueva Zona
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
                  Precio
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${zone.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(zone)}
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
          setEditingZone(null);
          reset();
        }}
        title={editingZone ? "Editar Zona" : "Nueva Zona"}
        isLoading={isLoading}
        onSave={handleSubmit(onSubmit)}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="space-y-6">
              <div className="relative group">
                <label htmlFor="name" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Nombre de la zona
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    {...register('name', { required: 'El nombre es requerido' })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="Ej: Zona Norte"
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
                <label htmlFor="price" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                  Precio de entrega
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-400 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    {...register('price', { 
                      required: 'El precio es requerido',
                      min: { value: 0, message: 'El precio debe ser mayor a 0' }
                    })}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                    placeholder="0"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.price.message}
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
"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import Dialog from '@/app/components/Dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { getApiUrl, getAuthHeaders } from '@/app/utils/api';

interface Timezone {
  id: number;
  name: string;
}

interface TimezoneFormData {
  name: string;
}

export default function ZonasHorariasPage() {
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimezone, setEditingTimezone] = useState<Timezone | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<TimezoneFormData>();

  const fetchTimezones = async () => {
    try {
      const response = await fetch(getApiUrl('/timezone'), {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Error fetching timezones');
      const data = await response.json();
      setTimezones(data);
    } catch (error) {
      toast.error('Error al cargar las franjas horarias');
    }
  };

  useEffect(() => {
    fetchTimezones();
  }, []);

  const onSubmit = async (data: TimezoneFormData) => {
    setIsLoading(true);
    try {
      const url = editingTimezone 
        ? getApiUrl(`/timezone/${editingTimezone.id}`)
        : getApiUrl('/timezone');
      
      const response = await fetch(url, {
        method: editingTimezone ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error saving timezone');
      
      toast.success(editingTimezone ? 'Franja horaria actualizada' : 'Franja horaria creada');
      setIsDialogOpen(false);
      fetchTimezones();
    } catch (error) {
      toast.error('Error al guardar la franja horaria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (timezone: Timezone) => {
    setEditingTimezone(timezone);
    setValue('name', timezone.name);
    setIsDialogOpen(true);
  };

  const openNewTimezoneDialog = () => {
    setEditingTimezone(null);
    reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Franjas horarias</h1>
        <button
          onClick={openNewTimezoneDialog}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
        >
          <FiPlus className="h-5 w-5 mr-2" />
          Nueva Franja horaria
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timezones.map((timezone) => (
                <tr key={timezone.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {timezone.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(timezone)}
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
          setEditingTimezone(null);
          reset();
        }}
        title={editingTimezone ? "Editar Franja horaria" : "Nueva Franja horaria"}
        isLoading={isLoading}
        onSave={handleSubmit(onSubmit)}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
            <div className="relative group">
              <label htmlFor="name" className="block text-sm font-medium text-purple-900 mb-2 group-focus-within:text-purple-600 transition-colors">
                Nombre del horario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'El nombre es requerido' })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder:text-purple-200"
                  placeholder="Ej: De 8:00 a 12:00"
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
          </div>
        </form>
      </Dialog>
    </div>
  );
} 
"use client";

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { FiX } from 'react-icons/fi';
import { getApiUrl, getAuthHeaders } from '../utils/api';
import { toast } from 'react-hot-toast';

interface AssignDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: number;
  currentDriver: any | null;
  onDriverAssigned?: () => void;
}

export default function AssignDriverDialog({
  isOpen,
  onClose,
  routeId,
  currentDriver,
  onDriverAssigned
}: AssignDriverDialogProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        getApiUrl('/admin?filter=role||$eq||driver&limit=100&page=1'),
        {
          headers: getAuthHeaders()
        }
      );
      if (!response.ok) throw new Error('Error fetching drivers');
      const data = await response.json();
      setDrivers(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Error al cargar los repartidores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen, fetchDrivers]);

  const handleAssignDriver = async (driverId: number | null) => {
    setSaving(true);
    try {
      const response = await fetch(getApiUrl(`/route/${routeId}`), {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delivery: driverId
        })
      });

      if (!response.ok) throw new Error('Error assigning driver');

      toast.success(driverId ? 'Repartidor asignado correctamente' : 'Repartidor removido correctamente');
      onClose();
      // Call callback after closing to refresh route data
      if (onDriverAssigned) {
        setTimeout(() => {
          onDriverAssigned();
        }, 100);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Error al asignar el repartidor');
    } finally {
      setSaving(false);
    }
  };

  // Filter out current driver from the list
  const availableDrivers = drivers.filter(
    (driver) => !currentDriver || driver.id !== currentDriver.id
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-[1000]" onClose={onClose}>
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
                <div className="flex items-center justify-between mb-6">
                  <HeadlessDialog.Title
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    Asignar Repartidor
                  </HeadlessDialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-500">
                    Cargando repartidores...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Driver Section */}
                    {currentDriver && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-900 mb-1">
                              Repartidor Actual
                            </p>
                            <p className="text-sm text-gray-700">
                              {currentDriver.name || currentDriver.email}
                            </p>
                            {currentDriver.email && (
                              <p className="text-xs text-gray-500 mt-1">
                                {currentDriver.email}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAssignDriver(null)}
                            disabled={saving}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Quitando...' : 'Quitar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Available Drivers List */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        {currentDriver ? 'Reasignar a otro repartidor:' : 'Seleccionar repartidor:'}
                      </p>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {availableDrivers.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No hay repartidores disponibles
                          </div>
                        ) : (
                          availableDrivers.map((driver) => (
                            <button
                              key={driver.id}
                              onClick={() => handleAssignDriver(driver.id)}
                              disabled={saving}
                              className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {driver.name || 'Sin nombre'}
                              </p>
                              {driver.email && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {driver.email}
                                </p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

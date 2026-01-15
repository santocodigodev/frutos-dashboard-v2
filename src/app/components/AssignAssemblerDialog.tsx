"use client";
import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { usePedidos } from '../(protected)/pedidos/PedidosContext';
import { useSidebarRutas } from '../(protected)/rutas/SidebarContext';
import { getApiUrl } from '../utils/api';

interface AssignAssemblerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: number[];
}

export default function AssignAssemblerDialog({ 
  isOpen, 
  onClose, 
  selectedOrders 
}: AssignAssemblerDialogProps) {
  const [assemblers, setAssemblers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssembler, setSelectedAssembler] = useState<number | null>(null);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const router = useRouter();
  const { refreshOrders } = usePedidos();
  const { refreshCounts } = useSidebarRutas();

  const fetchAssemblers = async () => {
    try {
      const response = await fetch(getApiUrl('/assembler'), {
        headers: {
          'accept': 'application/json',
          'token': user.token
        }
      });
      const data = await response.json();
      setAssemblers(data);
    } catch (error) {
      console.error('Error fetching assemblers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssemblers();
    }
  }, [isOpen]);

  const handleAssignAssembler = async () => {
    if (!selectedAssembler) return;

    try {
      const response = await fetch(getApiUrl(`/assembler/${selectedAssembler}/orders`), {
        method: 'PATCH',
        headers: {
          'accept': 'application/json',
          'token': user.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orders: selectedOrders
        })
      });

      if (response.ok) {
        await Promise.all([
          refreshOrders(),
          refreshCounts()
        ]);
        // Recargar la página para actualizar el sidebar (como se hace en RouteDetailDialog)
        window.location.reload();
        onClose();
      }
    } catch (error) {
      console.error('Error assigning assembler:', error);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-lg flex flex-col">
          <div className="p-6 flex-shrink-0">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              Asignar pedidos a armador
            </Dialog.Title>
            
            <div className="mb-6">
              <p className="text-gray-600">
                Pedidos seleccionados: <span className="font-semibold">{selectedOrders.length}</span>
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando armadores...</div>
            ) : (
              <div className="space-y-4">
                {assemblers.map((assembler) => (
                  <div
                    key={assembler.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAssembler === assembler.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-400'
                    }`}
                    onClick={() => setSelectedAssembler(assembler.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{assembler.name}</h3>
                        <p className="text-sm text-gray-500">
                          {assembler.phone || 'Sin teléfono'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {assembler.orders ? 
                            (assembler.orders.length === 0 ? 
                              'Sin orden asignada' : 
                              assembler.orders.length === 1 ? 
                                '1 orden asignada' : 
                                `${assembler.orders.length} órdenes asignadas`
                            ) : 
                            'Sin orden asignada'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t flex justify-end gap-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssignAssembler}
              disabled={!selectedAssembler}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              Asignar armador
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
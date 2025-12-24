import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

interface VoucherDialogProps {
  voucherUrl: string;
  onClose: () => void;
  orderId?: number;
  paymentId?: number;
  onPaymentStatusChange?: () => void;
}

export default function VoucherDialog({ 
  voucherUrl, 
  onClose, 
  orderId, 
  paymentId, 
  onPaymentStatusChange 
}: VoucherDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMotive, setRejectMotive] = useState('');
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const handleApprovePayment = async () => {
    if (!paymentId || !orderId) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(buildApiUrl(`payment/${paymentId}/status-update`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify({
          approve: true
        })
      });

      if (response.ok) {
        onPaymentStatusChange?.();
        onClose();
      } else {
        console.error('Error approving payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!paymentId || !orderId) return;
    
    if (!rejectReason.trim() || !rejectMotive.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch(buildApiUrl(`payment/${paymentId}/status-update`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': user.token
        },
        body: JSON.stringify({
          approve: false,
          rejectReason: rejectReason.trim(),
          rejectMotive: rejectMotive.trim()
        })
      });

      if (response.ok) {
        onPaymentStatusChange?.();
        onClose();
      } else {
        console.error('Error rejecting payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = () => {
    setShowRejectDialog(true);
  };

  const closeRejectDialog = () => {
    setShowRejectDialog(false);
    setRejectReason('');
    setRejectMotive('');
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-2xl p-4 max-w-4xl w-full max-h-[90vh] relative"
          onClick={e => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-2xl text-purple-600 hover:text-purple-800 z-10"
          >
            &times;
          </button>
          
          <div className="mt-4 h-[calc(90vh-8rem)]">
            <iframe 
              src={voucherUrl}
              className="w-full h-full border-0 rounded"
              title="Comprobante de pago"
            />
          </div>

          {/* Action buttons */}
          {paymentId && (
            <div className="flex justify-center gap-4 mt-4 pt-4 border-t">
              <button
                onClick={openRejectDialog}
                disabled={isProcessing}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? 'Procesando...' : 'Rechazar'}
              </button>
              <button
                onClick={handleApprovePayment}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? 'Procesando...' : 'Aprobar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={closeRejectDialog}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-red-600 mb-4">Rechazar Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón del rechazo *
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ej: Pago rechazado"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={rejectMotive}
                  onChange={(e) => setRejectMotive(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Ej: Tarjeta de crédito rechazada"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeRejectDialog}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={isProcessing || !rejectReason.trim() || !rejectMotive.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Procesando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
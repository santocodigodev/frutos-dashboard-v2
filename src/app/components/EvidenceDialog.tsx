import React from 'react';

interface EvidenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null | undefined;
  title: string;
}

export default function EvidenceDialog({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title 
}: EvidenceDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-4 max-w-4xl w-full max-h-[90vh] relative mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-2xl text-purple-600 hover:text-purple-800 z-10"
        >
          &times;
        </button>
        
        <h3 className="text-xl font-bold text-purple-600 mb-4">{title}</h3>
        
        <div className="mt-4 h-[calc(90vh-8rem)] flex items-center justify-center">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded"
            />
          ) : (
            <div className="text-gray-500 text-center">
              No hay evidencia disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


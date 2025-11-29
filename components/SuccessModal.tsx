import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, title = 'Success!' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          {title && (
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{title}</h2>
          )}
          <p className="text-sm sm:text-base text-slate-600 mb-6 break-words">{message}</p>
          <button 
            onClick={onClose}
            className="w-full bg-primary text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;


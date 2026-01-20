import React from 'react';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 safe-top safe-bottom">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-600 mt-2">{description}</p>}
        </div>
        <div className="p-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 touch-manipulation min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white touch-manipulation min-h-[44px] ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}



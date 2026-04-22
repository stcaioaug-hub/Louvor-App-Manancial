import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-black/5"
          >
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#00153d] mb-2">{title}</h3>
              <p className="text-sm text-slate-500">{message}</p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 border-t border-black/5">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-white border border-black/5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all text-sm ${
                  isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isDestructive && <Trash2 size={16} />}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

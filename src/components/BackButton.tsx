import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Voltar', className = '' }) => {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-3 text-slate-500 hover:text-[#00153d] font-black uppercase tracking-[0.2em] text-[10px] transition-all group ${className}`}
    >
      <div className="p-2.5 bg-white rounded-xl shadow-lg shadow-blue-900/5 group-hover:shadow-blue-900/10 transition-all border border-black/5 group-hover:border-blue-500/20">
        <ChevronLeft size={18} strokeWidth={3} className="text-blue-600 transition-transform group-hover:-translate-x-0.5" />
      </div>
      <span className="group-hover:translate-x-1 transition-transform">{label}</span>
    </motion.button>
  );
};

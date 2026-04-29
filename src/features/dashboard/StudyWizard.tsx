import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Music, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink,
  Youtube,
  FileText,
  Mic2,
  Play,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Song } from '../../types';

interface StudyWizardProps {
  newSongs: Song[];
  onClose: () => void;
  onSelectSong: (id: string) => void;
  onGoToStudyHub: () => void;
}

export function StudyWizard({ newSongs, onClose, onSelectSong, onGoToStudyHub }: StudyWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (newSongs.length === 0) return null;

  const currentSong = newSongs[currentIndex];

  const handleNext = () => {
    if (currentIndex < newSongs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00153d]/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="p-10 pb-6 space-y-1">
           <div className="flex items-center gap-3 text-blue-600 mb-2">
             <Sparkles size={20} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Radar de Estudo</span>
           </div>
           <h3 className="text-3xl font-headline font-black text-[#00153d] tracking-tight">
             Você tem {newSongs.length} louvores novos!
           </h3>
           <p className="text-slate-500 font-medium">Dê uma olhada rápida no que chegou recentemente.</p>
        </div>

        <div className="px-10 py-8">
           <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSong.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass bg-gradient-to-br from-slate-50 to-white p-8 rounded-[3rem] border border-slate-100 shadow-xl"
                >
                  <div className="flex gap-6 items-center mb-8">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-lg border-2 border-white shrink-0">
                       {currentSong.cover_url ? (
                         <img src={currentSong.cover_url} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-200">
                           <Music size={40} />
                         </div>
                       )}
                    </div>
                    <div className="flex-1 space-y-1">
                       <h4 className="text-2xl font-headline font-black text-[#00153d] leading-tight">{currentSong.title}</h4>
                       <p className="text-lg text-slate-500 font-medium">{currentSong.artist}</p>
                       <div className="flex gap-2 pt-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Tom: {currentSong.key}</span>
                          {currentSong.originalKey && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Original: {currentSong.originalKey}</span>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-slate-400">
                         <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Clock size={16} />
                         </div>
                         <div className="text-left">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Dificuldade</p>
                            <div className="flex gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map(l => (
                                <div key={l} className={`h-1 w-3 rounded-full ${l <= currentSong.difficulty ? 'bg-orange-500' : 'bg-slate-200'}`} />
                              ))}
                            </div>
                         </div>
                       </div>
                    </div>
                    <div className="flex justify-end items-center">
                       <button 
                         onClick={() => onSelectSong(currentSong.id)}
                         className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:gap-3 transition-all"
                       >
                         Ver Detalhes <ArrowRight size={14} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {newSongs.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 -left-4 -right-4 flex justify-between pointer-events-none">
                  <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`p-4 rounded-full bg-white shadow-xl border border-slate-100 text-[#00153d] transition-all pointer-events-auto ${currentIndex === 0 ? 'opacity-0 scale-50' : 'hover:scale-110 active:scale-90'}`}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={currentIndex === newSongs.length - 1}
                    className={`p-4 rounded-full bg-white shadow-xl border border-slate-100 text-[#00153d] transition-all pointer-events-auto ${currentIndex === newSongs.length - 1 ? 'opacity-0 scale-50' : 'hover:scale-110 active:scale-90'}`}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
           </div>
        </div>

        <div className="p-10 pt-4 flex flex-col gap-4">
           {/* Progress Dots */}
           <div className="flex justify-center gap-2 mb-2">
             {newSongs.map((_, i) => (
               <div 
                 key={i} 
                 className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200'}`} 
               />
             ))}
           </div>

           <button
             onClick={onGoToStudyHub}
             className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             <Play size={18} fill="currentColor" />
             Ir para Ambiente de Estudo
           </button>
           
           <button
             onClick={onClose}
             className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
           >
             Continuar para o Dashboard
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

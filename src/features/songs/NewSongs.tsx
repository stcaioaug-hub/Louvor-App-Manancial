import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Music, TrendingUp, Star, ExternalLink, FileText, Play, Clock, Sparkles } from 'lucide-react';
import { Song, WorshipEvent } from '../../types';
import { BackButton } from '../../components/BackButton';

interface NewSongsProps {
  songs: Song[];
  events: WorshipEvent[];
  onSelectSong: (id: string) => void;
  onBack: () => void;
}

export default function NewSongs({ songs, events, onSelectSong, onBack }: NewSongsProps) {
  // Sort songs by createdAt if available, otherwise just use the last 10 added in the array
  const newSongsList = useMemo(() => {
    return [...songs]
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0; // Keep current order if no dates
      })
      .slice(0, 10);
  }, [songs]);

  // Find most recent event to show some context if needed
  const recentEvent = useMemo(() => {
    return events[events.length - 1];
  }, [events]);

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
        >
          <BackButton onClick={onBack} />
          <div className="mt-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00153d] to-blue-800 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/20">
              <Sparkles size={32} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Novidades no Manancial</p>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight">Novos Louvores</h2>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Featured New Song */}
      {newSongsList.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group overflow-hidden"
        >
          <div 
            onClick={() => onSelectSong(newSongsList[0].id)}
            className="glass bg-gradient-to-br from-[#011a4d] via-blue-900 to-[#00153d] p-10 md:p-14 rounded-[4rem] text-white cursor-pointer transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,21,61,0.4)] border border-white/10 group-hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-400/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-20 right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-[60px] pointer-events-none animate-pulse" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-cyan-300">
                  <TrendingUp size={14} />
                  Destaque do Repertório
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-5xl md:text-6xl font-headline font-extrabold leading-tight tracking-tighter">
                    {newSongsList[0].title}
                  </h3>
                  <p className="text-2xl text-blue-100 font-medium opacity-80">{newSongsList[0].artist}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">Tom Sugerido</span>
                    <span className="text-2xl font-black">{newSongsList[0].key}</span>
                  </div>
                  <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/10 flex flex-col min-w-[120px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">Andamento</span>
                    <span className="text-2xl font-black">{newSongsList[0].bpm || '--'} <span className="text-sm font-normal opacity-60">BPM</span></span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-[#00153d] px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    <Play size={20} fill="currentColor" />
                    Sugerir para Próximo Culto
                  </button>
                </div>
              </div>

              <div className="hidden md:flex justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 bg-cyan-400 rounded-[3.5rem] rotate-6 opacity-20 blur-2xl animate-pulse" />
                  <div className="absolute inset-0 bg-white/5 rounded-[3.5rem] border border-white/10 backdrop-blur-3xl transition-transform duration-700 group-hover:rotate-6 flex items-center justify-center shadow-2xl overflow-hidden">
                    <Music size={140} className="text-white opacity-10" />
                    <div className="absolute bottom-6 left-6 right-6 p-4 glass-dark rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center text-[#00153d]">
                        <Star size={20} fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Popularidade</p>
                        <p className="text-xs font-bold text-white">Alta entre os ministros</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Grid of New Songs */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
            Últimas Adições
            <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
              {newSongsList.length} louvores
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newSongsList.slice(1).map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              onClick={() => onSelectSong(song.id)}
              className="group glass p-8 rounded-[3rem] border border-white/50 hover:bg-white hover:shadow-[0_30px_60px_rgba(0,21,61,0.08)] transition-all duration-500 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="relative z-10 flex flex-col h-full space-y-6">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 group-hover:bg-[#00153d] group-hover:text-white transition-all duration-500 group-hover:rotate-6 shadow-sm">
                    <Music size={24} />
                  </div>
                  <div className="flex gap-2">
                    {song.isFavorite && (
                      <div className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center shadow-sm">
                        <Star size={18} fill="currentColor" />
                      </div>
                    )}
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100 shadow-sm">
                      {song.key}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-xl font-headline font-black text-[#00153d] mb-1 group-hover:text-blue-700 transition-colors">{song.title}</h4>
                  <p className="text-slate-500 font-medium">{song.artist}</p>
                </div>

                <div className="pt-6 border-t border-black/[0.03] flex items-center justify-between">
                  <div className="flex gap-2">
                    {song.links.chords && (
                      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all hover:scale-110">
                        <ExternalLink size={16} />
                      </div>
                    )}
                    {song.links.lyrics && (
                      <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-all hover:scale-110">
                        <FileText size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                    <Clock size={12} />
                    Adicionado
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {newSongsList.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-20 rounded-[4rem] text-center space-y-6 border border-white/50"
        >
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Music size={48} />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-headline font-bold text-[#00153d]">Nenhum louvor novo encontrado</h4>
            <p className="text-slate-500 max-w-sm mx-auto">Toda semana adicionamos novas músicas ao nosso repertório. Fique atento!</p>
          </div>
        </motion.div>
      )}

      {/* Suggested Section */}
      <section className="glass bg-gradient-to-br from-white/40 to-white/10 p-12 rounded-[4rem] border border-white/50 text-center space-y-8">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-3xl font-headline font-extrabold text-[#00153d]">Sugira um Novo Louvor</h3>
          <p className="text-slate-500 font-medium">Ouviu uma música inspiradora? Envie para nosso time de ministros analisar a inclusão no repertório.</p>
        </div>
        <button 
          onClick={onBack}
          className="bg-[#00153d] text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:translate-y-[-4px] active:scale-95 transition-all shadow-xl shadow-blue-900/20"
        >
          Acessar Biblioteca Completa
        </button>
      </section>
    </div>
  );
}

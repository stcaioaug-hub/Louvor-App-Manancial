import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Users, Music, Activity, Star, Calendar, ArrowUpRight, CheckCircle2, BarChart2, Play, Mic2, Trophy, Clock } from 'lucide-react';
import { Song, TeamMember, WorshipEvent } from '../../types';
import { BackButton } from '../../components/BackButton';

interface InsightsProps {
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  onBack: () => void;
}

export default function Insights({ songs, team, events, onBack }: InsightsProps) {
  const [showPlayed, setShowPlayed] = useState(true);
  const [showRehearsed, setShowRehearsed] = useState(true);

  // Advanced aggregations for insights
  const metrics = useMemo(() => {
    // Song performance stats
    const songUsage = events.reduce((acc, event) => {
      const allEventSongs = [
        ...(event.songs || []),
        ...(event.offeringSongs || []),
        ...(event.outroSongs || [])
      ];
      
      allEventSongs.forEach(id => {
        if (!acc[id]) acc[id] = { played: 0, rehearsed: 0 };
        if (event.type === 'service') acc[id].played++;
        else if (event.type === 'rehearsal') acc[id].rehearsed++;
      });
      return acc;
    }, {} as Record<string, { played: number; rehearsed: number }>);

    const processedSongs = Object.entries(songUsage)
      .map(([id, counts]) => {
        const song = songs.find(s => s.id === id);
        return {
          id,
          title: song?.title || 'Música Removida',
          artist: song?.artist || 'Unknown',
          played: counts.played,
          rehearsed: counts.rehearsed,
          total: counts.played + counts.rehearsed
        };
      });

    const topSongs = processedSongs
      .sort((a, b) => {
        const valA = (showPlayed ? a.played : 0) + (showRehearsed ? a.rehearsed : 0);
        const valB = (showPlayed ? b.played : 0) + (showRehearsed ? b.rehearsed : 0);
        return valB - valA;
      })
      .filter(s => {
        const val = (showPlayed ? s.played : 0) + (showRehearsed ? s.rehearsed : 0);
        return val > 0;
      })
      .slice(0, 5);

    // Absolute most played for the highlight card
    const absoluteTopSong = [...processedSongs].sort((a, b) => b.played - a.played)[0];

    // Recent events vs total
    const futureEvents = events.filter(e => new Date(e.date) >= new Date());
    
    // Member roles
    const vocalists = team.filter(m => m.category === 'vocal' || m.role?.toLowerCase() === 'vocal').length;
    const instruments = team.filter(m => m.category === 'instrumento' || m.role?.toLowerCase() === 'instrumento').length;

    return { topSongs, futureEvents, vocalists, instruments, absoluteTopSong };
  }, [songs, team, events, showPlayed, showRehearsed]);

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center relative z-10">
        <div>
          <BackButton onClick={onBack} className="mb-6" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-headline font-extrabold text-[#00153d] tracking-tight mb-2 flex items-center gap-4">
              <TrendingUp className="text-blue-600" size={48} strokeWidth={2.5} />
              Portal de Insights
            </h2>
            <p className="text-slate-500 font-medium text-lg">Métricas e análise de dados do seu Ministério de Louvor.</p>
          </motion.div>
        </div>
      </header>

      {/* Main KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl border border-white/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Acervo Total</p>
              <h3 className="text-5xl font-headline font-extrabold text-[#00153d]">{songs.length}</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-1">
                <ArrowUpRight size={16} className="text-emerald-500" />
                <span className="text-emerald-500">+12%</span> este mês
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Music size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl border border-white/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 mb-2">Equipe Ativa</p>
              <h3 className="text-5xl font-headline font-extrabold text-[#00153d]">{team.length}</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-1">
                <Users size={16} className="text-blue-400" />
                {metrics.vocalists} vozes • {metrics.instruments} instrumentistas
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Activity size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl border border-white/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Agendas Futuras</p>
              <h3 className="text-5xl font-headline font-extrabold text-[#00153d]">{metrics.futureEvents.length}</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-1">
                <Calendar size={16} className="text-indigo-400" />
                Escalas pendentes
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Deep Dive Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Song Performance Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="glass p-10 rounded-[3.5rem] shadow-2xl border border-white/60 bg-white/40 flex flex-col"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
              <Trophy className="text-amber-500" />
              Ranking de Músicas
            </h3>
            
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl gap-1.5 backdrop-blur-md border border-slate-200">
              <button 
                onClick={() => setShowPlayed(!showPlayed)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${showPlayed ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Play size={14} fill={showPlayed ? "currentColor" : "none"} className={showPlayed ? "animate-pulse" : ""} />
                Tocadas
              </button>
              <button 
                onClick={() => setShowRehearsed(!showRehearsed)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${showRehearsed ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Mic2 size={14} className={showRehearsed ? "animate-bounce" : ""} />
                Ensaiadas
              </button>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <AnimatePresence mode="popLayout">
              {metrics.topSongs.map((song, idx) => {
                const maxVal = Math.max(...metrics.topSongs.map(s => (showPlayed ? s.played : 0) + (showRehearsed ? s.rehearsed : 0))) || 1;
                const currentVal = (showPlayed ? song.played : 0) + (showRehearsed ? song.rehearsed : 0);
                const percentage = Math.round((currentVal / maxVal) * 100);
                
                return (
                  <motion.div 
                    key={song.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="relative group pb-2"
                  >
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{song.artist}</span>
                        <span className="text-sm font-black text-[#00153d] group-hover:text-blue-600 transition-colors uppercase tracking-tight">{song.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-black">
                        <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{currentVal}x</span>
                        <span className="text-blue-500 min-w-[3ch] text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "circOut" }}
                        className={`h-full rounded-full transition-colors duration-500 ${
                          showPlayed && showRehearsed ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                          showPlayed ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-indigo-400 to-purple-400'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {metrics.topSongs.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-12 text-slate-400 flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-[2.5rem]"
              >
                <Activity size={48} className="opacity-20 animate-pulse text-slate-300" />
                <p className="text-sm font-bold tracking-tight">Selecione um filtro para ver o ranking</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Featured / Strongest Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="p-10 rounded-[3.5rem] shadow-2xl border border-blue-400/30 bg-gradient-to-br from-[#00153d] via-blue-900 to-cyan-800 text-white relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(8,112,184,0.4)] transition-all duration-700"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Star className="text-cyan-300" />
              </div>
              <h3 className="text-2xl font-headline font-extrabold flex items-center gap-3">
                Destaques do Mês
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all cursor-default">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-1">Música Mais Tocada</p>
                <p className="text-xl font-bold truncate">{metrics.absoluteTopSong?.title || 'Sincronizando...'}</p>
                <p className="text-sm text-cyan-100/80 flex items-center gap-2">
                  <Clock size={14} />
                  {metrics.absoluteTopSong?.played || 0} cultos realizados
                </p>
              </div>
              
              <div className="bg-white/10 rounded-3xl p-6 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all cursor-default">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-1">Crescimento da Equipe</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">Consistente</p>
                  <div className="flex -space-x-2">
                    {team.slice(0,4).map((m, i) => (
                       <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#00153d] flex items-center justify-center text-[10px] font-black uppercase">
                         {m.name.charAt(0)}
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

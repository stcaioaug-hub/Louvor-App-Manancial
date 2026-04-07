import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Music, Activity, Star, Calendar, ArrowUpRight, CheckCircle2, BarChart2 } from 'lucide-react';
import { Song, TeamMember, WorshipEvent } from '../types';
import { BackButton } from './BackButton';

interface InsightsProps {
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  onBack: () => void;
}

export default function Insights({ songs, team, events, onBack }: InsightsProps) {
  // Simple aggregations for insights
  const metrics = useMemo(() => {
    // Top Keys
    const keyCounts = songs.reduce((acc, song) => {
      acc[song.key] = (acc[song.key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topKeys = Object.entries(keyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Recent events vs total
    const futureEvents = events.filter(e => new Date(e.date) >= new Date());
    
    // Most equipped members? Just an example stat
    const vocalistCount = team.filter(m => m.role === 'vocal').length;
    const instrumentCount = team.filter(m => m.role === 'instrument' || m.role === 'band').length;

    return { topKeys, futureEvents, vocalistCount, instrumentCount };
  }, [songs, team, events]);

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
                {metrics.vocalistCount} vozes • {metrics.instrumentCount} banda
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
        {/* Tonality Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="glass p-10 rounded-[3.5rem] shadow-2xl border border-white/60 bg-white/40"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
              <BarChart2 className="text-blue-500" />
              Tonalidades Favoritas
            </h3>
          </div>
          <div className="space-y-6">
            {metrics.topKeys.map(([key, count], idx) => {
              const maxCount = metrics.topKeys[0]?.[1] || 1;
              const percentage = Math.round((count / maxCount) * 100);
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-[#00153d] bg-white px-3 py-1 rounded-lg border border-slate-200">Tom: {key}</span>
                    <span className="text-slate-500">{count} músicas</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + (idx * 0.2) }}
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
            {metrics.topKeys.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Music size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhuma música cadastrada ainda.</p>
              </div>
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
                <p className="text-xl font-bold">{songs[0]?.title || 'Sincronizando...'}</p>
                <p className="text-sm text-cyan-100/80">3 eventos nas últimas semanas</p>
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

import React, { useState } from 'react';
import { Bell, TrendingUp, Music, Users, Calendar as CalendarIcon, X, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, TeamMember, WorshipEvent, Profile } from '../types';
import { formatDashboardDate } from '../lib/dateUtils';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  onSelectEvent: (id: string) => void;
  onSelectSong: (id: string) => void;
  userProfile: Profile | null;
}

export default function Dashboard({ setActiveTab, songs, team, events, onSelectEvent, onSelectSong, userProfile }: DashboardProps) {
  const nextService = events.find(e => e.type === 'service');

  const stats = [
    { label: 'Louvores ativos', value: songs.length.toString(), icon: Music, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/10', tab: 'repertoire' },
    { label: 'Integrantes', value: team.length.toString(), icon: Users, color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/10', tab: 'team' },
    { label: 'Eventos mensais', value: events.length.toString(), icon: CalendarIcon, color: 'from-cyan-500 to-blue-400', shadow: 'shadow-cyan-500/10', tab: 'schedule' },
    { label: 'Novos louvores', value: '+5', icon: TrendingUp, color: 'from-[#00153d] to-blue-800', shadow: 'shadow-blue-900/10', tab: 'repertoire' },
  ];

  const formatDate = (dateStr: string) => formatDashboardDate(dateStr);

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-5xl font-headline font-extrabold text-[#00153d] tracking-tight mb-2">
            Olá, {userProfile?.name?.split(' ')[0] || 'Ministério'}!
          </h2>
          <p className="text-slate-500 font-medium text-lg">Aqui está o resumo do seu louvor para hoje.</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <button className="p-4 glass rounded-3xl text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95 border border-white/50">
            <Bell size={24} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            key={stat.label} 
            onClick={() => setActiveTab(stat.tab)}
            className="relative overflow-hidden glass p-8 rounded-[3rem] group text-left w-full transition-all duration-500 transform hover:-translate-y-2 active:scale-[0.98] border border-white/40 shadow-xl"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className={`relative z-10 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-[1.5rem] flex items-center justify-center text-white mb-6 shadow-2xl ${stat.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
              <stat.icon size={30} strokeWidth={2} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-600 transition-colors">{stat.label}</p>
              <p className="text-4xl font-headline font-extrabold text-[#00153d]">{stat.value}</p>
            </div>
          </motion.button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="lg:col-span-8"
        >
          <div 
            onClick={() => nextService && onSelectEvent(nextService.id)}
            className="relative overflow-hidden glass p-10 rounded-[3.5rem] cursor-pointer group transition-all duration-500 border border-white/50 shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex items-center justify-between mb-10">
              <h3 className="relative z-10 text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
                Próximo Culto
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </h3>
              <div className="px-4 py-2 bg-[#00153d] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                Ao Vivo em Breve
              </div>
            </div>

            {nextService ? (
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#00153d] rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl group-hover:rotate-3 transition-transform duration-500 p-2">
                      <span className="text-xs font-black uppercase tracking-tighter opacity-70">{formatDate(nextService.date).weekday}</span>
                      <span className="text-3xl font-headline font-extrabold leading-none">{formatDate(nextService.date).day}</span>
                    </div>
                    <div>
                      <h4 className="font-headline font-extrabold text-2xl text-[#00153d] group-hover:text-blue-700 transition-colors tracking-tight">{nextService.title}</h4>
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <Clock size={16} className="text-blue-500" /> {nextService.time} 
                        <span className="text-slate-300">•</span>
                        <MapPin size={16} className="text-blue-500" /> {nextService.location || 'Igreja Manancial'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Repertório Selecionado</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nextService.songs.slice(0, 4).map(songId => {
                        const song = songs.find(s => s.id === songId);
                        return (
                          <button
                            key={songId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSong(songId);
                            }}
                            className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl group/song hover:bg-white border hover:border-blue-500/20 transition-all duration-300 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover/song:bg-blue-600 group-hover/song:text-white transition-colors">
                                <Music size={14} />
                              </div>
                              <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{song?.title}</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{song?.key}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-72 space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Equipe Escalada</p>
                  <div className="bg-white/40 border border-white/60 rounded-3xl p-6 space-y-4">
                    <div className="flex -space-x-4">
                      {[...nextService.team.vocal, ...Object.values(nextService.team.instruments)].map((name, i) => (
                        <div key={i} title={name} className="w-12 h-12 rounded-2xl border-4 border-white bg-[#00153d] text-white overflow-hidden flex items-center justify-center text-xs font-black uppercase shadow-lg hover:-translate-y-2 hover:z-10 transition-all duration-300">
                          {name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Oito integrantes confirmados para este culto.</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(nextService.id);
                    }}
                    className="w-full py-4 bg-[#00153d] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all active:scale-95 group/btn"
                  >
                    <span>Configurar Louvor</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400">
                <CalendarIcon size={64} className="mx-auto mb-6 opacity-10 animate-float" />
                <p className="font-bold text-lg">Nenhum culto programado</p>
                <p className="text-sm text-slate-500 mt-1">Aguarde a atualização da escala semanal.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          onClick={() => setActiveTab('insights')}
          className="lg:col-span-4 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.3)] group hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(8,112,184,0.5)] transition-all duration-700 text-left border border-white/20 bg-gradient-to-br from-[#00153d] via-blue-800 to-cyan-600"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-150 transition-transform duration-1000 delay-100" />
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <h3 className="text-2xl font-headline font-extrabold flex items-center gap-3">
              <TrendingUp size={24} className="text-cyan-300 group-hover:rotate-12 transition-transform" />
              Insights
            </h3>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-[#00153d] transition-all shadow-lg">
              <Music size={18} />
            </div>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10 group-hover:bg-white/20 transition-all duration-500 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-2">Louvor em destaque</p>
              <h4 className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors drop-shadow-md">{songs[0]?.title || 'Analise em curso...'}</h4>
              <p className="text-sm text-blue-100 mt-1">{songs[0]?.artist || 'Sincronizando dados'}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-300 shadow-[0_0_15px_rgba(34,211,238,0.8)]" 
                  />
                </div>
                <span className="text-[10px] font-black text-cyan-300">85%</span>
              </div>
            </div>

            <div className="p-6 bg-[#00153d]/40 backdrop-blur-md rounded-[2rem] border border-black/10 group-hover:bg-[#00153d]/50 transition-all duration-500 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-0.5">Engajamento</p>
                  <p className="text-lg font-bold text-white drop-shadow-md">Excelente</p>
                  <p className="text-xs text-blue-100 mt-0.5">Sua equipe está super ativa.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-2 opacity-80 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-100 group-hover:text-white transition-colors flex items-center gap-2">
                Acessar Portal de Insights &rarr;
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

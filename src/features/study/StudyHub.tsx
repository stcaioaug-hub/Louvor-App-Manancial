import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Calendar, 
  ExternalLink, 
  Youtube, 
  FileText, 
  Mic2, 
  Clock, 
  ChevronRight, 
  Play,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Song, WorshipEvent, Profile, UserSongStudy } from '../../types';
import { BackButton } from '../../components/BackButton';
import { formatDashboardDate } from '../../lib/dateUtils';

interface StudyHubProps {
  songs: Song[];
  events: WorshipEvent[];
  userProfile: Profile | null;
  userSongStudy: UserSongStudy[];
  onToggleStudySong: (songId: string) => Promise<void>;
  onUpdateStudyStatus: (studyId: string, isCompleted: boolean) => Promise<void>;
  onSelectSong: (id: string) => void;
  onBack: () => void;
}

export default function StudyHub({ 
  songs, 
  events, 
  userProfile, 
  userSongStudy, 
  onToggleStudySong, 
  onUpdateStudyStatus,
  onSelectSong,
  onBack 
}: StudyHubProps) {
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date + 'T' + e.time) >= new Date())
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
      .slice(0, 5);
  }, [events]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    upcomingEvents.length > 0 ? upcomingEvents[0].id : null
  );

  const selectedEvent = useMemo(() => {
    return upcomingEvents.find(e => e.id === selectedEventId) || null;
  }, [upcomingEvents, selectedEventId]);

  const eventSongsList = useMemo(() => {
    if (!selectedEvent) return [];
    const songIds = [
      ...(selectedEvent.songs || []),
      ...(selectedEvent.offeringSongs || []),
      ...(selectedEvent.outroSongs || [])
    ];
    return songs.filter(s => songIds.includes(s.id));
  }, [selectedEvent, songs]);

  const isStudying = (songId: string) => userSongStudy.find(s => s.song_id === songId);

  return (
    <div className="space-y-10 pb-32">
      <header className="space-y-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
        >
          <BackButton onClick={onBack} />
          <div className="mt-4 flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00153d] to-blue-800 rounded-3xl flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               <BookOpen size={32} className="relative z-10" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Prática & Louvor</p>
              <h2 className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight">Ambiente de Estudo</h2>
            </div>
          </div>
        </motion.div>

        {/* Event Selector Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          {upcomingEvents.map((event) => {
             const dateInfo = formatDashboardDate(event.date);
             const isActive = selectedEventId === event.id;
             return (
               <button
                 key={event.id}
                 onClick={() => setSelectedEventId(event.id)}
                 className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] font-bold text-sm whitespace-nowrap transition-all border shrink-0 ${
                   isActive 
                     ? 'bg-[#00153d] text-white border-[#00153d] shadow-xl shadow-blue-900/20 scale-105' 
                     : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                 }`}
               >
                 <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                    <span className="text-[8px] uppercase font-black opacity-60 leading-none">{dateInfo.month.slice(0, 3)}</span>
                    <span className={`text-lg font-black leading-none ${isActive ? 'text-white' : 'text-[#00153d]'}`}>{dateInfo.day}</span>
                 </div>
                 <div className="text-left">
                   <p className={`text-[10px] font-black uppercase tracking-wider opacity-60 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                     {event.type === 'service' ? 'Culto' : 'Ensaio'}
                   </p>
                   <p className="text-sm font-bold truncate max-w-[120px]">{event.title}</p>
                 </div>
               </button>
             );
          })}
          {upcomingEvents.length === 0 && (
            <div className="text-slate-400 italic py-4">Nenhum evento agendado para estudo.</div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {selectedEvent ? (
          <motion.div
            key={selectedEvent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2">
               <h3 className="text-2xl font-headline font-black text-[#00153d] flex items-center gap-3">
                 <Music className="text-blue-600" /> Repertório do Dia
                 <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                   {eventSongsList.length} louvores
                 </span>
               </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventSongsList.map((song, index) => {
                const study = isStudying(song.id);
                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group glass p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden ${
                      study?.is_completed ? 'bg-emerald-50/30 border-emerald-100/50' : 'border-white/50 hover:bg-white hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shadow-lg border-2 border-white shrink-0 group-hover:scale-105 transition-transform">
                          {song.cover_url ? (
                            <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                              <Music size={32} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="flex justify-between items-start">
                             <h4 className="text-xl font-headline font-black text-[#00153d] group-hover:text-blue-700 transition-colors cursor-pointer" onClick={() => onSelectSong(song.id)}>
                               {song.title}
                             </h4>
                             {study?.is_completed && <CheckCircle2 size={24} className="text-emerald-500" />}
                          </div>
                          <p className="text-slate-500 font-medium">{song.artist}</p>
                          
                          <div className="flex items-center gap-3 pt-2">
                             <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">
                               Banda: {song.key}
                             </div>
                             {song.originalKey && (
                               <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase">
                                 Original: {song.originalKey}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Links Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {song.links.video && (
                          <a href={song.links.video} target="_blank" rel="noopener noreferrer" 
                             className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all border border-red-100/50 group/link">
                             <Youtube size={20} className="mb-1 group-hover/link:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">YouTube</span>
                          </a>
                        )}
                        {song.links.chords && (
                          <a href={song.links.chords} target="_blank" rel="noopener noreferrer"
                             className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100/50 group/link">
                             <FileText size={20} className="mb-1 group-hover/link:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Cifra</span>
                          </a>
                        )}
                        {song.vocalUrl && (
                          <a href={song.vocalUrl} target="_blank" rel="noopener noreferrer"
                             className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-2xl hover:bg-purple-100 transition-all border border-purple-100/50 group/link">
                             <Mic2 size={20} className="mb-1 group-hover/link:scale-110 transition-transform" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Voz</span>
                          </a>
                        )}
                        <button 
                           onClick={() => study ? onUpdateStudyStatus(study.id, !study.is_completed) : onToggleStudySong(song.id)}
                           className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border group/link ${
                             study?.is_completed 
                               ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
                               : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                           }`}
                        >
                           {study?.is_completed ? <CheckCircle2 size={20} className="mb-1" /> : <Clock size={20} className="mb-1" />}
                           <span className="text-[10px] font-black uppercase tracking-widest">
                             {study?.is_completed ? 'Concluído' : 'Estudar'}
                           </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {eventSongsList.length === 0 && (
                <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-slate-200">
                  <Music size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum louvor escalado para este evento</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="py-20 text-center glass rounded-[3rem] border border-white/50 shadow-xl">
             <Calendar size={64} className="mx-auto text-blue-100 mb-6" />
             <h3 className="text-2xl font-headline font-black text-[#00153d] mb-2">Nada para estudar no momento</h3>
             <p className="text-slate-500 max-w-sm mx-auto">Relaxe! Não há eventos próximos com repertório definido para você praticar agora.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Featured Insight Card */}
      <div className="relative group overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-[3.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative glass bg-gradient-to-br from-[#00153d] to-blue-900 rounded-[3rem] p-10 text-white overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -mr-32 -mt-32" />
          <div className="flex items-start justify-between">
             <div className="space-y-6 max-w-md">
               <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-cyan-400 backdrop-blur-md border border-white/10">
                 <Sparkles size={28} />
               </div>
               <div className="space-y-2">
                 <h3 className="text-3xl font-headline font-black leading-tight">Mantenha a Agilidade</h3>
                 <p className="text-blue-100/70 font-medium">Estudar os louvores no tom correto da banda economiza tempo de ensaio e garante a excelência no louvor.</p>
               </div>
               <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-800 flex items-center justify-center text-[10px] font-black">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-blue-200">Time Manancial em constante aprendizado</span>
               </div>
             </div>
             <div className="hidden md:block">
                <TrendingUp size={120} className="text-white/5 opacity-40 rotate-12" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, TrendingUp, Music, Users, Calendar as CalendarIcon, X, CheckCircle2, Clock, MapPin, Zap, ChevronRight, Lightbulb, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, TeamMember, WorshipEvent, Profile, RehearsalReport, AppNotification, UserSongStudy } from '../../types';
import { formatDashboardDate } from '../../lib/dateUtils';
import { RehearsalWizard } from '../rehearsals/RehearsalWizard';
import { StudyWizard } from './StudyWizard';
import { isLeadership } from '../../lib/permissions';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  rehearsalReports: RehearsalReport[];
  onSelectEvent: (id: string) => void;
  onSelectSong: (id: string) => void;
  onCreateRehearsalReport: (report: Omit<RehearsalReport, 'id'>) => Promise<void>;
  onMarkNotificationAsRead?: (notifId: string) => Promise<void>;
  notificationsData?: AppNotification[];
  userProfile: Profile | null;
  userSongStudy: UserSongStudy[];
  onToggleStudySong: (songId: string) => Promise<void>;
  onUpdateStudyStatus: (studyId: string, isCompleted: boolean) => Promise<void>;
}

export default function Dashboard({ setActiveTab, songs, team, events, rehearsalReports, notificationsData = [], onSelectEvent, onSelectSong, onCreateRehearsalReport, onMarkNotificationAsRead, userProfile, userSongStudy, onToggleStudySong, onUpdateStudyStatus }: DashboardProps) {
  const [isRehearsalWizardOpen, setIsRehearsalWizardOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStudyWizardOpen, setIsStudyWizardOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logic for New Songs (last 7 days) for the Wizard
  const newSongs = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(new Date().getDate() - 7);
    return songs.filter(s => s.createdAt && new Date(s.createdAt) >= weekAgo);
  }, [songs]);

  useEffect(() => {
    const hasSeenWizard = sessionStorage.getItem('hasSeenStudyWizard');
    if (newSongs.length > 0 && !hasSeenWizard) {
      setIsStudyWizardOpen(true);
      sessionStorage.setItem('hasSeenStudyWizard', 'true');
    }
  }, [newSongs.length]);
  
  // Logic to find the next service
  const nextService = events
    .filter(e => e.type === 'service' && new Date(e.date + 'T' + e.time) >= new Date())
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())[0];

  // Logic to find events that occurred but might need review (up to 7 days past)
  const eventsToReview = events
    .filter(e => {
        const eventDate = new Date(e.date + 'T' + e.time);
        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return eventDate < now && eventDate > weekAgo;
    })
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  // Statistics for the top cards
  const stats = [
    { label: 'Louvores ativos', value: songs.length.toString(), icon: Music, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/10', tab: 'repertoire' },
    { label: 'Integrantes', value: team.length.toString(), icon: Users, color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/10', tab: 'team' },
    { label: 'Próximos Eventos', value: events.filter(e => new Date(e.date) >= new Date()).length.toString(), icon: CalendarIcon, color: 'from-cyan-500 to-blue-400', shadow: 'shadow-cyan-500/10', tab: 'schedule' },
    { label: 'Review Pendente', value: eventsToReview.length.toString(), icon: Bell, color: 'from-[#00153d] to-blue-800', shadow: 'shadow-blue-900/10', tab: 'schedule' },
  ].filter(stat => stat.label !== 'Review Pendente' || isLeadership(userProfile));

  // Find the highlight song (most used)
  const highlightSong = [...songs].sort((a, b) => {
    const usageA = (a.timesPlayed || 0) + (a.timesRehearsed || 0);
    const usageB = (b.timesPlayed || 0) + (b.timesRehearsed || 0);
    return usageB - usageA;
  })[0];

  const formatDate = (dateStr: string) => formatDashboardDate(dateStr);

  const notifications = [];
  const now = new Date();

  // 1. Next Service (always show)
  if (nextService) {
    const eventDate = new Date(nextService.date + 'T' + nextService.time);
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    notifications.push({
      id: `next-service-${nextService.id}`,
      type: 'event',
      title: `Próximo: ${nextService.title}`,
      description: `${diffDays <= 3 && diffDays > 0 ? (diffDays === 1 ? 'Amanhã, ' : `Em ${diffDays} dias, `) : ''}${formatDate(nextService.date).day} de ${formatDate(nextService.date).month} às ${nextService.time}`,
      icon: <CalendarIcon size={18} className="text-blue-500" />,
      bg: 'bg-blue-500/10',
      action: () => onSelectEvent(nextService.id),
    });
    
    if (nextService.songs && nextService.songs.length > 0) {
      notifications.push({
        id: `study-songs-${nextService.id}`,
        type: 'study',
        title: 'Louvores para estudar!',
        description: `Você tem ${nextService.songs.length} louvore(s) para revisar antes do ${nextService.title}.`,
        icon: <Music size={18} className="text-cyan-500" />,
        bg: 'bg-cyan-500/10',
        action: () => onSelectEvent(nextService.id),
      });
    }
  }

  // 2. Next Rehearsal (always show)
  const nextRehearsal = events
    .filter(e => e.type === 'rehearsal' && new Date(e.date + 'T' + e.time) >= new Date())
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())[0];

  if (nextRehearsal) {
    const eventDate = new Date(nextRehearsal.date + 'T' + nextRehearsal.time);
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    notifications.push({
      id: `next-rehearsal-${nextRehearsal.id}`,
      type: 'event',
      title: `Próximo Ensaio: ${nextRehearsal.title}`,
      description: `${diffDays <= 3 && diffDays > 0 ? (diffDays === 1 ? 'Amanhã, ' : `Em ${diffDays} dias, `) : ''}${formatDate(nextRehearsal.date).day} de ${formatDate(nextRehearsal.date).month} às ${nextRehearsal.time}`,
      icon: <Zap size={18} className="text-emerald-500" />,
      bg: 'bg-emerald-500/10',
      action: () => onSelectEvent(nextRehearsal.id),
    });
  }

  // 3. Events within 3 days (that are not nextService or nextRehearsal)
  events.forEach(event => {
    if ((nextService && event.id === nextService.id) || (nextRehearsal && event.id === nextRehearsal.id)) return;
    
    const eventDate = new Date(event.date + 'T' + event.time);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= 3) {
      notifications.push({
        id: `event-coming-${event.id}`,
        type: 'event',
        title: `${diffDays === 1 ? 'Amanhã' : `Em ${diffDays} dias`}: ${event.title}`,
        description: `O evento está se aproximando. ${formatDate(event.date).day} de ${formatDate(event.date).month} às ${event.time}`,
        icon: event.type === 'service' ? <CalendarIcon size={18} className="text-blue-500" /> : <Zap size={18} className="text-emerald-500" />,
        bg: event.type === 'service' ? 'bg-blue-500/10' : 'bg-emerald-500/10',
        action: () => onSelectEvent(event.id),
      });
      
      if (event.songs && event.songs.length > 0) {
        notifications.push({
          id: `study-songs-${event.id}`,
          type: 'study',
          title: 'Louvores para estudar!',
          description: `Você tem ${event.songs.length} louvore(s) para revisar antes do ${event.title}.`,
          icon: <Music size={18} className="text-cyan-500" />,
          bg: 'bg-cyan-500/10',
          action: () => onSelectEvent(event.id),
        });
      }
    }
  });

  // 4. Newly added songs (last 7 days)
  songs.forEach(song => {
    if (song.createdAt) {
      const createdDate = new Date(song.createdAt);
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        notifications.push({
          id: `new-song-${song.id}`,
          type: 'study',
          title: 'Novo Louvor Adicionado',
          description: `"${song.title}" foi adicionado recentemente ao repertório.`,
          icon: <Music size={18} className="text-purple-500" />,
          bg: 'bg-purple-500/10',
          action: () => onSelectSong(song.id),
        });
      }
    }
  });

  // 5. Pending reviews
  if (eventsToReview.length > 0) {
    notifications.push({
      id: 'review',
      type: 'alert',
      title: 'Eventos pendentes de revisão',
      description: `Você tem ${eventsToReview.length} evento(s) precisando de revisão de ensaio.`,
      icon: <Bell size={18} className="text-red-500" />,
      bg: 'bg-red-500/10',
      action: () => setActiveTab('schedule'),
    });
  }

  // 6. Global Songs needing rehearsal
  const songsNeedingRehearsal = songs.filter(s => s.rehearsalNeed === 'intensive_rehearsal' || s.rehearsalNeed === 'needs_rehearsal');
  if (songsNeedingRehearsal.length > 0) {
    notifications.push({
      id: 'songs-rehearsal',
      type: 'study',
      title: 'Atenção aos Louvores',
      description: `${songsNeedingRehearsal.length} louvore(s) precisam de ensaio extra.`,
      icon: <TrendingUp size={18} className="text-orange-500" />,
      bg: 'bg-orange-500/10',
      action: () => setActiveTab('repertoire'),
    });
  }

  // 7. External Notifications
  notificationsData.forEach(notif => {
    // Check if applicable
    if (notif.target_user && notif.target_user !== userProfile?.id) return;
    const isMinisterOrPastor = userProfile?.role === 'minister' || userProfile?.role === 'pastor';
    if (notif.target_role === 'minister' && !isMinisterOrPastor) return;
    if (notif.target_role && notif.target_role !== 'all' && notif.target_role !== 'minister' && notif.target_role !== userProfile?.role) return;

    
    // Check if read
    const isReadExternally = (notif as any)._reads?.includes(userProfile?.id);
    if (isReadExternally) return;

    const isSuggestion = notif.type === 'suggestion';

    notifications.push({
      id: notif.id,
      type: notif.type,
      title: isSuggestion && isMinisterOrPastor ? 'Aprovar Sugestão' : notif.title,
      description: isSuggestion && isMinisterOrPastor ? `${notif.message} (Toque para avaliar)` : notif.message,
      icon: isSuggestion ? <Lightbulb size={18} className="text-yellow-500" /> : <Bell size={18} className="text-blue-500" />,
      bg: isSuggestion ? 'bg-yellow-500/10' : 'bg-blue-500/10',
      action: () => {
        if (onMarkNotificationAsRead) onMarkNotificationAsRead(notif.id);
        if (isSuggestion) setActiveTab('suggestions');
      },
      isExternal: true,
    });
  });

  // Filter out locally dismissed notifications
  const activeNotifications = notifications.filter(n => !dismissedNotifs.includes(n.id));

  const clearNotifications = () => {
    const idsToDismiss = activeNotifications.map(n => n.id);
    
    // Mark external as read
    activeNotifications.forEach(n => {
      if ((n as any).isExternal && onMarkNotificationAsRead) {
        onMarkNotificationAsRead(n.id);
      }
    });

    const newDismissed = [...new Set([...dismissedNotifs, ...idsToDismiss])];
    setDismissedNotifs(newDismissed);
    localStorage.setItem('dismissedNotifs', JSON.stringify(newDismissed));
    setIsNotificationsOpen(false);
  };

  // Logic for study list
  const songsToStudy = userSongStudy.map(study => {
    const song = songs.find(s => s.id === study.song_id);
    return song ? { ...song, studyId: study.id, isCompleted: study.is_completed } : null;
  }).filter((s): s is (Song & { studyId: string, isCompleted: boolean }) => s !== null);

  const upcomingEventSongs = events
    .filter(e => new Date(e.date + 'T' + e.time) >= new Date())
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
    .slice(0, 3)
    .flatMap(e => e.songs.map(songId => ({ songId, eventTitle: e.title, eventDate: e.date })));

  const isStudying = (songId: string) => userSongStudy.some(s => s.song_id === songId);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {isLeadership(userProfile) && (
            <button 
              onClick={() => setIsRehearsalWizardOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-[1.8rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 group"
            >
              <Zap size={20} className="group-hover:animate-pulse" />
              <span>Finalizar Ensaio</span>
            </button>
          )}
          <div className="relative z-50" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-5 glass rounded-[1.5rem] text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95 border border-white/50 relative"
            >
              <Bell size={24} />
              {activeNotifications.length > 0 && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-[2rem] overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100/50 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline font-extrabold text-lg text-[#00153d]">Notificações</h3>
                      {activeNotifications.length > 0 && (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={clearNotifications}
                            className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            Limpar
                          </button>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            {activeNotifications.length} Novas
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                    {activeNotifications.length > 0 ? (
                      activeNotifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            notif.action();
                            setIsNotificationsOpen(false);
                          }}
                          className="p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${notif.bg}`}>
                            {notif.icon}
                          </div>
                          <div>
                            <p className="font-bold text-[#00153d] text-sm group-hover:text-blue-600 transition-colors">{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Nenhuma notificação no momento.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          className="lg:col-span-8 space-y-10"
        >
          {/* Next Service Card */}
          <div 
            onClick={() => nextService && onSelectEvent(nextService.id)}
            className="relative overflow-hidden glass p-10 rounded-[3.5rem] cursor-pointer group transition-all duration-500 border border-white/50 shadow-2xl hover:shadow-blue-500/10"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="flex items-center justify-between mb-10">
              <h3 className="relative z-10 text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
                Próximo Culto
                {nextService && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                )}
              </h3>
              {nextService && (
                  <div className="px-4 py-2 bg-[#00153d] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                    Preparando Detalhes
                  </div>
              )}
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Liderança e Repertório</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nextService.songs.slice(0, 4).map(songId => {
                        const song = songs.find(s => s.id === songId);
                        return (
                          <div
                            key={songId}
                            className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStudySong(songId);
                                }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  isStudying(songId) 
                                    ? 'bg-amber-100 text-amber-600 shadow-sm' 
                                    : 'bg-slate-50 text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                                }`}
                                title={isStudying(songId) ? "Remover do estudo" : "Marcar para estudar"}
                              >
                                {isStudying(songId) ? <CheckCircle2 size={14} /> : <Music size={14} />}
                              </button>
                              <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{song?.title || 'Louvor Selecionado'}</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{song?.key || '--'}</span>
                          </div>
                        );
                      })}
                      {nextService.songs.length === 0 && (
                          <p className="text-xs text-slate-400 italic p-4">Nenhum louvor selecionado ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-72 space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Time Escalado</p>
                  <div className="bg-white/40 border border-white/60 rounded-3xl p-6">
                    <div className="flex flex-wrap gap-2">
                      {[...nextService.team.vocal, ...Object.values(nextService.team.instruments)].slice(0, 6).map((name, i) => (
                        <div key={i} title={name} className="w-10 h-10 rounded-xl bg-[#00153d] text-white flex items-center justify-center text-[10px] font-black uppercase shadow-md border-2 border-white">
                          {name.charAt(0)}
                        </div>
                      ))}
                      {(nextService.team.vocal.length + Object.keys(nextService.team.instruments).length) > 6 && (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black border-2 border-white">
                              +{(nextService.team.vocal.length + Object.keys(nextService.team.instruments).length) - 6}
                          </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(nextService.id);
                    }}
                    className="w-full py-4 bg-[#00153d] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all active:scale-95 group/btn"
                  >
                    <span>Ver Detalhes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon size={32} className="opacity-20 translate-y-1" />
                </div>
                <p className="font-bold text-lg text-[#00153d]">Tudo calmo por aqui</p>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Nenhum culto agendado para os próximos dias. Hora de planejar!</p>
              </div>
            )}
          </div>

          {/* My Study List Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
                Minha Lista de Estudo
                {songsToStudy.length > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black">
                    {songsToStudy.filter(s => !s.isCompleted).length} PENDENTES
                  </span>
                )}
              </h3>
            </div>

            {songsToStudy.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {songsToStudy.map(song => (
                  <div 
                    key={song.id}
                    className={`glass p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group ${song.isCompleted ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'border-white/60 hover:border-amber-500/30'}`}
                  >
                    <div className="flex items-center gap-4 flex-1" onClick={() => onSelectSong(song.id)}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${song.isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-600'}`}>
                        {song.isCompleted ? <CheckCircle2 size={24} /> : <Music size={24} />}
                      </div>
                      <div className="cursor-pointer">
                        <p className={`font-bold text-[#00153d] group-hover:text-amber-700 transition-colors ${song.isCompleted ? 'line-through text-slate-400' : ''}`}>{song.title}</p>
                        <p className="text-xs text-slate-500 font-medium">{song.artist}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateStudyStatus(song.studyId, !song.isCompleted)}
                        className={`p-3 rounded-xl transition-all ${song.isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        title={song.isCompleted ? "Desmarcar como concluído" : "Marcar como concluído"}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button 
                        onClick={() => onToggleStudySong(song.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remover da lista"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass p-10 rounded-[3rem] border border-dashed border-slate-200 text-center">
                <p className="text-slate-400 font-medium">Você ainda não marcou nenhuma música para estudar.</p>
                <p className="text-xs text-slate-400 mt-1">Marque músicas nos próximos cultos para acompanhá-las aqui!</p>
              </div>
            )}
          </div>

          {/* Review Section */}
          {isLeadership(userProfile) && eventsToReview.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
                  Revisar Repertórios Recentes
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black animate-pulse">PENDENTE ({eventsToReview.length})</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsToReview.slice(0, 2).map(event => (
                    <div 
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      className="glass p-6 rounded-[2rem] border border-white/60 hover:border-blue-500/30 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-[#00153d] group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Music size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#00153d] truncate max-w-[150px]">{event.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(event.date).day} {formatDate(event.date).weekday}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="lg:col-span-4 flex flex-col gap-8"
        >
          {/* Suggestions Card */}
          <button 
            onClick={() => setActiveTab('suggestions')}
            className="w-full p-8 rounded-[3rem] text-left relative overflow-hidden group hover:-translate-y-2 transition-all duration-500 border border-yellow-500/20 bg-gradient-to-br from-white to-yellow-50/50 shadow-xl"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/10 rounded-bl-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-yellow-500/30 group-hover:rotate-6 transition-transform">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-xl font-headline font-extrabold text-[#00153d]">Sugestões de Louvor</h3>
              <p className="text-sm text-slate-500 font-medium">Ajude a construir o repertório do ministério.</p>
              
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-600 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
                Ver e sugerir <ChevronRight size={14} />
              </div>
            </div>
          </button>

          {/* Insights Card */}
          <button 
            onClick={() => setActiveTab('insights')}
            className="w-full p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-[0_20px_50px_rgba(8,112,184,0.3)] group hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(8,112,184,0.5)] transition-all duration-700 text-left border border-white/20 bg-gradient-to-br from-[#00153d] via-blue-800 to-cyan-600 h-fit"
          >
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
          
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-2">Engajamento Total</p>
              <h4 className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors drop-shadow-md">
                {highlightSong ? highlightSong.title : 'Analise em curso...'}
              </h4>
              <p className="text-sm text-blue-100 mt-1">{highlightSong ? highlightSong.artist : 'Sincronizando dados'}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: highlightSong ? `${Math.min(100, (highlightSong.timesPlayed || 0) * 10)}%` : '0%' }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-300 shadow-[0_0_15px_rgba(34,211,238,0.8)]" 
                  />
                </div>
                <span className="text-[10px] font-black text-cyan-300">{highlightSong ? (highlightSong.timesPlayed || 0) + (highlightSong.timesRehearsed || 0) : 0} usos</span>
              </div>
            </div>

            <div className="p-6 bg-[#00153d]/40 backdrop-blur-md rounded-[2rem] border border-black/10 group-hover:bg-[#00153d]/50 transition-all duration-500 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-0.5">Relatórios</p>
                  <p className="text-lg font-bold text-white drop-shadow-md">{rehearsalReports.length} Ensaio{rehearsalReports.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-blue-100 mt-0.5">Participação ativa registrada.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-2 opacity-80 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-100 group-hover:text-white transition-colors flex items-center gap-2">
                Acessar Portal de Insights &rarr;
              </p>
            </div>
          </div>
          </button>
        </motion.div>
      </div>
      <RehearsalWizard 
        isOpen={isRehearsalWizardOpen}
        onClose={() => setIsRehearsalWizardOpen(false)}
        songs={songs}
        team={team}
        events={events}
        onSubmit={(report) => onCreateRehearsalReport({ ...report, minister_id: userProfile?.id })}
      />
      <AnimatePresence>
        {isStudyWizardOpen && (
          <StudyWizard
            newSongs={newSongs}
            onClose={() => setIsStudyWizardOpen(false)}
            onSelectSong={(id) => {
              onSelectSong(id);
              setIsStudyWizardOpen(false);
            }}
            onGoToStudyHub={() => {
              setActiveTab('study');
              setIsStudyWizardOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

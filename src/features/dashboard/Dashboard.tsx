import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, TrendingUp, Music, Users, Calendar as CalendarIcon, X, CheckCircle2, Clock, MapPin, Zap, ChevronRight, Lightbulb, LayoutGrid, LayoutList, BookOpen, AlertCircle, PlayCircle, Star } from 'lucide-react';
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

type DashboardFilter = 'all' | 'events' | 'study' | 'admin';

export default function Dashboard({ setActiveTab, songs, team, events, rehearsalReports, notificationsData = [], onSelectEvent, onSelectSong, onCreateRehearsalReport, onMarkNotificationAsRead, userProfile, userSongStudy, onToggleStudySong, onUpdateStudyStatus }: DashboardProps) {
  const [isRehearsalWizardOpen, setIsRehearsalWizardOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStudyWizardOpen, setIsStudyWizardOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all');
  const [isCompactMode, setIsCompactMode] = useState(false);
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
    
    if (nextService.songs || nextService.offeringSongs || nextService.outroSongs) {
      const totalSongs = (nextService.songs?.length || 0) + (nextService.offeringSongs?.length || 0) + (nextService.outroSongs?.length || 0);
      if (totalSongs > 0) {
        notifications.push({
          id: `study-songs-${nextService.id}`,
          type: 'study',
          title: 'Louvores para estudar!',
          description: `Você tem ${totalSongs} louvore(s) para revisar antes do ${nextService.title}.`,
          icon: <Music size={18} className="text-cyan-500" />,
          bg: 'bg-cyan-500/10',
          action: () => onSelectEvent(nextService.id),
        });
      }
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
      
      const totalSongs = (event.songs?.length || 0) + (event.offeringSongs?.length || 0) + (event.outroSongs?.length || 0);
      if (totalSongs > 0) {
        notifications.push({
          id: `study-songs-${event.id}`,
          type: 'study',
          title: 'Louvores para estudar!',
          description: `Você tem ${totalSongs} louvore(s) para revisar antes do ${event.title}.`,
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
  const songsToStudy = userSongStudy
    .filter(study => study.user_id === userProfile?.id)
    .map(study => {
      const song = songs.find(s => s.id === study.song_id);
      return song ? { ...song, studyId: study.id, isCompleted: study.is_completed } : null;
    }).filter((s): s is (Song & { studyId: string, isCompleted: boolean }) => s !== null);

  const upcomingEvents = events
    .filter(e => new Date(e.date + 'T' + e.time) >= new Date() && e.id !== nextService?.id)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const isStudying = (songId: string) => userSongStudy.some(s => s.song_id === songId && s.user_id === userProfile?.id);

  // Define the Mini-Directory Quick Access items
  const quickAccess = [
    { id: 'repertoire', label: 'Repertório', desc: 'Gerenciar louvores', icon: Music, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'team', label: 'Equipe', desc: 'Membros e perfis', icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { id: 'schedule', label: 'Agenda', desc: 'Cultos e ensaios', icon: CalendarIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'study', label: 'Estudo', desc: 'Meu aprendizado', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'suggestions', label: 'Sugestões', desc: 'Ideias de louvores', icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { id: 'insights', label: 'Estatísticas', desc: 'Dados e métricas', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-5"
        >
          {userProfile?.avatar_url && (
            <img 
              src={userProfile.avatar_url} 
              alt="Profile" 
              className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg shrink-0"
            />
          )}
          <div>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight mb-1">
              Olá, {userProfile?.name?.split(' ')[0] || 'Ministério'}!
            </h2>
            <p className="text-slate-500 font-medium text-lg">Seja bem-vindo(a) ao seu painel.</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {isLeadership(userProfile) && (
            <button 
              onClick={() => setIsRehearsalWizardOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 group"
            >
              <Zap size={20} className="group-hover:animate-pulse" />
              <span className="hidden sm:inline">Finalizar Ensaio</span>
              <span className="sm:hidden">Ensaio</span>
            </button>
          )}
          <div className="relative z-50" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-4 glass rounded-2xl text-slate-500 hover:text-blue-600 transition-all hover:scale-105 active:scale-95 border border-white/50 relative shadow-sm"
            >
              <Bell size={24} />
              {activeNotifications.length > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
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
                  
                  <div className="max-h-[400px] overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
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

      {/* Control Bar: Filters & Layout Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-40 bg-slate-50/80 backdrop-blur-md p-2 -mx-2 rounded-2xl border border-white/50 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 flex-1" style={{ scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setActiveFilter('all')} 
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-[#00153d] border border-slate-200'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveFilter('events')} 
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'events' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'}`}
          >
            Agenda & Eventos
          </button>
          <button 
            onClick={() => setActiveFilter('study')} 
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'study' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white text-slate-500 hover:bg-amber-50 hover:text-amber-600 border border-slate-200'}`}
          >
            Meu Estudo
          </button>
          {isLeadership(userProfile) && (
            <button 
              onClick={() => setActiveFilter('admin')} 
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'admin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'}`}
            >
              Liderança
            </button>
          )}
        </div>
        
        <button 
          onClick={() => setIsCompactMode(!isCompactMode)} 
          className="hidden md:flex shrink-0 items-center justify-center p-3 bg-white rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 shadow-sm transition-all"
          title={isCompactMode ? "Ver modo expandido" : "Ver modo compacto"}
        >
          {isCompactMode ? <LayoutList size={18} /> : <LayoutGrid size={18} />}
        </button>
      </div>

      <div className="space-y-12">
        {/* Quick Access (Mini-Directory) */}
        {(activeFilter === 'all') && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-headline font-extrabold text-[#00153d] px-2 flex items-center gap-2">
              <Star size={18} className="text-blue-500" /> Acesso Rápido
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
              {quickAccess.map((item, idx) => (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id} 
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-start gap-4 glass p-5 rounded-[2rem] border ${item.border} hover:border-${item.color.split('-')[1]}-400 shadow-sm hover:shadow-lg transition-all min-w-[160px] shrink-0 group`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                    <item.icon size={22} />
                  </div>
                  <div className="text-left">
                    <span className="block font-headline font-bold text-[#00153d] text-base group-hover:text-blue-600 transition-colors">{item.label}</span>
                    <span className="block text-xs font-medium text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Grid (Admin or All) */}
        {(activeFilter === 'all' || activeFilter === 'admin') && (
          <section className={`grid gap-4 sm:gap-6 ${isCompactMode ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            {stats.map((stat, index) => (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                key={stat.label} 
                onClick={() => setActiveTab(stat.tab)}
                className={`relative overflow-hidden glass rounded-[2rem] group text-left w-full transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] border border-white/60 shadow-md hover:shadow-xl ${isCompactMode ? 'p-5' : 'p-8'}`}
              >
                <div className={`relative z-10 bg-gradient-to-br ${stat.color} rounded-[1.2rem] flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${isCompactMode ? 'w-10 h-10 mb-4' : 'w-14 h-14 mb-6'}`}>
                  <stat.icon size={isCompactMode ? 20 : 26} strokeWidth={2.5} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 group-hover:text-blue-600 transition-colors">{stat.label}</p>
                  <p className={`${isCompactMode ? 'text-2xl' : 'text-3xl md:text-4xl'} font-headline font-extrabold text-[#00153d]`}>{stat.value}</p>
                </div>
              </motion.button>
            ))}
          </section>
        )}

        {/* Next Service Highlights */}
        {nextService && (activeFilter === 'all' || activeFilter === 'events') && (
          <motion.div 
            layout
            className={`relative overflow-hidden glass rounded-[2.5rem] md:rounded-[3.5rem] border border-white/60 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group ${isCompactMode ? 'p-6 sm:p-8' : 'p-8 sm:p-12'}`}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            {isCompactMode ? (
              // COMPACT MODE
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex flex-1 items-center gap-5">
                  <div className="w-16 h-16 bg-[#00153d] rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-xl group-hover:rotate-3 transition-transform p-2 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">{formatDate(nextService.date).weekday}</span>
                    <span className="text-2xl font-headline font-extrabold leading-none mt-0.5">{formatDate(nextService.date).day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      Próximo Culto
                    </p>
                    <h4 className="font-headline font-extrabold text-xl sm:text-2xl text-[#00153d] truncate group-hover:text-blue-700 transition-colors">{nextService.title}</h4>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm flex flex-wrap items-center gap-x-2 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} className="text-blue-500" /> {nextService.time}</span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1 truncate"><MapPin size={14} className="text-blue-500" /> {nextService.location || 'Igreja Manancial'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                  <div className="hidden md:flex -space-x-3 mr-2">
                    {[...nextService.team.vocal, ...Object.values(nextService.team.instruments)].slice(0, 4).map((name, i) => (
                      <div key={i} title={name} className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00153d] to-blue-900 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-md border-2 border-white ring-2 ring-transparent group-hover:ring-blue-100 transition-all z-10">
                        {name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => onSelectEvent(nextService.id)}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#00153d] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-900 hover:shadow-lg hover:shadow-blue-900/20 transition-all active:scale-95"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ) : (
              // EXPANDED MODE
              <>
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <h3 className="text-2xl font-headline font-extrabold text-[#00153d] flex items-center gap-3">
                    Próximo Culto
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </h3>
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-[#00153d] group-hover:text-white transition-colors">
                    Destaque
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#00153d] to-blue-900 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl shadow-blue-900/20 group-hover:-translate-y-1 transition-transform p-2">
                        <span className="text-xs font-black uppercase tracking-tighter opacity-70">{formatDate(nextService.date).weekday}</span>
                        <span className="text-3xl font-headline font-extrabold leading-none mt-1">{formatDate(nextService.date).day}</span>
                      </div>
                      <div>
                        <h4 className="font-headline font-extrabold text-2xl text-[#00153d] group-hover:text-blue-700 transition-colors tracking-tight">{nextService.title}</h4>
                        <p className="text-slate-500 font-medium flex items-center gap-2 mt-2">
                          <Clock size={16} className="text-blue-500" /> {nextService.time} 
                          <span className="text-slate-300">•</span>
                          <MapPin size={16} className="text-blue-500" /> {nextService.location || 'Igreja Manancial'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <Music size={12} /> Repertório Planejado
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[...(nextService.songs || []), ...(nextService.offeringSongs || []), ...(nextService.outroSongs || [])].slice(0, 4).map((songId, idx) => {
                          const song = songs.find(s => s.id === songId);
                          return (
                            <div
                              key={`${songId}-${idx}`}
                              className="flex items-center justify-between p-4 bg-white/60 hover:bg-white border border-white/80 hover:border-blue-200 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                              onClick={() => onSelectSong(songId)}
                            >
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleStudySong(songId);
                                  }}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    isStudying(songId) 
                                      ? 'bg-amber-100 text-amber-600 shadow-inner' 
                                      : 'bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  }`}
                                  title={isStudying(songId) ? "Remover do estudo" : "Marcar para estudar"}
                                >
                                  {isStudying(songId) ? <CheckCircle2 size={16} /> : <BookOpen size={16} />}
                                </button>
                                <span className="text-sm font-bold text-slate-700 truncate max-w-[140px] group-hover:text-blue-700 transition-colors">{song?.title || 'Louvor Selecionado'}</span>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{song?.key || '--'}</span>
                            </div>
                          );
                        })}
                        {((nextService.songs?.length || 0) + (nextService.offeringSongs?.length || 0) + (nextService.outroSongs?.length || 0)) === 0 && (
                            <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center gap-2">
                              <Music size={20} className="text-slate-300" />
                              <p className="text-sm font-medium text-slate-400">Nenhum louvor selecionado ainda.</p>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full lg:w-72 space-y-6 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-3 flex items-center gap-2">
                        <Users size={12} /> Time Escalado
                      </p>
                      <div className="bg-white/60 border border-white/80 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                          {[...nextService.team.vocal, ...Object.values(nextService.team.instruments)].slice(0, 8).map((name, i) => (
                            <div key={i} title={name} className="w-10 h-10 rounded-[10px] bg-[#00153d] text-white flex items-center justify-center text-xs font-black uppercase shadow-sm border-2 border-white hover:scale-110 transition-transform cursor-help">
                              {name.charAt(0)}
                            </div>
                          ))}
                          {(nextService.team.vocal.length + Object.keys(nextService.team.instruments).length) > 8 && (
                              <div className="w-10 h-10 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border-2 border-white">
                                  +{(nextService.team.vocal.length + Object.keys(nextService.team.instruments).length) - 8}
                              </div>
                          )}
                          {(nextService.team.vocal.length + Object.keys(nextService.team.instruments).length) === 0 && (
                            <p className="text-xs font-medium text-slate-400">Equipe em formação.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onSelectEvent(nextService.id)}
                      className="w-full py-4 bg-[#00153d] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 hover:shadow-blue-900/30 transition-all active:scale-95 group/btn"
                    >
                      <span>Visualizar Evento Completo</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Other Events Horizontal List */}
        {upcomingEvents.length > 0 && (activeFilter === 'all' || activeFilter === 'events') && (
          <div className="space-y-4">
            <h3 className="text-lg font-headline font-extrabold text-[#00153d] px-2 flex items-center gap-2">
              <CalendarIcon size={20} className="text-blue-500" /> Próximos Eventos
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
              {upcomingEvents.map(event => (
                <div 
                  key={event.id} 
                  onClick={() => onSelectEvent(event.id)} 
                  className="min-w-[260px] max-w-[280px] glass p-6 rounded-[2rem] border border-white/60 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all cursor-pointer group shrink-0"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${event.type === 'rehearsal' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'} transition-colors`}>
                       {event.type === 'rehearsal' ? <Zap size={20} /> : <CalendarIcon size={20} />}
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">{formatDate(event.date).month}</span>
                      <span className="block text-2xl font-headline font-extrabold text-[#00153d] leading-none mt-0.5">{formatDate(event.date).day}</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-[#00153d] text-base mb-1.5 truncate group-hover:text-blue-700 transition-colors">{event.title}</h4>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5"><Clock size={12} className="opacity-70"/> {event.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Study List Section (Horizontal) */}
        {(activeFilter === 'all' || activeFilter === 'study') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-headline font-extrabold text-[#00153d] flex items-center gap-2">
                <BookOpen size={20} className="text-amber-500" /> Minha Lista de Estudo
                {songsToStudy.length > 0 && (
                  <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black tracking-wider">
                    {songsToStudy.filter(s => !s.isCompleted).length} PENDENTES
                  </span>
                )}
              </h3>
              {songsToStudy.length > 0 && (
                <button onClick={() => setActiveTab('study')} className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
                  Ver Tudo <ChevronRight size={14}/>
                </button>
              )}
            </div>

            {songsToStudy.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {songsToStudy.map(song => (
                  <div 
                    key={song.id}
                    className={`min-w-[280px] md:min-w-[320px] glass p-5 rounded-[2rem] border transition-all flex flex-col justify-between gap-4 group shrink-0 ${song.isCompleted ? 'bg-slate-50/50 border-slate-200 opacity-70' : 'border-white/60 hover:border-amber-400 hover:shadow-lg shadow-sm'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer" onClick={() => onSelectSong(song.id)}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${song.isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-600'}`}>
                          {song.isCompleted ? <CheckCircle2 size={20} /> : <PlayCircle size={20} />}
                        </div>
                        <div className="overflow-hidden">
                          <p className={`font-bold text-sm truncate group-hover:text-amber-700 transition-colors ${song.isCompleted ? 'line-through text-slate-400' : 'text-[#00153d]'}`}>{song.title}</p>
                          <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <button 
                          onClick={() => onUpdateStudyStatus(song.studyId, !song.isCompleted)}
                          className={`p-2.5 rounded-xl transition-all ${song.isCompleted ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={song.isCompleted ? "Desmarcar como concluído" : "Marcar como concluído"}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-2 glass p-8 rounded-[2.5rem] border border-dashed border-slate-300 text-center bg-slate-50/50">
                <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Nenhum estudo pendente no momento.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Sua lista de estudo está vazia. Adicione músicas clicando no ícone de livro ao visualizar eventos ou repertório.</p>
              </div>
            )}
          </div>
        )}

        {/* Mixed Area: Reviews, Suggestions, Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
          {/* Admin Reviews */}
          {isLeadership(userProfile) && eventsToReview.length > 0 && (activeFilter === 'all' || activeFilter === 'admin') && (
            <div className="space-y-4">
              <h3 className="text-lg font-headline font-extrabold text-[#00153d] flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" /> Relatórios Pendentes
              </h3>
              <div className="space-y-3">
                {eventsToReview.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onSelectEvent(event.id)}
                    className="glass p-5 rounded-[2rem] border border-red-100 bg-red-50/30 hover:border-red-300 hover:bg-red-50/50 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                        <Zap size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#00153d] truncate max-w-[200px]">{event.title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{formatDate(event.date).day} {formatDate(event.date).month}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-red-300 group-hover:text-red-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions Banner */}
          {(activeFilter === 'all' || activeFilter === 'admin' || activeFilter === 'study') && (
            <div className="space-y-4 h-full">
              <h3 className="text-lg font-headline font-extrabold text-[#00153d] flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-500" /> Comunidade
              </h3>
              <button 
                onClick={() => setActiveTab('suggestions')}
                className="w-full h-[calc(100%-2.5rem)] min-h-[140px] p-8 rounded-[2.5rem] text-left relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-yellow-500/20 bg-gradient-to-br from-yellow-50 to-amber-50/50 shadow-md hover:shadow-xl hover:shadow-yellow-500/10 flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-bl-full pointer-events-none group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/30 group-hover:rotate-12 transition-transform shrink-0">
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-extrabold text-[#00153d]">Sugestões de Louvor</h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">Ajude a construir o repertório do nosso ministério.</p>
                  </div>
                </div>
                <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest group-hover:text-amber-700 transition-colors">
                  Acessar Painel <ChevronRight size={14} />
                </div>
              </button>
            </div>
          )}
        </div>
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

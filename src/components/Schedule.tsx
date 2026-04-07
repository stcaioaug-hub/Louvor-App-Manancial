import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  ChevronRight, 
  Music, 
  Filter, 
  ChevronLeft,
  LayoutGrid,
  List as ListIcon,
  X,
  Plus,
  CheckCircle2,
  Edit2,
  Save,
  Search,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorshipEvent, Song } from '../types';
import { BackButton } from './BackButton';
import { formatFullDate } from '../lib/dateUtils';

interface ScheduleProps {
  events: WorshipEvent[];
  songs: Song[];
  onSelectEvent: (id: string) => void;
  onCreateEvent?: (event: Omit<WorshipEvent, 'id'>) => Promise<void>;
  onUpdateEvent?: (event: WorshipEvent) => Promise<void>;
  canEdit?: boolean;
  onBack?: () => void;
}

export default function Schedule({ events, songs, onSelectEvent, onCreateEvent, onUpdateEvent, canEdit, onBack }: ScheduleProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'all' | 'rehearsal'>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Inline Edit State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorshipEvent>>({});
  const [showInlineSongSearch, setShowInlineSongSearch] = useState(false);
  const [inlineSongSearch, setInlineSongSearch] = useState('');
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [songSearchTerm, setSongSearchTerm] = useState('');
  const [newEvent, setNewEvent] = useState<Partial<WorshipEvent>>({
    type: 'service',
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    location: 'Igreja Manancial',
    songs: [],
    team: { vocal: [], instruments: {} }
  });
  const [isCreating, setIsCreating] = useState(false);

  const filteredEvents = events.filter(e => {
    if (filter === 'rehearsal') return e.type === 'rehearsal';
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatDate = (dateStr: string) => formatFullDate(dateStr);

  const getSongTitle = (id: string) => {
    return songs.find(s => s.id === id)?.title || 'Música desconhecida';
  };

  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    const calendarDays = [];
    
    for (let x = firstDayIndex - 1; x >= 0; x--) {
        calendarDays.push({ date: new Date(year, month - 1, prevMonthDays - x), isCurrentMonth: false });
    }
    for (let i = 1; i <= days; i++) {
        calendarDays.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingSlots = 42 - calendarDays.length;
    for (let j = 1; j <= remainingSlots; j++) {
        calendarDays.push({ date: new Date(year, month + 1, j), isCurrentMonth: false });
    }
    return calendarDays;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const todayMonth = () => setCurrentMonth(new Date());

  const handleEmptyDayClick = (date: Date) => {
    if (!canEdit) return;
    setNewEvent({ ...newEvent, date: toDateString(date), title: '', songs: [] });
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleCreateEvent = async () => {
    if (!onCreateEvent) return;
    try {
      setIsCreating(true);
      await onCreateEvent({
        ...newEvent,
        title: newEvent.title || 'Novo Evento',
        type: newEvent.type || 'service',
        date: newEvent.date || new Date().toISOString().split('T')[0],
        time: newEvent.time || '19:30',
        songs: newEvent.songs || [],
        team: { vocal: [], instruments: {} }
      } as Omit<WorshipEvent, 'id'>);
      setShowWizard(false);
      setWizardStep(4);
    } catch {
      // do nothing
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddSongWizard = (songId: string) => {
    setNewEvent(prev => ({
      ...prev,
      songs: [...(prev.songs || []), songId]
    }));
  };

  const handleRemoveSongWizard = (songId: string) => {
    setNewEvent(prev => ({
      ...prev,
      songs: (prev.songs || []).filter(id => id !== songId)
    }));
  };

  const moveSongWizard = (index: number, direction: 'up' | 'down') => {
    const songsList = [...(newEvent.songs || [])];
    if (direction === 'up' && index > 0) {
       [songsList[index - 1], songsList[index]] = [songsList[index], songsList[index - 1]];
    } else if (direction === 'down' && index < songsList.length - 1) {
       [songsList[index + 1], songsList[index]] = [songsList[index], songsList[index + 1]];
    }
    setNewEvent({ ...newEvent, songs: songsList });
  };

  const suggestedSongs = songs.filter(s => 
    (s.title.toLowerCase().includes(songSearchTerm.toLowerCase()) || 
     s.artist.toLowerCase().includes(songSearchTerm.toLowerCase())) &&
    !(newEvent.songs || []).includes(s.id)
  ).slice(0, 5);

  const inlineSuggestedSongs = songs.filter(s => 
    (inlineSongSearch && (s.title.toLowerCase().includes(inlineSongSearch.toLowerCase()) || 
     s.artist.toLowerCase().includes(inlineSongSearch.toLowerCase()))) &&
    !(editForm.songs || []).includes(s.id)
  ).slice(0, 5);

  const handleEditClick = (event: WorshipEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEventId(event.id);
    setEditForm({ ...event });
    setShowInlineSongSearch(false);
    setInlineSongSearch('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEventId(null);
    setEditForm({});
    setShowInlineSongSearch(false);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateEvent || !editingEventId || !editForm) return;
    try {
      await onUpdateEvent({ ...editForm } as WorshipEvent);
      setEditingEventId(null);
      setEditForm({});
    } catch {
      // error handling
    }
  };

  const toggleEditType = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm(prev => ({ ...prev, type: prev.type === 'service' ? 'rehearsal' : 'service' }));
  };

  const removeInlineSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm(prev => ({ ...prev, songs: (prev.songs || []).filter(id => id !== songId) }));
  };

  const addInlineSong = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm(prev => ({ ...prev, songs: [...(prev.songs || []), songId] }));
    setInlineSongSearch('');
    setShowInlineSongSearch(false);
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
           className="space-y-4"
        >
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Linha do Tempo</p>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight">Agenda</h2>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-2 rounded-[1.5rem] shadow-xl shadow-blue-900/[0.02] border border-white/80 w-full md:w-auto">
          <button 
            onClick={() => setView('list')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'list' ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-white'
            }`}
          >
            <ListIcon size={18} />
            <span>Lista</span>
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              view === 'calendar' ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-white'
            }`}
          >
            <CalendarIcon size={18} />
            <span>Calendário</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar w-full sm:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'all' ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-500 border border-black/5 hover:bg-slate-50'
            }`}
          >
            Todos os Eventos
          </button>
          <button 
            onClick={() => setFilter('rehearsal')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'rehearsal' ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' : 'bg-white text-slate-500 border border-black/5 hover:bg-slate-50'
            }`}
          >
            Somente Ensaios
          </button>
        </div>
        
        {canEdit && (
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-full font-bold text-sm shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 w-full sm:w-auto justify-center"
          >
            <CalendarIcon size={16} />
            <span>Novo Evento</span>
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-[2.5rem] p-8 apple-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Evento</th>
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Data</th>
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Horário</th>
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400">Repertório</th>
                  <th className="pb-4 px-4 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((event, index) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <td className="py-4 px-4 align-middle">
                        {editingEventId === event.id ? (
                          <div
                            onClick={toggleEditType}
                            className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-sm ${
                              editForm.type === 'service' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            {editForm.type === 'service' ? 'Culto' : 'Ensaio'}
                          </div>
                        ) : (
                          <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                            event.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {event.type === 'service' ? 'Culto' : 'Ensaio'}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-middle font-bold text-[#00153d] group-hover:text-blue-600 transition-colors">
                        {editingEventId === event.id ? (
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-[#00153d]"
                          />
                        ) : (
                          event.title
                        )}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {editingEventId === event.id ? (
                          <input
                            type="date"
                            value={editForm.date || ''}
                            onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            className="w-[130px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-[#00153d]"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <CalendarIcon size={14} className="text-slate-400" />
                            <span className="capitalize">{formatDate(event.date)}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {editingEventId === event.id ? (
                          <input
                            type="time"
                            value={editForm.time || ''}
                            onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            className="w-[100px] px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-[#00153d]"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                            <Clock size={14} className="text-slate-400" />
                            <span>{event.time}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-middle">
                        {editingEventId === event.id ? (
                          <div className="flex flex-col gap-2 relative min-w-[180px]">
                            <div className="flex flex-wrap gap-1.5">
                              {(editForm.songs || []).map(songId => (
                                <span key={songId} className="flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                  <span className="truncate max-w-[80px]">{getSongTitle(songId)}</span>
                                  <button onClick={(e) => removeInlineSong(songId, e)} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                              ))}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowInlineSongSearch(!showInlineSongSearch); }}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                              >
                                <Plus size={10} /> Add
                              </button>
                            </div>
                            
                            {showInlineSongSearch && (
                              <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-[60]" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={inlineSongSearch}
                                  onChange={e => setInlineSongSearch(e.target.value)}
                                  placeholder="Buscar louvor..."
                                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none mb-2"
                                  autoFocus
                                />
                                {inlineSuggestedSongs.length > 0 ? (
                                  <div className="space-y-1">
                                    {inlineSuggestedSongs.map(s => (
                                      <div 
                                        key={s.id} 
                                        onClick={(e) => addInlineSong(s.id, e)}
                                        className="text-[10px] p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                                      >
                                        <div className="font-bold">{s.title}</div>
                                        <div className="opacity-70">{s.artist}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 text-center py-2">Nenhum louvor encontrado.</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {event.songs.length === 0 ? (
                              <span className="text-[10px] font-medium text-slate-400 italic">Vazio</span>
                            ) : (
                              <>
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md max-w-[120px] truncate">
                                  {getSongTitle(event.songs[0])}
                                </span>
                                {event.songs.length > 1 && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                    +{event.songs.length - 1}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 align-middle text-right">
                        {editingEventId === event.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={handleCancelEdit}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Cancelar edição"
                            >
                              <X size={16} />
                            </button>
                            <button 
                              onClick={handleSaveEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all font-bold text-xs"
                            >
                              <Save size={14} />
                              <span>Salvar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            {canEdit && (
                              <button 
                                onClick={(e) => handleEditClick(event, e)}
                                className="p-2 mr-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar linha"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            <div className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-all hidden group-hover:flex items-center gap-2 text-xs font-bold w-max">
                              <span>Ver Completo</span>
                              <ChevronRight size={16} />
                            </div>
                            <div className="p-2 text-slate-400 group-hover:hidden">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  {filteredEvents.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                           Nenhum evento encontrado.
                        </td>
                     </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-8 apple-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-[#00153d] capitalize">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={todayMonth} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-[#00153d] hover:bg-slate-100 rounded-xl transition-all">
                Hoje
              </button>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-[#00153d] hover:bg-white rounded-lg transition-all shadow-sm">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-[#00153d] hover:bg-white rounded-lg transition-all shadow-sm">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[700px] grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="bg-white py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((dayObj, i) => {
              const dayString = toDateString(dayObj.date);
              const dayEvents = filteredEvents.filter(e => e.date === dayString);
              const isToday = dayString === toDateString(new Date());

              return (
                <div 
                  key={i} 
                  onClick={() => handleEmptyDayClick(dayObj.date)}
                  className={`bg-white min-h-[120px] p-2 transition-colors ${!dayObj.isCurrentMonth ? 'opacity-40 bg-slate-50/50' : 'hover:bg-slate-50'} ${canEdit ? 'cursor-pointer' : ''}`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm mb-2 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-[#00153d]'}`}>
                    {dayObj.date.getDate()}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt.id);
                        }}
                        className={`text-xs p-1.5 rounded-lg border cursor-pointer hover:-translate-y-0.5 transition-transform ${
                          evt.type === 'service' 
                            ? 'bg-blue-50 border-blue-100 text-blue-700' 
                            : 'bg-purple-50 border-purple-100 text-purple-700'
                        }`}
                        title={evt.title}
                      >
                        <div className="font-bold truncate">{evt.title}</div>
                        <div className="text-[9px] font-medium opacity-80 mt-0.5">{evt.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00153d]/40 backdrop-blur-md">
            <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden apple-shadow relative flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="p-8 pb-6 flex justify-between items-start relative z-10 shrink-0">
                 <div>
                    <h3 className="text-2xl font-headline font-extrabold text-[#00153d] tracking-tight mb-1">Novo Evento</h3>
                    <p className="text-sm text-slate-500 font-medium">Passo {wizardStep} de 4</p>
                 </div>
                 <button onClick={() => setShowWizard(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95">
                   <X size={24} />
                 </button>
               </div>
               
               <div className="p-8 pt-0 relative z-10 overflow-y-auto w-full no-scrollbar flex-1">
                  {wizardStep === 1 && (
                     <div className="space-y-5">
                       <p className="text-sm text-[#00153d] font-bold">Que tipo de evento será e qual o nome dele?</p>
                       <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Tipo do evento</label>
                         <div className="flex gap-4">
                           <button 
                             onClick={() => setNewEvent({...newEvent, type: 'service'})}
                             className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                               newEvent.type === 'service' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md shadow-blue-500/10' : 'bg-transparent text-slate-400 border-slate-100 hover:bg-slate-50'
                             }`}
                           >
                             Culto / Serviço
                           </button>
                           <button 
                             onClick={() => setNewEvent({...newEvent, type: 'rehearsal'})}
                             className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                               newEvent.type === 'rehearsal' ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-md shadow-purple-500/10' : 'bg-transparent text-slate-400 border-slate-100 hover:bg-slate-50'
                             }`}
                           >
                             Ensaio
                           </button>
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do evento</label>
                         <input 
                           type="text"
                           value={newEvent.title}
                           onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                           placeholder={newEvent.type === 'service' ? "Ex: Culto de Celebração" : "Ex: Ensaio de Sexta"}
                           className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-[#00153d] font-bold placeholder:font-medium"
                         />
                       </div>

                       <div className="flex gap-4 pt-4">
                         <button 
                           onClick={() => setWizardStep(2)}
                           disabled={!newEvent.title}
                           className="flex-1 py-4 bg-[#00153d] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 group"
                         >
                           <span>Avançar</span>
                           <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                         </button>
                       </div>
                     </div>
                  )}

                  {wizardStep === 2 && (
                     <div className="space-y-5">
                       <p className="text-sm text-[#00153d] font-bold">Confirme a data e onde será.</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data</label>
                            <input 
                              type="date"
                              value={newEvent.date}
                              onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-[#00153d] font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Horário</label>
                            <input 
                              type="time"
                              value={newEvent.time}
                              onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-[#00153d] font-bold"
                            />
                          </div>
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Local (Opcional)</label>
                         <input 
                           type="text"
                           value={newEvent.location}
                           onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                           placeholder="Ex: Igreja Principal"
                           className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-[#00153d] font-bold placeholder:font-medium"
                         />
                       </div>

                       <div className="flex gap-4 pt-4">
                         <button 
                           onClick={() => setWizardStep(1)}
                           className="w-16 flex items-center justify-center p-4 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-slate-100 hover:text-[#00153d] transition-all active:scale-95"
                         >
                           <ChevronLeft size={20} />
                         </button>
                         <button 
                           onClick={() => setWizardStep(3)}
                           disabled={!newEvent.date || !newEvent.time}
                           className="flex-1 py-4 bg-[#00153d] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 group"
                         >
                           <span>Avançar para o Repertório</span>
                           <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                         </button>
                       </div>
                     </div>
                  )}

                  {wizardStep === 3 && (
                     <div className="space-y-6">
                       <p className="text-sm text-[#00153d] font-bold">Por último, vamos montar a lista de louvores!</p>
                       
                       <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Músicas Selecionadas</label>
                         {(!newEvent.songs || newEvent.songs.length === 0) ? (
                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                               <Music size={24} className="mb-2 opacity-50" />
                               <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum louvor inserido</p>
                            </div>
                         ) : (
                            <div className="space-y-2">
                               {newEvent.songs.map((songId, index) => {
                                  const song = songs.find(s => s.id === songId);
                                  return (
                                     <div key={`${songId}-${index}`} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm group">
                                        <div className="flex flex-col items-center">
                                           <button onClick={() => moveSongWizard(index, 'up')} disabled={index === 0} className="text-slate-200 hover:text-blue-500 disabled:opacity-30"><ChevronLeft size={16} className="rotate-90" /></button>
                                           <span className="text-[10px] font-black w-4 text-center">{index + 1}</span>
                                           <button onClick={() => moveSongWizard(index, 'down')} disabled={index === newEvent.songs!.length - 1} className="text-slate-200 hover:text-blue-500 disabled:opacity-30"><ChevronRight size={16} className="rotate-90" /></button>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <h5 className="font-bold text-xs text-[#00153d] truncate">{song?.title || 'Desconhecida'}</h5>
                                           <p className="text-[9px] text-slate-500 truncate">{song?.artist}</p>
                                        </div>
                                        <div className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">{song?.key}</div>
                                        <button onClick={() => handleRemoveSongWizard(songId)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                           <X size={16} />
                                        </button>
                                     </div>
                                  );
                               })}
                            </div>
                         )}
                       </div>

                       <div className="space-y-2 pt-2 border-t border-slate-100">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Procurar Louvores do Sistema</label>
                         <input 
                           type="text"
                           value={songSearchTerm}
                           onChange={e => setSongSearchTerm(e.target.value)}
                           placeholder="Digite o nome do louvor para buscar..."
                           className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-sm"
                         />
                         
                         {songSearchTerm && suggestedSongs.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg mt-2 overflow-hidden">
                               {suggestedSongs.map(song => (
                                  <button 
                                    key={song.id}
                                    onClick={() => { handleAddSongWizard(song.id); setSongSearchTerm(''); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                                  >
                                     <div>
                                        <p className="font-bold text-xs text-[#00153d] group-hover:text-blue-600">{song.title}</p>
                                        <p className="text-[10px] text-slate-500">{song.artist}</p>
                                     </div>
                                     <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                        <Plus size={14} />
                                     </div>
                                  </button>
                               ))}
                            </div>
                         )}
                         {songSearchTerm && suggestedSongs.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">Nenhum louvor restante encontrado com esse nome.</p>
                         )}
                       </div>

                       <div className="flex gap-4 pt-6">
                         <button 
                           onClick={() => setWizardStep(2)}
                           className="w-16 flex items-center justify-center p-4 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-slate-100 hover:text-[#00153d] transition-all active:scale-95"
                         >
                           <ChevronLeft size={20} />
                         </button>
                         <button 
                           onClick={handleCreateEvent}
                           disabled={isCreating}
                           className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
                         >
                           <span>{isCreating ? 'Finalizando...' : 'Confirmar e Criar'}</span>
                         </button>
                       </div>
                     </div>
                  )}

                  {wizardStep === 4 && (
                     <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
                        <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-500 animate-float shadow-xl shadow-emerald-500/20">
                           <CalendarIcon size={40} />
                           <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                              <CheckCircle2 size={16} />
                           </div>
                        </div>
                        <div>
                           <h3 className="text-2xl font-headline font-extrabold text-[#00153d] tracking-tight mb-2">Agendado com Sucesso!</h3>
                           <p className="text-sm text-slate-500">O novo evento foi cadastrado na agenda e o repertório guardado. Todos os membros serão notificados.</p>
                        </div>
                        <button 
                           onClick={() => { setShowWizard(false); setWizardStep(1); }}
                           className="mt-4 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-[#00153d] rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                           Fechar
                        </button>
                     </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Music, 
  Users, 
  Smile, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Search, 
  Plus, 
  Calendar as CalendarIcon,
  MessageSquare,
  Frown,
  Meh,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, TeamMember, WorshipEvent, RehearsalReport } from '../../types';

interface RehearsalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  onSubmit: (report: Omit<RehearsalReport, 'id'>) => Promise<void>;
}

const sentiments = [
  { id: 'vibrant', label: 'Vibrante', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'focused', label: 'Focado', icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'tired', label: 'Cansado', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'happy', label: 'Alegre', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'neutral', label: 'Normal', icon: Meh, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'blessed', label: 'Abençoado', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
];

export function RehearsalWizard({ isOpen, onClose, songs, team, events, onSubmit }: RehearsalWizardProps) {
  const [step, setStep] = useState(1);
  const [report, setReport] = useState<Partial<RehearsalReport>>({
    date: new Date().toISOString().split('T')[0],
    songs_ids: [],
    attendance: {},
    sentiment: 'neutral',
    observations: '',
  });
  const [songSearch, setSongSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 6;

  const nextStep = () => {
    // Validation for certain steps
    if (step === 2 && !report.date) return;
    if (step === 3 && report.songs_ids?.length === 0) return;
    setStep(s => Math.min(s + 1, totalSteps + 1));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const selectEvent = (event_id?: string) => {
    const selectedEvent = events.find(e => e.id === event_id);
    setReport(prev => ({
      ...prev,
      event_id,
      // If we select an event, we pre-fill songs and team from it
      songs_ids: selectedEvent ? [...selectedEvent.songs] : prev.songs_ids,
      attendance: selectedEvent ? {
        ...Object.keys(selectedEvent.attendance || {}).reduce((acc, userId) => ({ ...acc, [userId]: true }), {}),
        ...Object.values(selectedEvent.team.instruments).reduce((acc, name) => {
            const member = team.find(m => m.name === name);
            if (member) acc[member.id] = true;
            return acc;
        }, {} as Record<string, boolean>)
      } : prev.attendance
    }));
    nextStep();
  };

  const toggleSong = (id: string) => {
    setReport(prev => ({
      ...prev,
      songs_ids: prev.songs_ids?.includes(id) 
        ? prev.songs_ids.filter(s => s !== id) 
        : [...(prev.songs_ids || []), id]
    }));
  };

  const toggleAttendance = (memberId: string) => {
    setReport(prev => ({
      ...prev,
      attendance: {
        ...(prev.attendance || {}),
        [memberId]: !prev.attendance?.[memberId]
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        date: report.date || new Date().toISOString().split('T')[0],
        songs_ids: report.songs_ids || [],
        attendance: report.attendance || {},
        sentiment: report.sentiment || 'neutral',
        observations: report.observations || '',
        event_id: report.event_id,
      });
      setStep(7); // Success step
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSongs = songs
    .filter(s => 
      !songSearch || 
      s.title.toLowerCase().includes(songSearch.toLowerCase()) || 
      s.artist.toLowerCase().includes(songSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (!songSearch) {
        // If no search, sort by last played (most recent first)
        return new Date(b.lastPlayed || 0).getTime() - new Date(a.lastPlayed || 0).getTime();
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, 6);

  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Filter next 7 days and past 3 days for relevance
      const limitUpcoming = new Date();
      limitUpcoming.setDate(today.getDate() + 14);
      const limitPast = new Date();
      limitPast.setDate(today.getDate() - 3);
      return eventDate >= limitPast && eventDate <= limitUpcoming;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#00153d]/40 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center bg-slate-50/50 border-b border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00153d] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-extrabold text-[#00153d] tracking-tight">Relatório de Ensaio</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                {step <= totalSteps ? `Passo ${step} de ${totalSteps}` : 'Finalizado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          {[...Array(totalSteps)].map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-full transition-all duration-500 ${i + 1 <= step ? 'bg-blue-600' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Este ensaio foi para qual evento?</h4>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Vincular a um evento ajuda a rastrear a preparação da equipe.</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => selectEvent(undefined)}
                    className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all ${
                      !report.event_id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-600/5' 
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <X size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#00153d] text-sm">Nenhum Evento Específico</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Ensaio Avulso</p>
                        </div>
                      </div>
                      {!report.event_id && <CheckCircle2 className="text-blue-600" size={24} />}
                    </div>
                  </button>

                  <div className="pt-4 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Eventos Sugeridos</div>
                  
                  {upcomingEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => selectEvent(event.id)}
                      className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all ${
                        report.event_id === event.id 
                          ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-600/5' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[9px] font-black text-blue-600 uppercase">{new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                            <span className="text-xl font-headline font-black leading-none">{new Date(event.date + 'T00:00:00').getDate()}</span>
                          </div>
                          <div>
                            <p className="font-bold text-[#00153d] text-sm">{event.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{event.type === 'service' ? 'Culto' : 'Ensaio'} • {event.time}</p>
                          </div>
                        </div>
                        {report.event_id === event.id && <CheckCircle2 className="text-blue-600" size={24} />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Quando foi o ensaio?</h4>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Confirmar a data para registro histórico.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-10 space-y-6 bg-slate-50 rounded-[2.5rem] border border-blue-100">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-blue-600 border border-blue-50">
                    <CalendarIcon size={40} />
                  </div>
                  <input 
                    type="date"
                    value={report.date}
                    onChange={e => setReport(prev => ({ ...prev, date: e.target.value }))}
                    className="px-8 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-[#00153d] font-black text-xl text-center"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Quais louvores praticaram?</h4>
                  <p className="text-sm text-slate-500 mb-6">Selecione todos os louvores ensaiados hoje.</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Buscar louvor..."
                    value={songSearch}
                    onChange={e => setSongSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[#00153d] font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSongs.map(song => {
                    const isSelected = report.songs_ids?.includes(song.id);
                    return (
                      <button
                        key={song.id}
                        onClick={() => toggleSong(song.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'bg-white border-slate-100 text-[#00153d] hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold truncate ${isSelected ? 'text-white' : 'text-[#00153d]'}`}>{song.title}</p>
                            <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{song.artist}</p>
                          </div>
                          {isSelected ? <CheckCircle2 size={16} /> : <Plus size={16} className="text-slate-300" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {report.songs_ids && report.songs_ids.length > 0 && (
                  <div className="pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Selecionados ({report.songs_ids.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {report.songs_ids.map(id => {
                        const song = songs.find(s => s.id === id);
                        return (
                          <span key={id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 group">
                            {song?.title}
                            <button onClick={() => toggleSong(id)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Quem estava presente?</h4>
                  <p className="text-sm text-slate-500 mb-6">Confirme a participação da equipe.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {team.map(member => {
                    const isPresent = report.attendance?.[member.id];
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggleAttendance(member.id)}
                        className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all ${
                          isPresent 
                            ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/5' 
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                          isPresent ? 'bg-emerald-500 text-white scale-110 rotate-3 shadow-md' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className={`font-bold truncate text-sm ${isPresent ? 'text-emerald-900' : 'text-[#00153d]'}`}>{member.name.split(' ')[0]}</p>
                          <p className={`text-[9px] truncate uppercase tracking-widest font-black ${isPresent ? 'text-emerald-600' : 'text-slate-400'}`}>{member.role}</p>
                        </div>
                        {isPresent && <CheckCircle2 className="text-emerald-500" size={16} />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Como foi o clima geral?</h4>
                  <p className="text-sm text-slate-500">Avalie o sentimento e deixe observações sobre o desenvolvimento.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {sentiments.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setReport(prev => ({ ...prev, sentiment: s.id }))}
                      className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all ${
                        report.sentiment === s.id 
                          ? `border-blue-500 ${s.bg} shadow-lg shadow-blue-500/5` 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl ${report.sentiment === s.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <s.icon size={24} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${report.sentiment === s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-blue-500" />
                    <h5 className="font-bold text-[#00153d] text-sm tracking-tight">Observações do Ensaio</h5>
                  </div>
                  <textarea
                    value={report.observations}
                    onChange={e => setReport(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Destaques, dificuldades ou lembretes..."
                    className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium min-h-[120px] transition-all"
                  />
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-xl font-bold text-[#00153d] mb-2">Resumo do Relatório</h4>
                  <p className="text-sm text-slate-500">Verifique se as informações estão corretas antes de finalizar.</p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem] border border-blue-100/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-white shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</p>
                        <p className="font-bold text-[#00153d]">{new Date(report.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-white shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sentimento</p>
                        <p className="font-bold text-[#00153d]">{sentiments.find(s => s.id === report.sentiment)?.label || 'Normal'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Louvores Ensaiados</p>
                    <div className="flex flex-wrap gap-2">
                        {report.songs_ids?.map(id => (
                            <span key={id} className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">{songs.find(s => s.id === id)?.title}</span>
                        ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Presença da Equipe</p>
                    <div className="flex -space-x-2">
                        {Object.entries(report.attendance || {}).filter(([_, v]) => v).map(([id], i) => (
                            <div key={id} className="w-8 h-8 rounded-full bg-[#00153d] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm" title={team.find(m => m.id === id)?.name}>
                                {team.find(m => m.id === id)?.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-12 space-y-8"
              >
                <div className="w-32 h-32 bg-emerald-100 rounded-[3rem] flex items-center justify-center text-emerald-500 animate-float shadow-2xl shadow-emerald-500/20 relative">
                  <CheckCircle2 size={64} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight">Relatório Salvo!</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto text-lg leading-relaxed">Contadores de uso de louvores foram atualizados com sucesso.</p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-full max-w-xs p-5 bg-[#00153d] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95"
                >
                    Concluir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step <= totalSteps && (
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="w-16 flex items-center justify-center p-5 bg-white border border-slate-200 text-slate-400 rounded-[1.5rem] hover:text-[#00153d] hover:border-[#00153d] transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            
            <button
              onClick={step === totalSteps ? handleSubmit : nextStep}
              disabled={isSubmitting || (step === 3 && report.songs_ids?.length === 0)}
              className="flex-1 p-5 bg-[#00153d] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              <span>{isSubmitting ? 'Gravando...' : step === totalSteps ? 'Finalizar Agora' : 'Continuar'}</span>
              {!isSubmitting && step < totalSteps && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /> }
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

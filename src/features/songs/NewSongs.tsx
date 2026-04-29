import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Clock, 
  Sparkles, 
  Layers, 
  MessageSquare, 
  BookOpen, 
  Play,
  ExternalLink,
  Plus, 
  X, 
  Youtube, 
  Info, 
  User, 
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Song, WorshipEvent, SongSuggestion, Profile } from '../../types';
import { BackButton } from '../../components/BackButton';
import { formatDashboardDate } from '../../lib/dateUtils';
import { createSongSuggestion, createAppNotification } from '../../lib/appData';
import { toast } from 'react-hot-toast';

interface NewSongsProps {
  songs: Song[];
  events: WorshipEvent[];
  suggestions: SongSuggestion[];
  userProfile: Profile | null;
  onSelectSong: (id: string) => void;
  onBack: () => void;
  onSuggestionCreated: (suggestion: SongSuggestion) => void;
  onCreateSong: (song: Omit<Song, 'id'>) => Promise<void>;
  onGoToStudy: () => void;
}

type FilterType = 'all' | 'new' | 'suggestions' | 'study';

export default function NewSongs({ 
  songs, 
  events, 
  suggestions, 
  userProfile, 
  onSelectSong, 
  onBack,
  onSuggestionCreated,
  onGoToStudy
}: NewSongsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SongSuggestion | null>(null);

  // Suggestion Form State
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionArtist, setSuggestionArtist] = useState('');
  const [suggestionYoutube, setSuggestionYoutube] = useState('');
  const [suggestionNotes, setSuggestionNotes] = useState('');

  // 1. Logic for New Songs (Novas)
  const newSongsList = useMemo(() => {
    return [...songs]
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      })
      .slice(0, 15);
  }, [songs]);

  // 2. Logic for Study Songs (Estudar)
  const studySongsList = useMemo(() => {
    const songCounts: Record<string, number> = {};
    
    events.forEach(event => {
      [...(event.songs || []), ...(event.offeringSongs || []), ...(event.outroSongs || [])].forEach(id => {
        songCounts[id] = (songCounts[id] || 0) + 1;
      });
    });

    return [...songs]
      .filter(s => songCounts[s.id] > 0)
      .sort((a, b) => (songCounts[b.id] || 0) - (songCounts[a.id] || 0))
      .slice(0, 15);
  }, [songs, events]);

  // 3. Filtered Content
  const filteredContent = useMemo(() => {
    switch (activeFilter) {
      case 'new': return newSongsList;
      case 'study': return studySongsList;
      case 'suggestions': return []; // Handled separately
      default: return newSongsList.slice(0, 8); // Mixed view for 'all'
    }
  }, [activeFilter, newSongsList, studySongsList]);

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionTitle.trim() || !suggestionArtist.trim() || isSubmittingSuggestion) return;

    try {
      setIsSubmittingSuggestion(true);
      const createdSuggestion = await createSongSuggestion({
        title: suggestionTitle.trim(),
        artist: suggestionArtist.trim(),
        youtube_url: suggestionYoutube.trim() || undefined,
        notes: suggestionNotes.trim() || undefined,
        suggested_by: userProfile?.id,
      });

      const suggestionWithUser = {
        ...createdSuggestion,
        suggested_by_name: userProfile?.name
      };

      onSuggestionCreated(suggestionWithUser);

      // Notify leaders
      void createAppNotification({
        title: 'Nova Sugestão de Louvor',
        message: `${userProfile?.name || 'Alguém'} sugeriu "${suggestionTitle}" de ${suggestionArtist}.`,
        type: 'suggestion',
        target_role: 'all',
        created_by: userProfile?.id,
      }).catch(err => console.warn('Notification error:', err));

      setIsAddingSuggestion(false);
      setSuggestionTitle('');
      setSuggestionArtist('');
      setSuggestionYoutube('');
      setSuggestionNotes('');
      toast.success('Sugestão enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar sugestão');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  return (
    <div className="space-y-10 pb-32">
      <header className="space-y-6">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
        >
          <BackButton onClick={onBack} />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00153d] to-blue-800 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Sparkles size={32} className="relative z-10 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Radar Manancial</p>
                <h2 className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight">O que há de novo?</h2>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Study Hub CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onClick={onGoToStudy}
          className="relative group cursor-pointer mb-8"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="relative glass bg-gradient-to-br from-orange-600/90 to-amber-600/90 rounded-[2.5rem] p-8 overflow-hidden border border-white/20 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-lg group-hover:rotate-6 transition-transform">
                <BookOpen size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-headline font-black text-white">Ambiente de Estudo</h3>
                <p className="text-orange-100 font-medium opacity-90">Prepare-se para os próximos eventos com agilidade e foco.</p>
              </div>
              <button className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all">
                Acessar Agora
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filter Chips */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {[
            { id: 'all', label: 'Tudo', icon: Layers },
            { id: 'new', label: 'Novas', icon: Clock },
            { id: 'suggestions', label: 'Sugestões', icon: MessageSquare },
            { id: 'study', label: 'Estudar', icon: BookOpen },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id as FilterType)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border shrink-0 ${
                activeFilter === chip.id 
                  ? 'bg-[#00153d] text-white border-[#00153d] shadow-xl shadow-blue-900/20 scale-105' 
                  : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <chip.icon size={18} />
              {chip.label}
              {chip.id === 'suggestions' && suggestions.filter(s => s.status === 'pending').length > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] flex items-center justify-center animate-pulse">
                  {suggestions.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* VIEW: SUGGESTIONS */}
        {activeFilter === 'suggestions' ? (
          <motion.div
            key="suggestions-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-headline font-black text-[#00153d]">Sugestões da Galera</h3>
              <button 
                onClick={() => setIsAddingSuggestion(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={18} />
                Sugerir Louvor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSuggestion(suggestion)}
                  className="glass p-6 rounded-[2.5rem] border border-white/50 shadow-xl group cursor-pointer hover:bg-white transition-all relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none opacity-10 ${
                    suggestion.status === 'approved' ? 'bg-emerald-500' :
                    suggestion.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-xl font-headline font-black text-[#00153d] line-clamp-1 group-hover:text-blue-700 transition-colors">{suggestion.title}</h4>
                        <p className="text-slate-500 text-sm font-medium">{suggestion.artist}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        suggestion.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        suggestion.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {suggestion.status === 'pending' ? 'Pendente' : suggestion.status === 'approved' ? 'Aprovada' : 'Recusada'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      {suggestion.youtube_url && <Youtube size={16} className="text-red-500" />}
                      {suggestion.notes && <Info size={16} className="text-blue-500" />}
                      <div className="flex-1" />
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <User size={12} />
                        {suggestion.suggested_by_name?.split(' ')[0] || 'Membro'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {suggestions.length === 0 && (
                <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-2 border-slate-200">
                  <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma sugestão ainda</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* VIEW: SONGS (All, New, Study) */
          <motion.div
            key="songs-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Featured Section (only for 'all' or 'new') */}
            {(activeFilter === 'all' || activeFilter === 'new') && newSongsList.length > 0 && (
              <div 
                onClick={() => onSelectSong(newSongsList[0].id)}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-[3.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                <div className="relative glass bg-gradient-to-br from-[#00153d] via-blue-900 to-[#011a4d] rounded-[3rem] p-8 md:p-12 overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shadow-2xl relative">
                      {newSongsList[0].cover_url ? (
                        <img src={newSongsList[0].cover_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                        <div className="w-full h-full bg-blue-800 flex items-center justify-center text-white">
                          <Music size={64} opacity={0.2} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                          Novo Louvor
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-6 text-center md:text-left">
                      <div className="space-y-2">
                        <h3 className="text-4xl md:text-5xl font-headline font-black text-white leading-tight">{newSongsList[0].title}</h3>
                        <p className="text-xl text-blue-200 font-medium opacity-80">{newSongsList[0].artist}</p>
                      </div>
                      
                      <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-300 uppercase">Tom</span>
                          <span className="font-black text-white">{newSongsList[0].key}</span>
                        </div>
                        {newSongsList[0].bpm && (
                          <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-300 uppercase">BPM</span>
                            <span className="font-black text-white">{newSongsList[0].bpm}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-full bg-white text-[#00153d] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid for other songs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(activeFilter === 'all' ? newSongsList.slice(1, 7) : filteredContent.slice(activeFilter === 'new' ? 1 : 0)).map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectSong(song.id)}
                  className="group glass p-6 rounded-[2.5rem] border border-white/50 hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  
                  <div className="flex gap-5 relative z-10">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white shrink-0">
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
                        <h4 className="text-lg font-headline font-black text-[#00153d] line-clamp-1 group-hover:text-blue-700 transition-colors leading-tight">
                          {song.title}
                        </h4>
                        {activeFilter === 'study' && (
                          <div className="flex items-center gap-1 text-orange-500">
                            <BookOpen size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm font-medium line-clamp-1">{song.artist}</p>
                      <div className="flex items-center gap-3">
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black">{song.key}</span>
                         {activeFilter === 'study' ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Essencial no Time
                            </span>
                         ) : (
                           <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             <Clock size={10} />
                             Recente
                           </span>
                         )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Study Section preview in 'all' view */}
            {activeFilter === 'all' && studySongsList.length > 0 && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-headline font-black text-[#00153d] flex items-center gap-3">
                    <BookOpen className="text-orange-500" /> Essenciais do Repertório
                  </h3>
                  <button 
                    onClick={() => setActiveFilter('study')}
                    className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Ver Todas <ArrowRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studySongsList.slice(0, 4).map((song) => (
                    <div 
                      key={song.id}
                      onClick={() => onSelectSong(song.id)}
                      className="flex items-center gap-4 p-4 glass rounded-3xl border border-white/50 hover:bg-white cursor-pointer transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <Music size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-[#00153d] group-hover:text-blue-600 transition-colors">{song.title}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{song.artist}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Play size={16} fill="currentColor" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion Form Modal */}
      <AnimatePresence>
        {isAddingSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00153d]/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                  <h3 className="font-headline font-black text-2xl text-[#00153d]">Nova Sugestão</h3>
                </div>
                <button 
                  onClick={() => setIsAddingSuggestion(false)} 
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddSuggestion} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Título do Louvor</label>
                    <input
                      type="text"
                      required
                      value={suggestionTitle}
                      onChange={e => setSuggestionTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold transition-all"
                      placeholder="Ex: Lindo És"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Artista / Banda</label>
                    <input
                      type="text"
                      required
                      value={suggestionArtist}
                      onChange={e => setSuggestionArtist(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl px-5 py-4 text-sm font-bold transition-all"
                      placeholder="Ex: Livres para Adorar"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Link de Referência (YouTube)</label>
                  <div className="relative">
                    <Youtube size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={suggestionYoutube}
                      onChange={e => setSuggestionYoutube(e.target.value)}
                      className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 rounded-2xl pl-14 pr-5 py-4 text-sm font-bold transition-all"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Por que sugerir esta música?</label>
                  <textarea
                    value={suggestionNotes}
                    onChange={e => setSuggestionNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 rounded-3xl px-5 py-4 text-sm font-bold transition-all resize-none"
                    placeholder="Conte-nos por que essa música seria legal para o ministério..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingSuggestion(false)}
                    className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSuggestion || !suggestionTitle.trim() || !suggestionArtist.trim()}
                    className="flex-[2] flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmittingSuggestion ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {isSubmittingSuggestion ? 'Enviando...' : 'Confirmar Sugestão'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Suggestion Detail Modal */}
        {selectedSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#00153d]/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 p-10 space-y-8"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit ${
                    selectedSuggestion.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    selectedSuggestion.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    Status: {selectedSuggestion.status === 'pending' ? 'Em Análise' : selectedSuggestion.status === 'approved' ? 'Aprovada' : 'Recusada'}
                  </div>
                  <h3 className="text-3xl font-headline font-black text-[#00153d] leading-tight">{selectedSuggestion.title}</h3>
                  <p className="text-xl text-slate-500 font-medium">{selectedSuggestion.artist}</p>
                </div>
                <button 
                  onClick={() => setSelectedSuggestion(null)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sugerido por</p>
                    <p className="text-lg font-bold text-[#00153d]">{selectedSuggestion.suggested_by_name || 'Membro do Ministério'}</p>
                  </div>
                </div>

                {selectedSuggestion.notes && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Observações</p>
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-slate-600 leading-relaxed italic">
                      "{selectedSuggestion.notes}"
                    </div>
                  </div>
                )}

                {selectedSuggestion.youtube_url && (
                  <a 
                    href={selectedSuggestion.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Youtube size={28} />
                      </div>
                      <span className="font-black uppercase tracking-widest text-xs">Assistir no YouTube</span>
                    </div>
                    <ExternalLink size={20} className="opacity-50" />
                  </a>
                )}
              </div>
              
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="w-full py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
              >
                Fechar Detalhes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

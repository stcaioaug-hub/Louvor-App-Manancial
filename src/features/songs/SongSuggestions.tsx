import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, X, Youtube, Music, Info, BellRing, Send, User, Loader2 } from 'lucide-react';
import { SongEditorModal, createEmptySong } from './SongEditorModal';
import { Song, SongSuggestion, Profile } from '../../types';
import { enrichSongData } from '../../lib/gemini';
import { toast } from 'react-hot-toast';
import { BackButton } from '../../components/BackButton';
import { createSongSuggestion, updateSongSuggestion, createAppNotification } from '../../lib/appData';
import { formatDashboardDate } from '../../lib/dateUtils';

interface SongSuggestionsProps {
  suggestions: SongSuggestion[];
  userProfile: Profile | null;
  onBack: () => void;
  onCreateSong: (song: Omit<Song, 'id'>) => Promise<void>;
  onSuggestionCreated: (suggestion: SongSuggestion) => void;
  onSuggestionUpdated: (id: string, updates: Partial<SongSuggestion>) => void;
}

export default function SongSuggestions({
  suggestions,
  userProfile,
  onBack,
  onCreateSong,
  onSuggestionCreated,
  onSuggestionUpdated,
}: SongSuggestionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [notes, setNotes] = useState('');

  // AI Approval state
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [suggestionToApprove, setSuggestionToApprove] = useState<Song | null>(null);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  // Notification state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<SongSuggestion | null>(null);

  const isMinister = userProfile?.role === 'minister' || userProfile?.role === 'pastor';

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();

    const suggestionTitle = title.trim();
    const suggestionArtist = artist.trim();
    const suggestionYoutubeUrl = youtubeUrl.trim();
    const suggestionNotes = notes.trim();

    if (!suggestionTitle || !suggestionArtist || isSubmittingSuggestion) return;

    try {
      setIsSubmittingSuggestion(true);
      const createdSuggestion = await createSongSuggestion({
        title: suggestionTitle,
        artist: suggestionArtist,
        youtube_url: suggestionYoutubeUrl || undefined,
        notes: suggestionNotes || undefined,
        suggested_by: userProfile?.id,
      });

      // Manually add the name for immediate UI update if not fetched yet
      const suggestionWithUser = {
        ...createdSuggestion,
        suggested_by_name: userProfile?.name
      };

      onSuggestionCreated(suggestionWithUser);

      void createAppNotification({
        title: 'Nova Sugestão de Louvor',
        message: `${userProfile?.name || 'Alguém'} sugeriu "${suggestionTitle}" de ${suggestionArtist}.`,
        type: 'suggestion',
        target_role: 'all',
        created_by: userProfile?.id,
      }).catch((notificationError) => {
        console.warn('Nao foi possivel criar notificacao da sugestao:', notificationError);
      });

      setIsAdding(false);
      setTitle('');
      setArtist('');
      setYoutubeUrl('');
      setNotes('');
      toast.success('Sugestão enviada!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar sugestão');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected') {
      try {
        await updateSongSuggestion(id, { status });
        onSuggestionUpdated(id, { status });
        toast.success('Sugestão rejeitada');
        setSelectedSuggestion(null);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao atualizar status');
      }
      return;
    }

    // Approved flow
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) return;

    try {
      setEnrichingId(id);
      toast.loading('Consultando IA para preencher dados...', { id: 'enrich-loading' });
      
      const enriched = await enrichSongData(suggestion.title, suggestion.artist);
      
      const baseSong = createEmptySong();
      const mergedSong: Song = {
        ...baseSong,
        title: enriched?.title || suggestion.title,
        artist: enriched?.artist || suggestion.artist,
        key: enriched?.key || 'C',
        bpm: enriched?.bpm,
        difficulty: enriched?.difficulty || 3,
        links: {
          video: suggestion.youtube_url || enriched?.youtube_url,
          chords: enriched?.chords_url,
          lyrics: enriched?.lyrics_url,
        }
      };

      setSuggestionToApprove(mergedSong);
      setActiveSuggestionId(id);
      toast.success('Dados prontos para revisão.', { id: 'enrich-loading' });
      setSelectedSuggestion(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar aprovação', { id: 'enrich-loading' });
    } finally {
      setEnrichingId(null);
    }
  };

  const handleSaveApproval = async (song: Song) => {
    if (!activeSuggestionId) return;

    try {
      const { id: _, ...songPayload } = song;
      await onCreateSong(songPayload);
      await updateSongSuggestion(activeSuggestionId, { status: 'approved' });
      onSuggestionUpdated(activeSuggestionId, { status: 'approved' });
      
      setSuggestionToApprove(null);
      setActiveSuggestionId(null);
      toast.success('Louvor aprovado e adicionado ao repertório! 🎸');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao finalizar aprovação');
    }
  };


  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    try {
      await createAppNotification({
        title: notifTitle,
        message: notifMessage,
        type: 'reminder',
        target_role: notifTarget === 'all' ? undefined : notifTarget,
        created_by: userProfile?.id,
      });

      setIsNotifying(false);
      setNotifTitle('');
      setNotifMessage('');
      setNotifTarget('all');
      alert('Notificação enviada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar notificação');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <div>
            <h2 className="text-3xl font-headline font-extrabold text-[#00153d]">Sugestões de Louvores</h2>
            <p className="text-slate-500 font-medium">Ajude a construir nosso repertório.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isMinister && (
            <button
              onClick={() => setIsNotifying(true)}
              className="flex items-center gap-2 px-5 py-3 glass text-blue-600 rounded-[1.2rem] font-bold text-sm shadow-md hover:bg-blue-50 transition-all border border-blue-200"
            >
              <BellRing size={18} />
              <span className="hidden sm:inline">Disparar Lembrete</span>
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-[1.2rem] font-bold text-sm shadow-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Sugerir Louvor</span>
          </button>
        </div>
      </header>

      {/* Suggestion Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-headline font-extrabold text-xl text-[#00153d] flex items-center gap-2">
                  <Music className="text-blue-500" /> Nova Sugestão
                </h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmitSuggestion} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Ex: Lindo És"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Artista/Banda</label>
                    <input
                      type="text"
                      required
                      value={artist}
                      onChange={e => setArtist(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Ex: Livres"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Link do YouTube (Opcional)</label>
                  <div className="relative">
                    <Youtube size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Observações (Opcional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Por que você acha que esse louvor é bom para o ministério?"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    disabled={isSubmittingSuggestion}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSuggestion || !title.trim() || !artist.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  >
                    {isSubmittingSuggestion && <Loader2 size={18} className="animate-spin" />}
                    {isSubmittingSuggestion ? 'Enviando...' : 'Enviar Sugestão'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isNotifying && isMinister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-headline font-extrabold text-xl text-[#00153d] flex items-center gap-2">
                  <BellRing className="text-orange-500" /> Disparar Lembrete
                </h3>
                <button onClick={() => setIsNotifying(false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleDispatchNotification} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Para quem?</label>
                  <select
                    value={notifTarget}
                    onChange={e => setNotifTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="all">Todo o Ministério</option>
                    <option value="minister">Líderes e Ministros</option>
                    <option value="musician">Apenas Músicos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título</label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Ex: Escala atualizada!"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mensagem</label>
                  <textarea
                    required
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Escreva seu lembrete aqui..."
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsNotifying(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30 transition-all">
                    <Send size={18} />
                    Enviar
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
            >
              <div className="p-8 space-y-8">
                <header className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedSuggestion.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      selectedSuggestion.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {selectedSuggestion.status === 'pending' ? 'Sugestão Pendente' : selectedSuggestion.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </div>
                    <h3 className="text-3xl font-headline font-extrabold text-[#00153d] leading-tight">{selectedSuggestion.title}</h3>
                    <p className="text-xl text-slate-500 font-medium">{selectedSuggestion.artist}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSuggestion(null)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </header>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sugerido por</p>
                      <p className="text-lg font-bold text-[#00153d]">{selectedSuggestion.suggested_by_name || 'Membro do Ministério'}</p>
                    </div>
                  </div>

                  {selectedSuggestion.notes && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observações</p>
                      <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-slate-600 leading-relaxed italic">
                        "{selectedSuggestion.notes}"
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.youtube_url && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Referência</p>
                      <a 
                        href={selectedSuggestion.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-red-600 text-white rounded-3xl shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Youtube size={24} />
                          </div>
                          <span className="font-bold text-lg">Assistir no YouTube</span>
                        </div>
                        <Check size={20} className="opacity-50" />
                      </a>
                    </div>
                  )}
                </div>

                {isMinister && selectedSuggestion.status === 'pending' && (
                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedSuggestion.id, 'rejected')}
                      className="flex-1 py-4 rounded-[1.5rem] font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedSuggestion.id, 'approved')}
                      className="flex-2 py-4 rounded-[1.5rem] font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      {enrichingId === selectedSuggestion.id ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Check size={20} strokeWidth={3} />
                      )}
                      Aprovar Louvor
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {suggestionToApprove && (
          <SongEditorModal
            mode="create"
            song={suggestionToApprove}
            onClose={() => {
              setSuggestionToApprove(null);
              setActiveSuggestionId(null);
            }}
            onSave={handleSaveApproval}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedSuggestion(suggestion)}
            className="glass p-6 rounded-[2rem] border border-white/50 shadow-xl flex flex-col relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            {suggestion.status === 'approved' && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />}
            {suggestion.status === 'rejected' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full pointer-events-none" />}
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-headline font-extrabold text-[#00153d] line-clamp-1 group-hover:text-blue-600 transition-colors">{suggestion.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{suggestion.artist}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                suggestion.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                suggestion.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                'bg-red-100 text-red-600'
              }`}>
                {suggestion.status === 'pending' ? 'Pendente' : suggestion.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
               {suggestion.youtube_url && (
                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                  <Youtube size={16} />
                </div>
              )}
              {suggestion.notes && (
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <Info size={16} />
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User size={12} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 line-clamp-1">{suggestion.suggested_by_name || 'Membro'}</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400">
                {suggestion.created_at ? formatDashboardDate(suggestion.created_at).day + ' ' + formatDashboardDate(suggestion.created_at).month : 'Recente'}
              </div>
            </div>

            {/* Quick Action Overlay for Ministers */}
            {isMinister && suggestion.status === 'pending' && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(suggestion.id, 'rejected');
                  }}
                  className="p-3 rounded-2xl bg-white text-red-500 shadow-xl hover:bg-red-500 hover:text-white transition-all scale-90 hover:scale-100"
                >
                  <X size={20} strokeWidth={3} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(suggestion.id, 'approved');
                  }}
                  className="p-3 rounded-2xl bg-white text-emerald-500 shadow-xl hover:bg-emerald-500 hover:text-white transition-all scale-90 hover:scale-100"
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {suggestions.length === 0 && (
          <div className="col-span-full py-20 text-center glass rounded-[3rem] border border-white/50">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
              <Music size={32} />
            </div>
            <h3 className="text-xl font-headline font-extrabold text-[#00153d] mb-2">Nenhuma sugestão ainda</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">Seja o primeiro a sugerir um novo louvor para o nosso repertório!</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00153d] text-white rounded-full font-bold text-sm shadow-xl hover:bg-blue-900 transition-all hover:-translate-y-1"
            >
              <Plus size={18} /> Sugerir Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

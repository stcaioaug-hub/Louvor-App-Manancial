import React, { useState } from 'react';
import { 
  X, Save, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song } from '../../types';
import { transposeKey, toggleMinorKey } from '../../lib/chordTransposer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { enrichSongData, searchSongs, SongSuggestionResult } from '../../lib/gemini';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const SAVE_TIMEOUT_MS = 25000;

interface SongEditorModalProps {
  mode: 'create' | 'edit';
  song: Song;
  onClose: () => void;
  onSave: (song: Song) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function createEmptySong(): Song {
  return {
    id: '',
    title: '',
    artist: '',
    key: 'C',
    proficiency: 3,
    difficulty: 3,
    tags: [],
    links: {},
    isFavorite: false,
    timesPlayed: 0,
    timesRehearsed: 0,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number;

  return Promise.race([
    promise.finally(() => window.clearTimeout(timeoutId)),
    new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Tempo esgotado ao salvar. Verifique a conexão e tente novamente.'));
      }, timeoutMs);
    }),
  ]);
}

function getSaveErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message.toLowerCase().includes('row-level security')) {
    return 'Sem permissão para salvar. Entre como ministro/pastor ou revise as políticas do Supabase.';
  }

  if (message.toLowerCase().includes('cover_url')) {
    return 'O louvor foi enviado com capa, mas o Supabase ainda não reconhece cover_url. Rode a migration de IA no banco.';
  }

  return message ? `Erro ao salvar louvor: ${message}` : 'Erro ao salvar louvor.';
}

export const SongEditorModal = ({ mode, song, onClose, onSave, onDelete }: SongEditorModalProps) => {
  const [formData, setFormData] = useState<Song>({ ...song });
  const [tagsInput, setTagsInput] = useState(song.tags.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [suggestions, setSuggestions] = useState<SongSuggestionResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [brokenCoverUrl, setBrokenCoverUrl] = useState('');

  const debouncedSearch = useDebounce(formData.title, 600);
  const coverUrl = formData.cover_url && formData.cover_url !== brokenCoverUrl ? formData.cover_url : undefined;

  React.useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 3 && !isEnriching) {
      handleSearch(debouncedSearch);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearch]);

  const loadSuggestions = async (query: string) => {
    try {
      setIsSearching(true);
      const results = await searchSongs(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      return results;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string) => {
    await loadSuggestions(query);
  };

  const handleAssistantClick = async () => {
    if (!formData.title.trim()) {
      toast.error('Digite ao menos o título para buscar com IA.');
      return;
    }

    const query = [formData.title, formData.artist].map((value) => value.trim()).filter(Boolean).join(' ');
    const results = await loadSuggestions(query);

    if (results.length > 0) {
      toast.success('Escolha a versão correta na lista.');
      return;
    }

    if (formData.artist.trim()) {
      await handleEnrich();
      return;
    }

    toast.error('Não encontrei opções. Informe também o artista e tente novamente.');
  };

  const handleSelectSuggestion = async (suggestion: SongSuggestionResult) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      artist: suggestion.artist,
      cover_url: suggestion.cover_url || prev.cover_url
    }));
    setBrokenCoverUrl('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Auto trigger full enrichment after selection
    await handleEnrich(suggestion.title, suggestion.artist);
  };

  const handleEnrich = async (titleOverride?: string, artistOverride?: string) => {
    const title = titleOverride || formData.title;
    const artist = artistOverride || formData.artist;

    if (!title || !artist) {
      toast.error('Preencha o título e o artista primeiro!');
      return;
    }

    try {
      setIsEnriching(true);
      const enriched = await enrichSongData(title, artist);
      
      if (enriched) {
        setBrokenCoverUrl('');
        setFormData(prev => ({
          ...prev,
          title: enriched.title || prev.title,
          artist: enriched.artist || prev.artist,
          key: enriched.key || prev.key,
          bpm: enriched.bpm || prev.bpm,
          difficulty: enriched.difficulty || prev.difficulty,
          links: {
            ...prev.links,
            video: enriched.youtube_url || prev.links.video,
            chords: enriched.chords_url || prev.links.chords,
            lyrics: enriched.lyrics_url || prev.links.lyrics,
          },
          cover_url: enriched.cover_url || prev.cover_url
        }));
        toast.success('Dados preenchidos com IA! ✨');
      } else {
        toast.error('Não foi possível encontrar dados para este louvor.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao consultar a IA.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSave = async () => {
    const cleanedSong: Song = {
      ...formData,
      title: formData.title.trim(),
      artist: formData.artist.trim(),
      key: formData.key.trim(),
      tags: tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      links: {
        chords: formData.links.chords?.trim() || undefined,
        lyrics: formData.links.lyrics?.trim() || undefined,
        video: formData.links.video?.trim() || undefined,
      },
    };

    if (!cleanedSong.title || !cleanedSong.artist || !cleanedSong.key) {
      toast.error('Preencha os campos obrigatórios!');
      return;
    }

    try {
      setIsSubmitting(true);
      await withTimeout(onSave(cleanedSong), SAVE_TIMEOUT_MS);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(getSaveErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsSubmitting(true);
      await onDelete(song.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir louvor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow"
      >
        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-bold text-[#00153d]">
              {mode === 'create' ? 'Adicionar Louvor' : 'Editar Louvor'}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Preencha os detalhes do repertório.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="flex items-end gap-3 relative">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  Título do Louvor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Busque por título..."
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-black/5 z-[110] overflow-hidden"
                      >
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-black/[0.02] last:border-0 text-left"
                            type="button"
                          >
                            {suggestion.cover_url ? (
                              <img src={suggestion.cover_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <Music size={16} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-[#00153d]">{suggestion.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{suggestion.artist}</p>
                            </div>
                            <Sparkles size={14} className="ml-auto text-blue-400" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleAssistantClick()}
                disabled={isEnriching || isSearching || !formData.title}
                className={`mb-1 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-lg whitespace-nowrap ${
                  isEnriching || isSearching
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 text-white hover:scale-105 active:scale-95 shadow-blue-500/20'
                } disabled:opacity-50 disabled:grayscale`}
                title="Buscar opções com IA ✨"
              >
                {isEnriching || isSearching ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                <span className="hidden sm:inline">Buscar com IA</span>
                <span className="sm:hidden">IA</span>
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Artista
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(event) => setFormData({ ...formData, artist: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Ex: Livres"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Voz Principal Padrão
              </label>
              <input
                type="text"
                value={formData.defaultLeadVocal ?? ''}
                onChange={(event) => setFormData({ ...formData, defaultLeadVocal: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Ex: Silvia ou Vocal Masculino"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Link do Guia de Voz / Letra
              </label>
              <input
                type="text"
                value={formData.vocalUrl ?? ''}
                onChange={(event) => setFormData({ ...formData, vocalUrl: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="https://..."
              />
            </div>

            {coverUrl && (
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-black/5 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white shadow-sm shrink-0 bg-slate-100">
                  <img
                    src={coverUrl}
                    alt="Capa do álbum"
                    className="w-full h-full object-cover"
                    onError={() => setBrokenCoverUrl(coverUrl)}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capa Encontrada</p>
                  <p className="text-sm font-bold text-[#00153d] truncate">{formData.title}</p>
                  <p className="text-xs text-slate-500 truncate">{formData.artist}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Tom da Banda</label>
                <div className="flex items-center gap-2">
                   <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-black/5 rounded-2xl h-[46px]">
                     <button
                       onClick={() => setFormData({ ...formData, key: transposeKey(formData.key, -1) })}
                       className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                       title="Abaixar meio tom"
                       type="button"
                     >
                       <ChevronLeft size={18} />
                     </button>
                     <span className="font-bold text-[#00153d] text-base w-10 text-center">{formData.key}</span>
                     <button
                       onClick={() => setFormData({ ...formData, key: transposeKey(formData.key, 1) })}
                       className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                       title="Aumentar meio tom"
                       type="button"
                     >
                       <ChevronRight size={18} />
                     </button>
                   </div>
                   <button
                     onClick={() => setFormData({ ...formData, key: toggleMinorKey(formData.key) })}
                     className={`px-4 py-0 h-[46px] rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center ${
                       formData.key.toLowerCase().endsWith('m')
                         ? 'bg-blue-50 border-blue-200 text-blue-700'
                         : 'bg-slate-50 border-black/5 text-slate-400 hover:bg-slate-100'
                     }`}
                     title="Alternar entre tom maior e menor"
                     type="button"
                   >
                     Menor
                   </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Tom Original</label>
                <div className="flex items-center gap-2">
                   <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-black/5 rounded-2xl h-[46px]">
                     <button
                       onClick={() => setFormData({ ...formData, originalKey: transposeKey(formData.originalKey || 'C', -1) })}
                       className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                       title="Abaixar meio tom"
                       type="button"
                     >
                       <ChevronLeft size={18} />
                     </button>
                     <span className="font-bold text-[#00153d] text-base w-10 text-center">{formData.originalKey || '--'}</span>
                     <button
                       onClick={() => setFormData({ ...formData, originalKey: transposeKey(formData.originalKey || 'C', 1) })}
                       className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                       title="Aumentar meio tom"
                       type="button"
                     >
                       <ChevronRight size={18} />
                     </button>
                   </div>
                   <button
                     onClick={() => setFormData({ ...formData, originalKey: toggleMinorKey(formData.originalKey || 'C') })}
                     className={`px-4 py-0 h-[46px] rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center ${
                       (formData.originalKey || '').toLowerCase().endsWith('m')
                         ? 'bg-blue-50 border-blue-200 text-blue-700'
                         : 'bg-slate-50 border-black/5 text-slate-400 hover:bg-slate-100'
                     }`}
                     title="Alternar entre tom maior e menor"
                     type="button"
                   >
                     Menor
                   </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  BPM
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bpm ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      bpm: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Ex: 75"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Adoração, Celebração, Rápida"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  Proficiência Requerida
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/5 rounded-2xl h-[46px]">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, proficiency: level })}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        level <= formData.proficiency ? 'bg-blue-600' : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={`${level}/5`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  Dificuldade Técnica
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/5 rounded-2xl h-[46px]">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        level <= formData.difficulty ? 'bg-orange-600' : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={`${level}/5`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  Link do Vídeo (YouTube)
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/..."
                  value={formData.links.video ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      links: { ...formData.links, video: event.target.value },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                  URL da Capa (Imagem)
                </label>
                <div className="flex gap-4 items-start">
                  {coverUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-black/5 shrink-0 bg-slate-100">
                      <img
                        src={coverUrl}
                        alt="Capa"
                        className="w-full h-full object-cover"
                        onError={() => setBrokenCoverUrl(coverUrl)}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.cover_url ?? ''}
                    onChange={(event) => {
                      setBrokenCoverUrl('');
                      setFormData({ ...formData, cover_url: event.target.value });
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                    Link da Cifra
                  </label>
                  <input
                    type="text"
                    placeholder="https://cifraclub.com/..."
                    value={formData.links.chords ?? ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        links: { ...formData.links, chords: event.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">
                    Link da Letra
                  </label>
                  <input
                    type="text"
                    placeholder="https://letras.mus.br/..."
                    value={formData.links.lyrics ?? ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        links: { ...formData.links, lyrics: event.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 flex flex-wrap gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 min-w-[120px] py-4 bg-white border border-black/5 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          {mode === 'edit' && onDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              disabled={isSubmitting}
              className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              title="Excluir Louvor"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
          <button
            onClick={() => void handleSave()}
            disabled={isSubmitting || isEnriching}
            className="flex-[2] min-w-[160px] py-4 bg-[#00153d] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Adicionar Louvor' : 'Salvar Alterações'}
          </button>
        </div>
      </motion.div>
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Excluir Louvor"
        message={`Tem certeza que deseja excluir o louvor "${song.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
};

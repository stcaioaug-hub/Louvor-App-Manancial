import React, { useMemo, useState } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, ExternalLink, Star, X, Save, FileText, 
  Trash2, Edit2, ChevronLeft, ChevronRight, Play, Mic2, ArrowUpDown, ChevronDown 
} from 'lucide-react';
import { Song, WorshipEvent } from '../../types';
import { transposeKey, toggleMinorKey } from '../../lib/chordTransposer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton } from '../../components/BackButton';

interface SongEditorModalProps {
  mode: 'create' | 'edit';
  song: Song;
  onClose: () => void;
  onSave: (song: Song) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

function createEmptySong(): Song {
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

const SongEditorModal = ({ mode, song, onClose, onSave, onDelete }: SongEditorModalProps) => {
  const [formData, setFormData] = useState<Song>({ ...song });
  const [tagsInput, setTagsInput] = useState(song.tags.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(cleanedSong);
      onClose();
    } catch {
      return;
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
    } catch {
      return;
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
        <div className="p-8 border-b border-black/5 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-[#00153d]">
            {mode === 'create' ? 'Adicionar Louvor' : 'Editar Louvor'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Titulo do Louvor
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Artista
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(event) => setFormData({ ...formData, artist: event.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tom</label>
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
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Tags
              </label>
              <input
                type="text"
                placeholder="Adoracao, Celebracao"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Proficiencia
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/5 rounded-2xl">
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
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Dificuldade
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-black/5 rounded-2xl">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Link da Cifra
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.links.chords ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      links: { ...formData.links, chords: event.target.value },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Link da Letra
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.links.lyrics ?? ''}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      links: { ...formData.links, lyrics: event.target.value },
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
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
            disabled={isSubmitting}
            className="flex-[2] min-w-[160px] py-4 bg-[#00153d] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Salvando...' : mode === 'create' ? 'Adicionar' : 'Salvar'}
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

interface SongListProps {
  songs: Song[];
  events: WorshipEvent[];
  onCreateSong: (song: Omit<Song, 'id'>) => Promise<void>;
  onUpdateSong: (song: Song) => Promise<void>;
  onDeleteSong: (id: string) => Promise<void>;
  onSelectSong: (id: string) => void;
  canEdit?: boolean;
  onBack?: () => void;
}

type FilterType = 'all' | 'favorites' | 'mostPlayed' | 'mostRehearsed';

export default function SongList({ songs, events, onCreateSong, onUpdateSong, onDeleteSong, onSelectSong, canEdit = true, onBack }: SongListProps) {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredSongs = useMemo(() => {
    let result = [...songs].filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType === 'favorites') {
      result = result.filter(s => s.isFavorite);
    } else if (filterType === 'mostPlayed') {
      result = result.sort((a, b) => (b.timesPlayed || 0) - (a.timesPlayed || 0));
    } else if (filterType === 'mostRehearsed') {
      result = result.sort((a, b) => (b.timesRehearsed || 0) - (a.timesRehearsed || 0));
    }

    return result;
  }, [searchQuery, songs, filterType]);

  const updateProficiency = async (song: Song, level: number) => {
    await onUpdateSong({ ...song, proficiency: level });
  };

  const toggleFavorite = async (song: Song) => {
    await onUpdateSong({ ...song, isFavorite: !song.isFavorite });
  };

  const updateSongKey = async (song: Song, semitones: number) => {
    const newKey = transposeKey(song.key, semitones);
    await onUpdateSong({ ...song, key: newKey });
  };

  const handleSaveEdit = async (updatedSong: Song) => {
    if (isCreating) {
      const { id: _id, ...songPayload } = updatedSong;
      await onCreateSong(songPayload);
      setIsCreating(false);
      return;
    }

    await onUpdateSong(updatedSong);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8 }}
           className="space-y-4"
        >
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Biblioteca Musical</p>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight">Repertório</h2>
          </div>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar título ou artista..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-12 pr-6 py-4 bg-white/60 backdrop-blur-md border border-white/80 rounded-[1.5rem] text-sm w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-xl shadow-blue-900/[0.02]"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto order-first sm:order-last">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-[1.5rem] transition-all shadow-xl shadow-blue-900/[0.02] flex items-center justify-center group border ${
                showFilters 
                ? 'bg-[#00153d] text-white border-blue-900 shadow-blue-900/20' 
                : 'bg-white/60 backdrop-blur-md border-white/80 text-slate-500 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Filter size={20} className={showFilters ? 'rotate-180 transition-transform duration-500' : 'group-hover:rotate-180 transition-transform duration-500'} />
            </button>
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCreating(true);
                  setEditingSong(createEmptySong());
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-gradient-to-r from-[#00153d] to-blue-800 text-white px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:opacity-90 transition-all"
              >
                <Plus size={20} />
                <span>Adicionar</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-4 p-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-[2.5rem] mb-8 shadow-inner shadow-blue-900/[0.01]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === 'all' ? 'bg-[#00153d] text-white shadow-lg' : 'bg-white/80 text-slate-500 hover:bg-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('favorites')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterType === 'favorites' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white/80 text-slate-500 hover:bg-white'
                }`}
              >
                <Star size={14} fill={filterType === 'favorites' ? "currentColor" : "none"} />
                Favoritos
              </button>
              <button
                onClick={() => setFilterType('mostPlayed')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterType === 'mostPlayed' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/80 text-slate-500 hover:bg-white'
                }`}
              >
                <Play size={14} fill={filterType === 'mostPlayed' ? "currentColor" : "none"} />
                Mais Tocados
              </button>
              <button
                onClick={() => setFilterType('mostRehearsed')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  filterType === 'mostRehearsed' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/80 text-slate-500 hover:bg-white'
                }`}
              >
                <Mic2 size={14} />
                Mais Ensaiados
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2.5rem] apple-shadow overflow-hidden border border-black/5">
        <div className="hidden md:grid grid-cols-12 px-8 py-5 bg-slate-50/50 border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="col-span-4 flex items-center gap-2">
            Titulo / Artista 
            <ArrowUpDown size={12} className="opacity-50" />
          </div>
          <div className="col-span-2 text-center uppercase">Tom</div>
          <div className="col-span-2 text-center uppercase">Metricas</div>
          <div className="col-span-2 text-center uppercase">Proficiencia</div>
          <div className="col-span-2 text-right uppercase">Acoes</div>
        </div>

        <div className="divide-y divide-black/5">
          {filteredSongs.map((song, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              key={song.id}
              className="flex flex-col md:grid md:grid-cols-12 items-start md:items-center px-6 md:px-8 py-5 hover:bg-slate-50 transition-all group gap-4 md:gap-0"
            >
              {/* Title & Artist & Favorite */}
              <div className="col-span-4 flex items-center gap-4 w-full">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => void toggleFavorite(song)}
                  className={`w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center transition-all ${
                    song.isFavorite
                      ? 'bg-yellow-50 text-yellow-500 shadow-sm border border-yellow-100'
                      : 'bg-slate-50 text-slate-300 group-hover:bg-white border border-transparent'
                  }`}
                >
                  <Star size={18} fill={song.isFavorite ? 'currentColor' : 'none'} className={song.isFavorite ? 'animate-toggle' : ''} />
                </motion.button>
                <button
                  onClick={() => onSelectSong(song.id)}
                  className="flex-1 min-w-0 text-left hover:translate-x-1 transition-transform"
                >
                  <h4 className="font-bold text-[#00153d] text-sm md:text-base mb-0.5 truncate">{song.title}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">{song.artist}</p>
                    {song.bpm && (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{song.bpm} BPM</span>
                    )}
                  </div>
                </button>
              </div>

              {/* In-table Key Editing */}
              <div className="col-span-2 flex justify-center w-full md:w-auto">
                <div className="flex items-center bg-blue-50/50 p-1.5 rounded-2xl border border-blue-100/50 group/key">
                  <button 
                    onClick={() => canEdit && void updateSongKey(song, -1)}
                    disabled={!canEdit}
                    className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover/key:opacity-100 disabled:hidden"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="w-10 text-center font-black text-blue-700 text-xs md:text-sm">{song.key}</span>
                  <button 
                    onClick={() => canEdit && void updateSongKey(song, 1)}
                    disabled={!canEdit}
                    className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover/key:opacity-100 disabled:hidden"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Usage Metrics (New) */}
              <div className="col-span-2 flex items-center justify-center gap-4 w-full md:w-auto">
                <div className="flex flex-col items-center group/stat">
                   <div className="flex items-center gap-1.5 text-blue-600/60 font-black text-[10px]">
                     <Play size={10} fill="currentColor" />
                     <span>{song.timesPlayed || 0}</span>
                   </div>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter opacity-0 group-hover/stat:opacity-100 transition-opacity">Cultos</span>
                </div>
                <div className="flex flex-col items-center group/stat">
                   <div className="flex items-center gap-1.5 text-indigo-500/60 font-black text-[10px]">
                     <Mic2 size={10} />
                     <span>{song.timesRehearsed || 0}</span>
                   </div>
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter opacity-0 group-hover/stat:opacity-100 transition-opacity">Ensaios</span>
                </div>
              </div>

              {/* In-table Proficiency Editing */}
              <div className="col-span-2 w-full md:px-4">
                <div className="flex items-center gap-1 md:justify-center">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => canEdit && void updateProficiency(song, level)}
                      disabled={!canEdit}
                      className={`h-1.5 flex-1 max-w-[20px] rounded-full transition-all ${
                        level <= song.proficiency ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-slate-200 hover:bg-slate-300'
                      } ${!canEdit ? 'cursor-default' : 'hover:scale-y-150'}`}
                      title={`${level}/5`}
                    />
                  ))}
                </div>
              </div>

              {/* Links & Actions */}
              <div className="col-span-2 flex items-center justify-between md:justify-end gap-3 w-full">
                <div className="flex gap-2">
                  {song.links.chords && (
                    <a
                      href={song.links.chords}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all hover:scale-110"
                      title="Cifra"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {song.links.lyrics && (
                    <a
                      href={song.links.lyrics}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all hover:scale-110"
                      title="Letra"
                    >
                      <FileText size={16} />
                    </a>
                  )}
                </div>
                
                {canEdit && (
                  <div className="flex items-center border-l border-black/5 pl-3 gap-1">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setEditingSong(song);
                      }}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setSongToDelete(song)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filteredSongs.length === 0 && (
            <div className="px-8 py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-50/20">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                <Search size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum louvor encontrado</p>
                <p className="text-xs text-slate-500 mt-1">Tente ajustar seus filtros ou busca.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingSong && (
          <SongEditorModal
            mode={isCreating ? 'create' : 'edit'}
            song={editingSong}
            onClose={() => {
              setEditingSong(null);
              setIsCreating(false);
            }}
            onSave={handleSaveEdit}
            onDelete={onDeleteSong}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!songToDelete}
        title="Excluir Louvor"
        message={songToDelete ? `Tem certeza que deseja excluir o louvor "${songToDelete.title}"?` : ''}
        onConfirm={() => {
          if (songToDelete) {
            void onDeleteSong(songToDelete.id);
            setSongToDelete(null);
          }
        }}
        onCancel={() => setSongToDelete(null)}
      />
    </div>
  );
}

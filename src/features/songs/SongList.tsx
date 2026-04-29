import React, { useMemo, useState } from 'react';
import { 
  Search, Filter, Plus, MoreVertical, ExternalLink, Star, X, Save, FileText, 
  Trash2, Edit2, ChevronLeft, ChevronRight, Play, Mic2, ArrowUpDown, ChevronDown, Check
} from 'lucide-react';
import { Song, WorshipEvent } from '../../types';
import { transposeKey, toggleMinorKey } from '../../lib/chordTransposer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton } from '../../components/BackButton';
import { SongClassificationWizard } from './SongClassificationWizard';

import { SongEditorModal, createEmptySong } from './SongEditorModal';


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


export function getSongReadinessLabel(song: Song): string {
  if (song.isActiveRepertoire === false) return 'Fora do repertório ativo';
  if (
    song.rehearsalStatus === 'rehearsed' &&
    song.teamKnowledge === 'we_know' &&
    song.rehearsalNeed === 'ready' &&
    song.attentionLevel === 'normal'
  ) {
    return 'Pronto para culto';
  }
  if (
    song.teamKnowledge === 'we_know' &&
    song.attentionLevel &&
    ['attention', 'high_attention'].includes(song.attentionLevel)
  ) {
    return 'Sabemos, mas exige atenção';
  }
  if (
    song.teamKnowledge === 'we_know' &&
    song.rehearsalNeed === 'light_rehearsal'
  ) {
    return 'Sabemos, mas precisa revisar';
  }
  if (
    song.rehearsalStatus === 'not_rehearsed' &&
    song.teamKnowledge === 'we_know'
  ) {
    return 'Não ensaiado oficialmente, mas conhecido';
  }
  if (
    song.teamKnowledge === 'we_do_not_know' &&
    song.technicalLevel &&
    song.technicalLevel >= 7
  ) {
    return 'Novo e técnico — precisa de preparo';
  }
  if (
    song.rehearsalStatus === 'not_rehearsed' &&
    song.teamKnowledge === 'we_do_not_know'
  ) {
    return 'Novo para tirar';
  }
  return 'A classificar';
}

export function getRehearsalPriority(song: Song): 'low' | 'medium' | 'high' | 'urgent' {
  if (song.isActiveRepertoire === false) return 'low';
  if (
    song.rehearsalNeed === 'intensive_rehearsal' ||
    (song.teamKnowledge === 'we_do_not_know' && (song.technicalLevel ?? 0) >= 7)
  ) {
    return 'urgent';
  }
  if (
    song.rehearsalNeed === 'needs_rehearsal' ||
    song.attentionLevel === 'high_attention'
  ) {
    return 'high';
  }
  if (
    song.rehearsalNeed === 'light_rehearsal' ||
    song.attentionLevel === 'attention'
  ) {
    return 'medium';
  }
  return 'low';
}

type FilterType = 
  | 'all' 
  | 'active'
  | 'inactive'
  | 'ready_for_service'
  | 'needs_rehearsal'
  | 'intensive_rehearsal'
  | 'we_know'
  | 'we_do_not_know'
  | 'attention'
  | 'high_attention'
  | 'technical_7_plus'
  | 'new_to_learn'
  | 'review_this_month'
  | 'favorites' 
  | 'mostPlayed' 
  | 'mostRehearsed';


export default function SongList({ songs, events, onCreateSong, onUpdateSong: onUpdateSongProp, onDeleteSong, onSelectSong, canEdit = true, onBack }: SongListProps) {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const filteredSongs = useMemo(() => {
    let result = [...songs].filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterType === 'active') {
      result = result.filter(s => s.isActiveRepertoire !== false);
    } else if (filterType === 'inactive') {
      result = result.filter(s => s.isActiveRepertoire === false);
    } else if (filterType === 'ready_for_service') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Pronto para culto');
    } else if (filterType === 'needs_rehearsal') {
      result = result.filter(s => s.rehearsalNeed === 'needs_rehearsal');
    } else if (filterType === 'intensive_rehearsal') {
      result = result.filter(s => s.rehearsalNeed === 'intensive_rehearsal');
    } else if (filterType === 'we_know') {
      result = result.filter(s => s.teamKnowledge === 'we_know');
    } else if (filterType === 'we_do_not_know') {
      result = result.filter(s => s.teamKnowledge === 'we_do_not_know');
    } else if (filterType === 'attention') {
      result = result.filter(s => s.attentionLevel === 'attention');
    } else if (filterType === 'high_attention') {
      result = result.filter(s => s.attentionLevel === 'high_attention');
    } else if (filterType === 'technical_7_plus') {
      result = result.filter(s => (s.technicalLevel || 0) >= 7);
    } else if (filterType === 'new_to_learn') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Novo para tirar');
    } else if (filterType === 'review_this_month') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Revisar todo mês' || (s.attentionLevel === 'high_attention' && (s.technicalLevel || 0) >= 7));
    } else if (filterType === 'favorites') {
      result = result.filter(s => s.isFavorite);
    } else if (filterType === 'mostPlayed') {
      result = result.sort((a, b) => (b.timesPlayed || 0) - (a.timesPlayed || 0));
    } else if (filterType === 'mostRehearsed') {
      result = result.sort((a, b) => (b.timesRehearsed || 0) - (a.timesRehearsed || 0));
    }

    return result;
  }, [searchQuery, songs, filterType]);

  const updateProficiency = async (song: Song, level: number) => {
    await onUpdateSongProp({ ...song, proficiency: level });
  };

  const toggleFavorite = async (song: Song) => {
    await onUpdateSongProp({ ...song, isFavorite: !song.isFavorite });
  };

  const updateSongKey = async (song: Song, semitones: number) => {
    const newKey = transposeKey(song.key, semitones);
    await onUpdateSongProp({ ...song, key: newKey });
  };

  const handleSaveEdit = async (updatedSong: Song) => {
    if (isCreating) {
      const { id: _id, ...songPayload } = updatedSong;
      await onCreateSong(songPayload);
      setIsCreating(false);
      return;
    }

    await onUpdateSongProp(updatedSong);
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
                onClick={() => setShowWizard(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                title="Classificar Repertório"
              >
                <Star size={18} />
                <span className="hidden lg:inline">Classificar Repertório</span>
              </motion.button>
            )}
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
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-black/5 rounded-2xl text-sm font-bold text-[#00153d] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              >
                <option value="all">Todos os Louvores</option>
                <option value="active">Repertório Ativo</option>
                <option value="inactive">Fora do Repertório Ativo</option>
                <option value="ready_for_service">✅ Prontos para culto</option>
                <option value="needs_rehearsal">⚠️ Precisam de ensaio</option>
                <option value="intensive_rehearsal">🚨 Precisam de muito ensaio</option>
                <option value="we_know">🎸 Sabemos tocar</option>
                <option value="we_do_not_know">📚 Não sabemos ainda</option>
                <option value="attention">👀 Precisam de atenção</option>
                <option value="high_attention">🔥 Atenção alta</option>
                <option value="technical_7_plus">🎸 Nível técnico 7+</option>
                <option value="new_to_learn">🆕 Novos para tirar</option>
                <option value="review_this_month">📅 Revisar este mês</option>
                <option value="favorites">⭐ Favoritos</option>
                <option value="mostPlayed">▶️ Mais Tocados</option>
                <option value="mostRehearsed">🎤 Mais Ensaiados</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2.5rem] apple-shadow overflow-hidden border border-black/5">
        <div className="hidden md:grid grid-cols-12 px-8 py-5 bg-slate-50/50 border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="col-span-3 flex items-center gap-2">
            Titulo / Artista 
            <ArrowUpDown size={12} className="opacity-50" />
          </div>
          <div className="col-span-2 text-center uppercase">Classificacao</div>
          <div className="col-span-1 text-center uppercase">Tom</div>
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
              <div className="col-span-3 flex items-center gap-4 w-full">
                <div className="relative">
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
                  {song.cover_url && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
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
                  <div className="mt-1 flex gap-1">
                    {getSongReadinessLabel(song) !== 'A classificar' && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                        getSongReadinessLabel(song) === 'Pronto para culto' ? 'bg-green-50 text-green-600 border-green-200' :
                        getSongReadinessLabel(song) === 'Sabemos, mas exige atenção' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        getSongReadinessLabel(song) === 'Sabemos, mas precisa revisar' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        getSongReadinessLabel(song) === 'Novo e técnico — precisa de preparo' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {getSongReadinessLabel(song)}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Classificação */}
              <div className="col-span-2 flex justify-center w-full md:w-auto">
                {song.classifiedAt ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-600 border border-green-100">
                    <Check size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Revisado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pendente</span>
                  </div>
                )}
              </div>

              {/* In-table Key Editing */}
              <div className="col-span-1 flex justify-center w-full md:w-auto">
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

      <AnimatePresence>
        {showWizard && (
          <SongClassificationWizard
            songs={songs}
            onUpdateSong={async (songId, updates) => {
              const song = songs.find(s => s.id === songId);
              if (song) {
                await onUpdateSongProp({ ...song, ...updates });
              }
            }}
            onClose={() => setShowWizard(false)}
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

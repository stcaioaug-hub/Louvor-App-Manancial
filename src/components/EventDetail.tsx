import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Music,
  Users,
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  ExternalLink,
  FileText,
  CheckCircle2,
  Edit2,
  LoaderCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatFullDate } from '../lib/dateUtils';
import { BackButton } from './BackButton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorshipEvent, Song, TeamMember } from '../types';

const STANDARD_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getBaseKey(key: string) {
  if (!key) return { base: 'C', minor: false };
  const minor = key.toLowerCase().endsWith('m');
  let base = key.replace(/m$/i, '');
  
  const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  if (flatToSharp[base]) base = flatToSharp[base];
  if (!STANDARD_KEYS.includes(base)) base = 'C';
  
  return { base, minor };
}

function transposeKey(key: string, steps: number) {
  const { base, minor } = getBaseKey(key);
  let index = STANDARD_KEYS.indexOf(base);
  if (index === -1) index = 0;
  
  index = (index + steps) % 12;
  if (index < 0) index += 12;
  
  return STANDARD_KEYS[index] + (minor ? 'm' : '');
}

function toggleMinorKey(key: string) {
  const { base, minor } = getBaseKey(key);
  return base + (minor ? '' : 'm');
}

interface EventDetailProps {
  event: WorshipEvent;
  songs: Song[];
  team: TeamMember[];
  onBack: () => void;
  onUpdate: (updatedEvent: WorshipEvent) => Promise<void>;
  onUpdateSong: (updatedSong: Song) => Promise<void>;
  onSelectSong: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onDeleteEvent?: () => void;
  events: WorshipEvent[];
  canEdit?: boolean;
}

interface SortableSongItemProps {
  id: string;
  song: Song | undefined;
  isEditing: boolean;
  onRemove: () => void;
  onEditSong: (song: Song) => void;
  onSelectSong: (id: string) => void;
  type?: 'main' | 'offering' | 'outro';
  key?: string | number;
  index: number;
}

function SortableSongItem({ id, song, isEditing, onRemove, onEditSong, onSelectSong, type, index }: SortableSongItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const sectionGradients = {
    main: "bg-gradient-to-br from-[#00153d]/5 to-blue-500/5 hover:from-[#00153d]/10 hover:to-blue-500/10 border-blue-500/20",
    offering: "bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 border-emerald-500/20",
    outro: "bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 border-purple-500/20"
  };

  const bgStyle = type ? sectionGradients[type] : "bg-white hover:bg-slate-50 border-black/5";

  if (!song) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-2xl shadow-sm hover:shadow-md transition-all group backdrop-blur-sm ${bgStyle} ${
        isDragging ? 'shadow-2xl scale-[1.02]' : ''
      }`}
    >
      {isEditing && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={18} className="md:w-5 md:h-5" />
        </div>
      )}

      <button
        onClick={() => onSelectSong(song.id)}
        className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity flex items-center gap-3"
      >
        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded hidden sm:inline-block">
          {index + 1}º Louvor
        </span>
        <span className="text-[10px] font-black text-slate-400 sm:hidden">
          {index + 1}º
        </span>
        <div className="flex-1 min-w-0">
          <h5 className="font-bold text-xs md:text-sm text-[#00153d] truncate">{song.title}</h5>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-medium truncate">{song.artist}</p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          {song.key}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              onClick={() => onEditSong(song)}
              className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 size={14} className="md:w-4 md:h-4" />
            </button>
            <button
              onClick={onRemove}
              className="p-1.5 md:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={14} className="md:w-4 md:h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 md:gap-1">
            {song.links.chords && (
              <a
                href={song.links.chords}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              >
                <ExternalLink size={14} className="md:w-4 md:h-4" />
              </a>
            )}
            {song.links.lyrics && (
              <a
                href={song.links.lyrics}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 md:p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <FileText size={14} className="md:w-4 md:h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventDetail({ event, events, songs, team, onBack, onUpdate, onUpdateSong, onSelectSong, onSelectEvent, onDeleteEvent, canEdit = false }: EventDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState<WorshipEvent>({ ...event });
  const [editingSongMetadata, setEditingSongMetadata] = useState<Song | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState<'main' | 'offering' | 'outro' | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState<'vocal' | 'instrument' | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedEvent({ ...event });
  }, [event]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const scaledMembers = useMemo(
    () => Array.from(new Set([...editedEvent.team.vocal, ...Object.values(editedEvent.team.instruments)])),
    [editedEvent.team]
  );

  const allConfirmed = scaledMembers.length > 0 && scaledMembers.every((member) => editedEvent.attendance?.[member]);

  const handleQuickSave = async (newEvent: WorshipEvent) => {
    setEditedEvent(newEvent);
    if (!isEditing) {
      try {
        await onUpdate(newEvent);
      } catch (error) {
        console.error("Failed to update event", error);
      }
    }
  };

  const handleDragEnd = (dragEvent: DragEndEvent, listType: 'main' | 'offering' | 'outro') => {
    const { active, over } = dragEvent;

    if (over && active.id !== over.id) {
      const listName = listType === 'main' ? 'songs' : listType === 'offering' ? 'offeringSongs' : 'outroSongs';
      const list = editedEvent[listName] || [];
      const oldIndex = list.indexOf(active.id as string);
      const newIndex = list.indexOf(over.id as string);
      const newList = arrayMove(list, oldIndex, newIndex);

      handleQuickSave({ ...editedEvent, [listName]: newList });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editedEvent);
      setIsEditing(false);
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editedEvent);
      setShowAttendanceModal(false);
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAttendance = (userId: string) => {
    setEditedEvent((previous) => {
      const attendance = { ...(previous.attendance || {}) };
      attendance[userId] = !attendance[userId];
      return { ...previous, attendance };
    });
  };

  const toggleAllAttendance = () => {
    setEditedEvent((previous) => {
      const attendance = { ...(previous.attendance || {}) };
      const currentAllConfirmed = scaledMembers.length > 0 && scaledMembers.every((member) => previous.attendance?.[member]);
      scaledMembers.forEach((member) => {
        attendance[member] = !currentAllConfirmed;
      });
      return { ...previous, attendance };
    });
  };

  const formatDate = (dateStr: string) => formatFullDate(dateStr);

  const removeSong = (id: string, listType: 'main' | 'offering' | 'outro') => {
    const listName = listType === 'main' ? 'songs' : listType === 'offering' ? 'offeringSongs' : 'outroSongs';
    const newList = (editedEvent[listName] || []).filter((songId) => songId !== id);
    handleQuickSave({ ...editedEvent, [listName]: newList });
  };

  const addSong = (id: string, listType: 'main' | 'offering' | 'outro') => {
    const listName = listType === 'main' ? 'songs' : listType === 'offering' ? 'offeringSongs' : 'outroSongs';
    const list = editedEvent[listName] || [];
    if (list.includes(id)) {
      setShowAddSongModal(null);
      return;
    }

    const newList = [...list, id];
    handleQuickSave({ ...editedEvent, [listName]: newList });
    setShowAddSongModal(null);
  };

  const removeTeamMember = (name: string, type: 'vocal' | 'instrument', instrumentKey?: string) => {
    setEditedEvent((previous) => {
      if (type === 'vocal') {
        return {
          ...previous,
          attendance: Object.fromEntries(
            Object.entries(previous.attendance || {}).filter(([key]) => key !== name)
          ),
          team: {
            ...previous.team,
            vocal: previous.team.vocal.filter((memberName) => memberName !== name),
          },
        };
      }

      if (instrumentKey) {
        const instruments = { ...previous.team.instruments };
        delete instruments[instrumentKey];

        return {
          ...previous,
          attendance: Object.fromEntries(
            Object.entries(previous.attendance || {}).filter(([key]) => key !== name)
          ),
          team: {
            ...previous.team,
            instruments,
          },
        };
      }

      return previous;
    });
  };

  const addTeamMember = (member: TeamMember, type: 'vocal' | 'instrument') => {
    setEditedEvent((previous) => {
      if (type === 'vocal') {
        if (previous.team.vocal.includes(member.name)) return previous;

        return {
          ...previous,
          team: {
            ...previous.team,
            vocal: [...previous.team.vocal, member.name],
          },
        };
      }

      return {
        ...previous,
        team: {
          ...previous.team,
          instruments: {
            ...previous.team.instruments,
            [member.category]: member.name,
          },
        },
      };
    });

    setShowAddTeamModal(null);
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const currentIndex = sortedEvents.findIndex(e => e.id === event.id);
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <BackButton onClick={onBack} />
          
          <div className="flex items-center gap-2">
            <button 
              disabled={!prevEvent}
              onClick={() => prevEvent && onSelectEvent(prevEvent.id)}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all apple-shadow"
              title={prevEvent ? `Anterior: ${prevEvent.title}` : undefined}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={!nextEvent}
              onClick={() => nextEvent && onSelectEvent(nextEvent.id)}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all apple-shadow"
              title={nextEvent ? `Próximo: ${nextEvent.title}` : undefined}
            >
               <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {canEdit && (
            <>
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#00153d] rounded-2xl font-bold apple-shadow hover:bg-slate-50 transition-all"
                  >
                    <Edit2 size={18} />
                    <span className="hidden sm:inline">Editar Detalhes</span>
                    <span className="sm:hidden">Editar</span>
                  </button>
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/10 hover:opacity-90 transition-all"
                  >
                    <CheckCircle2 size={18} />
                    <span className="hidden sm:inline">Confirmar Presenca</span>
                    <span className="sm:hidden">Confirmar</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditedEvent({ ...event });
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-500 rounded-2xl font-bold apple-shadow hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 apple-shadow space-y-10">
        <section className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedEvent.title}
                  onChange={(eventTarget) => setEditedEvent({ ...editedEvent, title: eventTarget.target.value })}
                  className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight w-full bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-2"
                />
              ) : (
                <h2 className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight">{editedEvent.title}</h2>
              )}
              <div
                className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                  editedEvent.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}
              >
                {editedEvent.type === 'service' ? 'Culto' : 'Ensaio'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 apple-shadow">
                <CalendarIcon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</p>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedEvent.date}
                    onChange={(eventTarget) => setEditedEvent({ ...editedEvent, date: eventTarget.target.value })}
                    className="text-sm font-bold text-[#00153d] bg-transparent border-none p-0 w-full"
                  />
                ) : (
                  <p className="text-sm font-bold text-[#00153d] capitalize">{formatDate(editedEvent.date)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 apple-shadow">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</p>
                {isEditing ? (
                  <input
                    type="time"
                    value={editedEvent.time}
                    onChange={(eventTarget) => setEditedEvent({ ...editedEvent, time: eventTarget.target.value })}
                    className="text-sm font-bold text-[#00153d] bg-transparent border-none p-0 w-full"
                  />
                ) : (
                  <p className="text-sm font-bold text-[#00153d]">{editedEvent.time}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 apple-shadow">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedEvent.location || ''}
                    onChange={(eventTarget) => setEditedEvent({ ...editedEvent, location: eventTarget.target.value })}
                    placeholder="Local do evento..."
                    className="text-sm font-bold text-[#00153d] bg-transparent border-none p-0 w-full"
                  />
                ) : (
                  <p className="text-sm font-bold text-[#00153d]">{editedEvent.location || 'Igreja Manancial'}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
              <Music size={24} className="text-blue-600" />
              Repertorio Principal
            </h3>
            {(isEditing || canEdit) && (
              <button
                onClick={() => setShowAddSongModal('main')}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus size={18} />
                Adicionar Musica
              </button>
            )}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(eventTarget) => handleDragEnd(eventTarget, 'main')}>
            <SortableContext items={editedEvent.songs} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editedEvent.songs.map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((song) => song.id === songId)}
                    isEditing={isEditing || canEdit}
                    onRemove={() => removeSong(songId, 'main')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    type="main"
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
              <Music size={24} className="text-emerald-600" />
              Momento da Oferta
            </h3>
            {(isEditing || canEdit) && (
              <button
                onClick={() => setShowAddSongModal('offering')}
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus size={18} />
                Adicionar Musica
              </button>
            )}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(eventTarget) => handleDragEnd(eventTarget, 'offering')}>
            <SortableContext items={editedEvent.offeringSongs || []} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(editedEvent.offeringSongs || []).map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((song) => song.id === songId)}
                    isEditing={isEditing || canEdit}
                    onRemove={() => removeSong(songId, 'offering')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    type="offering"
                    index={index}
                  />
                ))}
                {(!editedEvent.offeringSongs || editedEvent.offeringSongs.length === 0) && !isEditing && (
                  <div className="col-span-full p-8 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum louvor de oferta definido</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
              <Music size={24} className="text-purple-600" />
              Louvores para o Final
            </h3>
            {(isEditing || canEdit) && (
              <button
                onClick={() => setShowAddSongModal('outro')}
                className="flex items-center gap-2 text-purple-600 font-bold text-sm hover:bg-purple-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus size={18} />
                Adicionar Musica
              </button>
            )}
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(eventTarget) => handleDragEnd(eventTarget, 'outro')}>
            <SortableContext items={editedEvent.outroSongs || []} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(editedEvent.outroSongs || []).map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((song) => song.id === songId)}
                    isEditing={isEditing || canEdit}
                    onRemove={() => removeSong(songId, 'outro')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    type="outro"
                    index={index}
                  />
                ))}
                {(!editedEvent.outroSongs || editedEvent.outroSongs.length === 0) && !isEditing && (
                  <div className="col-span-full p-8 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum louvor final definido</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              Escala da Equipe
            </h3>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vocais</p>
                {isEditing && (
                  <button
                    onClick={() => setShowAddTeamModal('vocal')}
                    className="text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
                  >
                    + Adicionar Vocal
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {editedEvent.team.vocal.map((name) => (
                  <div key={name} className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white rounded-2xl apple-shadow group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase">
                      {name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-[#00153d]">{name}</span>
                    {editedEvent.attendance?.[name] && <CheckCircle2 size={14} className="text-emerald-500" />}
                    {isEditing && (
                      <button
                        onClick={() => removeTeamMember(name, 'vocal')}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instrumental</p>
                {isEditing && (
                  <button
                    onClick={() => setShowAddTeamModal('instrument')}
                    className="text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
                  >
                    + Adicionar Instrumento
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(editedEvent.team.instruments).map(([instrument, name]) => (
                  <div key={instrument} className="flex items-center justify-between p-4 bg-white rounded-2xl apple-shadow group">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{instrument}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#00153d]">{name as string}</p>
                        {editedEvent.attendance?.[name as string] && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeTeamMember(name as string, 'instrument', instrument)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {editingSongMetadata && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#00153d]">Editar Referencias</h3>
                <button onClick={() => setEditingSongMetadata(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tom</label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-black/5 rounded-2xl h-[46px]">
                         <button
                           onClick={() => setEditingSongMetadata({ ...editingSongMetadata, key: transposeKey(editingSongMetadata.key, -1) })}
                           className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                           title="Abaixar meio tom"
                         >
                           <ChevronLeft size={18} />
                         </button>
                         <span className="font-bold text-[#00153d] text-base w-10 text-center">{editingSongMetadata.key}</span>
                         <button
                           onClick={() => setEditingSongMetadata({ ...editingSongMetadata, key: transposeKey(editingSongMetadata.key, 1) })}
                           className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                           title="Aumentar meio tom"
                         >
                           <ChevronRight size={18} />
                         </button>
                       </div>
                       <button
                         onClick={() => setEditingSongMetadata({ ...editingSongMetadata, key: toggleMinorKey(editingSongMetadata.key) })}
                         className={`px-4 py-0 h-[46px] rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center ${
                           editingSongMetadata.key.toLowerCase().endsWith('m')
                             ? 'bg-blue-50 border-blue-200 text-blue-700'
                             : 'bg-slate-50 border-black/5 text-slate-400 hover:bg-slate-100'
                         }`}
                         title="Alternar entre tom maior e menor"
                       >
                         Menor (m)
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Proficiencia
                    </label>
                    <div className="flex items-center gap-1.5 h-[46px]">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => setEditingSongMetadata({ ...editingSongMetadata, proficiency: level })}
                          className={`flex-1 h-2 rounded-full transition-all ${
                            level <= editingSongMetadata.proficiency ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Link da Cifra</label>
                  <input
                    type="text"
                    value={editingSongMetadata.links.chords || ''}
                    onChange={(eventTarget) =>
                      setEditingSongMetadata({
                        ...editingSongMetadata,
                        links: { ...editingSongMetadata.links, chords: eventTarget.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Link da Letra</label>
                  <input
                    type="text"
                    value={editingSongMetadata.links.lyrics || ''}
                    onChange={(eventTarget) =>
                      setEditingSongMetadata({
                        ...editingSongMetadata,
                        links: { ...editingSongMetadata.links, lyrics: eventTarget.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex gap-4">
                <button
                  onClick={() => setEditingSongMetadata(null)}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-bold apple-shadow disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!editingSongMetadata) return;

                    try {
                      setIsSaving(true);
                      await onUpdateSong(editingSongMetadata);
                      setEditingSongMetadata(null);
                    } catch {
                      return;
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddSongModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#00153d]">Selecionar Musica</h3>
                <button onClick={() => setShowAddSongModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => addSong(song.id, showAddSongModal)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                  >
                    <div>
                      <p className="font-bold text-[#00153d] group-hover:text-blue-600 transition-colors">{song.title}</p>
                      <p className="text-xs text-slate-500">{song.artist}</p>
                    </div>
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{song.key}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showAddTeamModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#00153d]">Selecionar Integrante</h3>
                <button onClick={() => setShowAddTeamModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {team
                  .filter((member) => (showAddTeamModal === 'vocal' ? member.category === 'Vocais' : member.category !== 'Vocais'))
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => addTeamMember(member, showAddTeamModal)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#00153d] group-hover:text-blue-600 transition-colors">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}

        {showAttendanceModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-[#00153d]">Presenca da Escala</h3>
                  <p className="text-sm text-slate-500">Marque quem confirmou participacao neste evento.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllAttendance}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      allConfirmed 
                        ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' 
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {allConfirmed ? 'Desmarcar Todos' : 'Confirmar Todos'}
                  </button>
                  <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {scaledMembers.map((memberName) => {
                  const isPresent = editedEvent.attendance?.[memberName] ?? false;

                  return (
                    <button
                      key={memberName}
                      onClick={() => toggleAttendance(memberName)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                        isPresent
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-black/5 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold">{memberName}</span>
                      <span className="text-xs font-bold uppercase tracking-widest">{isPresent ? 'Confirmado' : 'Pendente'}</span>
                    </button>
                  );
                })}

                {scaledMembers.length === 0 && (
                  <div className="px-6 py-10 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum integrante escalado</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-bold apple-shadow disabled:opacity-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => void handleSaveAttendance()}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Presenca'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

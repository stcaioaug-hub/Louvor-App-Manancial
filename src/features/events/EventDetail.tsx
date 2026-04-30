import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Eye,
  Mic,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatFullDate, isPastEvent } from '../../lib/dateUtils';
import { BackButton } from '../../components/BackButton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorshipEvent, Song, TeamMember, Profile, UserSongStudy } from '../../types';
import toast from 'react-hot-toast';

import { transposeKey, toggleMinorKey } from '../../lib/chordTransposer';

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
  userProfile?: Profile | null;
  isSidebarHidden?: boolean;
  userSongStudy?: UserSongStudy[];
  onToggleStudySong?: (songId: string) => Promise<void>;
  onRefreshBlockChange?: (blocked: boolean) => void;
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
  onExpand: (id: string) => void;
  isStudying: boolean;
  onToggleStudy: (songId: string) => void;
  vocalists?: string[];
  assignedVocal?: string;
  onAssignVocal?: (vocal: string) => void;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-orange-500',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

function cloneEditableEvent(event: WorshipEvent): WorshipEvent {
  return {
    ...event,
    songs: [...(event.songs ?? [])],
    offeringSongs: [...(event.offeringSongs ?? [])],
    outroSongs: [...(event.outroSongs ?? [])],
    team: {
      vocal: [...(event.team?.vocal ?? [])],
      instruments: { ...(event.team?.instruments ?? {}) },
    },
    attendance: { ...(event.attendance ?? {}) },
    songVocals: { ...(event.songVocals ?? {}) },
  };
}

function serializeEditableEvent(event: WorshipEvent) {
  return JSON.stringify({
    id: event.id,
    date: event.date,
    time: event.time,
    title: event.title,
    type: event.type,
    location: event.location ?? '',
    description: event.description ?? '',
    songs: event.songs ?? [],
    offeringSongs: event.offeringSongs ?? [],
    outroSongs: event.outroSongs ?? [],
    team: {
      vocal: event.team?.vocal ?? [],
      instruments: event.team?.instruments ?? {},
    },
    attendance: event.attendance ?? {},
    songVocals: event.songVocals ?? {},
  });
}

function hasEventChanges(original: WorshipEvent, draft: WorshipEvent) {
  return serializeEditableEvent(original) !== serializeEditableEvent(draft);
}

function DroppableZone({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
}

function AttendanceAvatarStack({ confirmedMembers }: { confirmedMembers: { name: string; avatar?: string }[] }) {
  const maxDisplay = 5;
  const displayed = confirmedMembers.slice(0, maxDisplay);
  const remaining = confirmedMembers.length - maxDisplay;

  if (confirmedMembers.length === 0) return null;

  return (
    <div className="flex -space-x-2.5 md:-space-x-3 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {displayed.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
            className="relative inline-block"
            style={{ zIndex: confirmedMembers.length - index }}
            title={member.name}
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] md:text-xs font-black text-white ${getAvatarColor(member.name)} ring-1 ring-black/5`}>
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {remaining > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block z-0"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 ring-1 ring-black/5">
            +{remaining}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SortableSongItem({ 
  id, 
  song, 
  isEditing, 
  onRemove, 
  onEditSong, 
  onSelectSong, 
  type, 
  index, 
  onExpand, 
  isStudying, 
  onToggleStudy,
  vocalists = [],
  assignedVocal,
  onAssignVocal
}: SortableSongItemProps) {
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
      onClick={() => !isEditing && onExpand(song.id)}
      className={`flex items-center gap-4 p-4 md:p-5 border rounded-[1.5rem] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group backdrop-blur-sm cursor-pointer ${bgStyle} ${
        isDragging ? 'shadow-2xl scale-[1.05] rotate-1' : ''
      }`}
    >
      {isEditing && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500 p-2 -ml-2">
          <GripVertical size={20} className="md:w-6 md:h-6" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="flex flex-col items-center justify-center min-w-[40px] h-10 bg-slate-100/50 rounded-xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
            {index + 1}º
          </span>
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest -mt-1 hidden sm:block">
            Pos
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-headline font-bold text-sm md:text-base text-[#00153d] truncate group-hover:text-blue-600 transition-colors tracking-tight">{song.title}</h5>
          <div className="flex items-center gap-2">
            <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate opacity-70 italic">{song.artist}</p>
            {isEditing && vocalists.length > 0 && (
              <select
                value={assignedVocal || ''}
                onChange={(e) => onAssignVocal?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] font-bold bg-white border border-black/5 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-blue-600"
              >
                <option value="">Voz...</option>
                {vocalists.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Todos">Todos</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          {song.key}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStudy(song.id);
              }}
              className={`p-1.5 md:p-2 rounded-xl transition-all ${
                isStudying 
                  ? 'bg-amber-100 text-amber-600 shadow-sm' 
                  : 'bg-slate-50 text-slate-300 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title={isStudying ? "Remover do estudo" : "Marcar para estudar"}
            >
              <Music size={14} className="md:w-4 md:h-4" />
            </button>
          )}

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
          <div className="flex flex-col items-end gap-1">
            {assignedVocal && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold border border-blue-100">
                <Mic size={10} />
                <span>{assignedVocal}</span>
              </div>
            )}
            <div className="flex items-center gap-1 md:gap-2">
            {song.links.chords && (
              <a
                href={song.links.chords}
                target="_blank"
                rel="noopener noreferrer"
                title="Cifra"
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-all"
              >
                <Music size={12} />
                <span className="hidden lg:inline">Cifra</span>
              </a>
            )}
            {song.links.lyrics && (
              <a
                href={song.links.lyrics}
                target="_blank"
                rel="noopener noreferrer"
                title="Letra"
                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all"
              >
                <FileText size={12} />
                <span className="hidden lg:inline">Letra</span>
              </a>
            )}
            <button 
              className="p-1.5 text-slate-300 group-hover:text-blue-400 transition-colors"
              title="Expandir detalhes"
            >
              <Eye size={16} />
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default function EventDetail({ event, events, songs, team, onBack, onUpdate, onUpdateSong, onSelectSong, onSelectEvent, onDeleteEvent, canEdit = false, userProfile, isSidebarHidden = false, userSongStudy = [], onToggleStudySong, onRefreshBlockChange }: EventDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const lastSyncedEventRef = useRef<WorshipEvent>(cloneEditableEvent(event));
  const [editedEvent, setEditedEvent] = useState<WorshipEvent>(() => cloneEditableEvent(event));
  const [editingSongMetadata, setEditingSongMetadata] = useState<Song | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState<'main' | 'offering' | 'outro' | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState<'vocal' | 'instrument' | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMyAttendanceReview, setShowMyAttendanceReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');

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

  const filteredSongs = useMemo(() => {
    if (!songSearchQuery) return songs;
    const query = songSearchQuery.toLowerCase();
    return songs.filter(song => 
      song.title.toLowerCase().includes(query) || 
      song.artist.toLowerCase().includes(query)
    );
  }, [songs, songSearchQuery]);

  const allConfirmed = scaledMembers.length > 0 && scaledMembers.every((member) => editedEvent.attendance?.[member]);

  const hasUnsavedChanges = useMemo(() => {
    if (!event || !editedEvent) return false;
    return hasEventChanges(event, editedEvent);
  }, [event, editedEvent]);

  useEffect(() => {
    const nextSyncedEvent = cloneEditableEvent(event);

    setEditedEvent((currentDraft) => {
      const previousSyncedEvent = lastSyncedEventRef.current;
      const switchedEvent = currentDraft.id !== nextSyncedEvent.id || previousSyncedEvent.id !== nextSyncedEvent.id;
      const draftHasLocalChanges = hasEventChanges(previousSyncedEvent, currentDraft);

      lastSyncedEventRef.current = nextSyncedEvent;

      if (switchedEvent) {
        return nextSyncedEvent;
      }

      if (isEditing || isSaving || draftHasLocalChanges) {
        return currentDraft;
      }

      return nextSyncedEvent;
    });
  }, [event, isEditing, isSaving]);

  useEffect(() => {
    const blocksRefresh = isEditing || isSaving || hasUnsavedChanges;
    onRefreshBlockChange?.(blocksRefresh);

    return () => {
      onRefreshBlockChange?.(false);
    };
  }, [hasUnsavedChanges, isEditing, isSaving, onRefreshBlockChange]);

  const handleQuickSave = async (newEvent: WorshipEvent) => {
    setEditedEvent(newEvent);
  };

  const findContainer = (id: string) => {
    if (id === 'main' || id === 'offering' || id === 'outro') return id;
    if (editedEvent.songs.includes(id)) return 'main';
    if (editedEvent.offeringSongs?.includes(id)) return 'offering';
    if (editedEvent.outroSongs?.includes(id)) return 'outro';
    return null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setEditedEvent((prev) => {
      const activeListName = activeContainer === 'main' ? 'songs' : activeContainer === 'offering' ? 'offeringSongs' : 'outroSongs';
      const overListName = overContainer === 'main' ? 'songs' : overContainer === 'offering' ? 'offeringSongs' : 'outroSongs';
      
      const activeItems = [...(prev[activeListName] || [])];
      const overItems = [...(prev[overListName] || [])];

      const activeIndex = activeItems.indexOf(active.id as string);
      const overIndex = overItems.indexOf(overId as string);

      let newIndex;
      if (overIndex >= 0) {
        newIndex = overIndex;
      } else {
        newIndex = overItems.length;
      }

      const updatedActive = activeItems.filter((id) => id !== active.id);
      const updatedOver = [
        ...overItems.slice(0, newIndex),
        active.id as string,
        ...overItems.slice(newIndex),
      ];

      return {
        ...prev,
        [activeListName]: updatedActive,
        [overListName]: updatedOver,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) return;

    const listName = activeContainer === 'main' ? 'songs' : activeContainer === 'offering' ? 'offeringSongs' : 'outroSongs';
    const list = editedEvent[listName] || [];
    const activeIndex = list.indexOf(active.id as string);
    const overIndex = list.indexOf(overId as string);

    if (activeIndex !== overIndex) {
      const newList = arrayMove(list, activeIndex, overIndex);
      handleQuickSave({ ...editedEvent, [listName]: newList });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editedEvent);
      setIsEditing(false);
      toast.success('Evento atualizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar: ' + (error.message || 'Verifique sua conexão.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true);
      await onUpdate(editedEvent);
      setShowAttendanceModal(false);
      toast.success('Presenças salvas com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar presenças: ' + (error.message || 'Verifique sua conexão.'));
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
  
  const handleAssignVocal = (songId: string, vocalName: string) => {
    setEditedEvent(prev => ({
      ...prev,
      songVocals: {
        ...(prev.songVocals || {}),
        [songId]: vocalName
      }
    }));
  };

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
    setSongSearchQuery('');
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
  const isPast = isPastEvent(editedEvent.date, editedEvent.time);

  const confirmedMembers = useMemo(() => {
    if (!editedEvent.attendance) return [];
    
    // Get all unique names that are confirmed (true)
    return Object.entries(editedEvent.attendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([name]) => {
        // Use robust matching to find member in team
        const normalizedSearch = name.trim().toLowerCase();
        const member = team.find(m => m.name.trim().toLowerCase() === normalizedSearch);
        
        return {
          name: member?.name || name.trim(),
          avatar: member?.avatar,
        };
      });
  }, [editedEvent.attendance, team]);

  const isConfirmed = (name: string) => {
    if (!editedEvent.attendance) return false;
    const normalized = name.trim().toLowerCase();
    return Object.entries(editedEvent.attendance).some(
      ([n, present]) => present && n.trim().toLowerCase() === normalized
    );
  };

  const checkIsStudying = (songId: string) => userSongStudy.some(s => s.song_id === songId);
  const handleToggleStudy = (songId: string) => {
    if (onToggleStudySong) {
      void onToggleStudySong(songId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {isPast && !isEditing && canEdit && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold">Este evento já ocorreu!</p>
              <p className="text-xs opacity-80">Deseja revisar e atualizar o repertório que foi efetivamente tocado?</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
          >
            Revisar Repertório
          </button>
        </motion.div>
      )}
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between w-full">
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

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
               {isEditing ? (
                  <input
                    type="text"
                    value={editedEvent.title}
                    onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight w-full bg-white/50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 p-2"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight truncate">{editedEvent.title}</h2>
                )}
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest self-start mt-2 ${
                editedEvent.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
              }`}
            >
              {editedEvent.type === 'service' ? 'Culto' : 'Ensaio'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm">
              <CalendarIcon size={16} className="text-blue-500" />
              {isEditing ? (
                <input
                  type="date"
                  value={editedEvent.date}
                  onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                  className="text-xs font-bold text-[#00153d] bg-transparent border-none p-0 w-28"
                />
              ) : (
                <span className="text-xs font-bold text-[#00153d]">{formatDate(editedEvent.date)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm">
              <Clock size={16} className="text-blue-500" />
              {isEditing ? (
                <input
                  type="time"
                  value={editedEvent.time}
                  onChange={(e) => setEditedEvent({ ...editedEvent, time: e.target.value })}
                  className="text-xs font-bold text-[#00153d] bg-transparent border-none p-0 w-16"
                />
              ) : (
                <span className="text-xs font-bold text-[#00153d]">{editedEvent.time}</span>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm">
              <MapPin size={16} className="text-blue-500" />
              {isEditing ? (
                <input
                  type="text"
                  value={editedEvent.location || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                  placeholder="Local..."
                  className="text-xs font-bold text-[#00153d] bg-transparent border-none p-0 w-24"
                />
              ) : (
                <span className="text-xs font-bold text-[#00153d]">{editedEvent.location || 'Manancial'}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 apple-shadow border border-white/40 space-y-12">
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-3xl flex items-center gap-3 text-[#00153d] text-xs font-bold"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <GripVertical size={16} />
            </div>
            <span>Dica: Arraste os louvores entre as seções para mudar o momento do culto.</span>
          </motion.div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {/* Repertoire Content */}

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

          <DroppableZone id="main">
            <SortableContext items={editedEvent.songs} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50px]">
                {editedEvent.songs.map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((s) => s.id === songId)}
                    isEditing={isEditing}
                    onRemove={() => removeSong(songId, 'main')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    onExpand={setExpandedSongId}
                    type="main"
                    index={index}
                    isStudying={checkIsStudying(songId)}
                    onToggleStudy={handleToggleStudy}
                    vocalists={editedEvent.team.vocal}
                    assignedVocal={editedEvent.songVocals?.[songId]}
                    onAssignVocal={(vocal) => handleAssignVocal(songId, vocal)}
                  />
                ))}
              </div>
            </SortableContext>
          </DroppableZone>
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

          <DroppableZone id="offering">
            <SortableContext items={editedEvent.offeringSongs || []} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50px]">
                {(editedEvent.offeringSongs || []).map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((s) => s.id === songId)}
                    isEditing={isEditing}
                    onRemove={() => removeSong(songId, 'offering')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    onExpand={setExpandedSongId}
                    type="offering"
                    index={index}
                    isStudying={checkIsStudying(songId)}
                    onToggleStudy={handleToggleStudy}
                    vocalists={editedEvent.team.vocal}
                    assignedVocal={editedEvent.songVocals?.[songId]}
                    onAssignVocal={(vocal) => handleAssignVocal(songId, vocal)}
                  />
                ))}
                {(!editedEvent.offeringSongs || editedEvent.offeringSongs.length === 0) && !isEditing && (
                  <div className="col-span-full p-8 border-2 border-dashed border-slate-200/50 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum louvor de oferta</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DroppableZone>
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

          <DroppableZone id="outro">
            <SortableContext items={editedEvent.outroSongs || []} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[50px]">
                {(editedEvent.outroSongs || []).map((songId, index) => (
                  <SortableSongItem
                    key={songId}
                    id={songId}
                    song={songs.find((s) => s.id === songId)}
                    isEditing={isEditing}
                    onRemove={() => removeSong(songId, 'outro')}
                    onEditSong={setEditingSongMetadata}
                    onSelectSong={onSelectSong}
                    onExpand={setExpandedSongId}
                    type="outro"
                    index={index}
                    isStudying={checkIsStudying(songId)}
                    onToggleStudy={handleToggleStudy}
                    vocalists={editedEvent.team.vocal}
                    assignedVocal={editedEvent.songVocals?.[songId]}
                    onAssignVocal={(vocal) => handleAssignVocal(songId, vocal)}
                  />
                ))}
                {(!editedEvent.outroSongs || editedEvent.outroSongs.length === 0) && !isEditing && (
                  <div className="col-span-full p-8 border-2 border-dashed border-slate-200/50 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum louvor final</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DroppableZone>
        </section>
        </DndContext>

        <section className="space-y-10 pt-4 border-t border-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
                <Users size={24} className="text-blue-600" />
                Escala e Confirmacoes
              </h3>
              <AttendanceAvatarStack confirmedMembers={confirmedMembers} />
            </div>
            <button
                onClick={() => setShowAttendanceModal(true)}
                className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm bg-blue-50/50 hover:bg-blue-50 px-6 py-3 rounded-2xl transition-all border border-blue-100/50"
              >
                <CheckCircle2 size={18} />
                Controle de Presenca
              </button>
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
                {editedEvent.team.vocal
                  .filter((name) => isEditing || isConfirmed(name))
                  .map((name) => (
                  <div key={name} className="flex items-center gap-3 pl-2 pr-4 py-2 bg-white rounded-2xl apple-shadow group">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase">
                      {name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-[#00153d]">{name}</span>
                    {isConfirmed(name) && <CheckCircle2 size={14} className="text-emerald-500" />}
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
                {!isEditing && editedEvent.team.vocal.filter(name => isConfirmed(name)).length === 0 && (
                  <p className="text-sm text-slate-400 italic py-2">Nenhum vocal confirmado ainda.</p>
                )}
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
                {Object.entries(editedEvent.team.instruments)
                  .filter(([instrument, name]) => isEditing || isConfirmed(name as string))
                  .map(([instrument, name]) => (
                  <div key={instrument} className="flex items-center justify-between p-4 bg-white rounded-2xl apple-shadow group">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{instrument}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#00153d]">{name as string}</p>
                        {isConfirmed(name as string) && <CheckCircle2 size={14} className="text-emerald-500" />}
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
                {!isEditing && Object.entries(editedEvent.team.instruments).filter(([_, name]) => isConfirmed(name as string)).length === 0 && (
                  <div className="col-span-full">
                    <p className="text-sm text-slate-400 italic py-2">Nenhum instrumentista confirmado ainda.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={`fixed bottom-0 ${isSidebarHidden ? 'left-0' : 'md:left-80 left-0'} right-0 p-6 z-[90] pointer-events-none transition-all duration-500`}>
        <div className="max-w-4xl mx-auto flex gap-4 pointer-events-auto">
          {!isEditing ? (
            <>
              {!hasUnsavedChanges && (
                <button
                  onClick={() => setShowMyAttendanceReview(true)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] font-bold shadow-2xl hover:opacity-90 transition-all active:scale-95 ${
                    editedEvent.attendance?.[userProfile?.name || ''] 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-[#00153d] text-white'
                  }`}
                >
                  <CheckCircle2 size={20} />
                  <span>{editedEvent.attendance?.[userProfile?.name || ''] ? 'Presença Confirmada' : 'Confirmar Presença'}</span>
                </button>
              )}
              
              {hasUnsavedChanges ? (
                <>
                  <button
                    onClick={() => setEditedEvent(cloneEditableEvent(event))}
                    disabled={isSaving}
                    className="flex-1 px-6 py-4 bg-white text-slate-500 rounded-[2rem] font-bold apple-shadow hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95 border border-black/5"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] font-bold shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? <LoaderCircle size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </>
              ) : (
                canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#00153d] rounded-[2rem] font-bold apple-shadow hover:bg-slate-50 transition-all active:scale-95 border border-black/5"
                  >
                    <Edit2 size={20} />
                    <span>Editar Detalhes</span>
                  </button>
                )
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditedEvent(cloneEditableEvent(event));
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="flex-1 px-6 py-4 bg-white text-slate-500 rounded-[2rem] font-bold apple-shadow hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95 border border-black/5"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] font-bold shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <LoaderCircle size={20} className="animate-spin" /> : <Save size={20} />}
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expandedSongId && (() => {
          const song = songs.find(s => s.id === expandedSongId);
          if (!song) return null;
          const leadVocal = editedEvent.songVocals?.[expandedSongId] || song.defaultLeadVocal || editedEvent.team.vocal[0] || 'A definir';

          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden apple-shadow relative"
              >
                <button 
                  onClick={() => setExpandedSongId(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
                >
                  <X size={20} />
                </button>

                <div className="p-10 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Detalhes do Louvor</p>
                    <h3 className="text-3xl font-headline font-extrabold text-[#00153d] leading-tight">{song.title}</h3>
                    <p className="text-slate-500 font-medium">{song.artist}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-blue-50 rounded-[2rem] space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tom Principal</p>
                      <p className="text-3xl font-headline font-black text-blue-700">{song.key}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vocal Principal</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Mic size={16} className="text-slate-400" />
                        <p className="text-lg font-bold text-[#00153d] truncate">{leadVocal}</p>
                      </div>
                    </div>
                    {song.technicalLevel && (
                      <div className="p-6 bg-amber-50 rounded-[2rem] space-y-1 col-span-2 md:col-span-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Nível Técnico</p>
                        <p className="text-3xl font-headline font-black text-amber-600">{song.technicalLevel}<span className="text-xs text-amber-400/60 font-bold ml-1">/10</span></p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {song.links.chords && (
                      <a
                        href={song.links.chords}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between p-6 bg-[#00153d] text-white rounded-[2rem] font-bold hover:opacity-90 transition-all group scale-active"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <Music size={20} />
                          </div>
                          <span>Acessar Cifra Club</span>
                        </div>
                        <ExternalLink size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {song.links.lyrics && (
                      <a
                        href={song.links.lyrics}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between p-6 bg-emerald-600 text-white rounded-[2rem] font-bold hover:opacity-90 transition-all group scale-active"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <span>Ver Letra Completa</span>
                        </div>
                        <ExternalLink size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-slate-50 flex justify-center">
                   <button
                    onClick={() => setExpandedSongId(null)}
                    className="px-12 py-4 bg-white text-[#00153d] rounded-2xl font-bold apple-shadow hover:bg-slate-100 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
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
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tom do Culto</label>
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
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-black/5">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-[#00153d]">Selecionar Música</h3>
                  <button 
                    onClick={() => {
                      setShowAddSongModal(null);
                      setSongSearchQuery('');
                    }} 
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Pesquisar por título ou artista..."
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => addSong(song.id, showAddSongModal)}
                    className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 rounded-2xl transition-all text-left group border border-transparent hover:border-blue-100"
                  >
                    <div>
                      <p className="font-bold text-[#00153d] group-hover:text-blue-600 transition-colors">{song.title}</p>
                      <p className="text-xs text-slate-500">{song.artist}</p>
                    </div>
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {song.key}
                    </div>
                  </button>
                ))}
                
                {filteredSongs.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Music size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma música encontrada</p>
                  </div>
                )}
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
        {showMyAttendanceReview && userProfile && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden apple-shadow flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1">Confirmação de Presença</p>
                  <h3 className="text-3xl font-headline font-extrabold text-[#00153d]">Revise sua escala</h3>
                </div>
                <button 
                  onClick={() => setShowMyAttendanceReview(false)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Event Summary Card */}
              <div className="px-8 pb-6">
                <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                      <CalendarIcon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#00153d]">{editedEvent.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{formatDate(editedEvent.date)} às {editedEvent.time}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-200 w-full" />
                  
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Local</span>
                    <span className="text-[#00153d]">{editedEvent.location || 'Manancial'}</span>
                  </div>
                </div>
              </div>

              {/* Songs Section */}
              <div className="flex-1 overflow-y-auto px-8 space-y-6 pb-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#00153d]/40 flex items-center gap-2">
                    <Music size={14} />
                    Repertório do Dia
                  </h4>
                  <div className="space-y-2">
                    {editedEvent.songs.map((songId, idx) => {
                      const song = songs.find(s => s.id === songId);
                      if (!song) return null;
                      return (
                        <div key={songId} className="flex items-center gap-4 p-4 bg-white border border-black/5 rounded-2xl">
                          <div className="text-[10px] font-black text-slate-300 w-4">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#00153d] leading-none">{song.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{song.artist}</p>
                          </div>
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {song.key}
                          </div>
                        </div>
                      );
                    })}
                    {editedEvent.songs.length === 0 && (
                      <p className="text-sm text-slate-400 italic py-4">Nenhuma música selecionada</p>
                    )}
                  </div>
                </div>

                {/* Team Info */}
                <div className="p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {userProfile.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Sua Função</p>
                      <p className="text-sm font-bold text-[#00153d]">
                        {team.find(m => m.name === userProfile.name)?.role || 'Membro da Equipe'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-8 bg-slate-50 border-t border-black/5">
                <button
                  onClick={async () => {
                    if (isSaving) return;
                    
                    try {
                      setIsSaving(true);
                      
                      // Encontrar a melhor chave para o nome do usuário na presença
                      // 1. Tentar encontrar o nome exato do usuário na lista da escala
                      const nameInTeam = scaledMembers.find(m => m.trim().toLowerCase() === userProfile.name.trim().toLowerCase());
                      const targetName = nameInTeam || userProfile.name;
                      
                      // 2. Verificar se já está confirmado (usando busca robusta)
                      const isCurrentlyConfirmed = isConfirmed(targetName);
                      
                      // 3. Preparar o novo objeto de presença
                      const updatedAttendance = { ...(editedEvent.attendance || {}) };
                      
                      // Limpar possíveis chaves duplicadas (ex: se o usuário estiver com nome diferente)
                      Object.keys(updatedAttendance).forEach(key => {
                        if (key.trim().toLowerCase() === targetName.trim().toLowerCase()) {
                          updatedAttendance[key] = !isCurrentlyConfirmed;
                        }
                      });
                      
                      // Garantir que a chave alvo está definida
                      updatedAttendance[targetName] = !isCurrentlyConfirmed;
                      
                      // Atualizar estado local imediatamente para feedback instantâneo
                      setEditedEvent(prev => ({ ...prev, attendance: updatedAttendance }));
                      
                      // Salvar no banco
                      await onUpdate({ ...editedEvent, attendance: updatedAttendance });
                      
                      if (isCurrentlyConfirmed) {
                         toast.success('Presença desmarcada.');
                      } else {
                         toast.success('Presença confirmada com sucesso!');
                      }
                      setShowMyAttendanceReview(false);
                    } catch (error: any) {
                      console.error(error);
                      toast.error('Erro ao atualizar presença: ' + (error.message || 'Verifique sua conexão.'));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className={`w-full py-5 rounded-[2rem] font-bold shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                    isConfirmed(userProfile.name)
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-[#00153d] text-white hover:opacity-90'
                  }`}
                >
                  {isSaving ? (
                    <LoaderCircle size={24} className="animate-spin" />
                  ) : isConfirmed(userProfile.name) ? (
                    <>
                      <X size={24} />
                      <span>Desmarcar Minha Presença</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      <span>Confirmar Minha Presença Agora</span>
                    </>
                  )}
                </button>
                {!isConfirmed(userProfile.name) && (
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Ao confirmar, você se compromete com este evento
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

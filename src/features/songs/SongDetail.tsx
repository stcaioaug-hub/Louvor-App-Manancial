import React from 'react';
import {
  ChevronLeft,
  Music,
  User,
  Hash,
  Activity,
  ExternalLink,
  FileText,
  PlayCircle,
  Calendar,
  Star,
  Zap,
  TrendingUp,
  Mic2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BackButton } from '../../components/BackButton';
import { Song, WorshipEvent } from '../../types';
import { formatFullDate, parseLocalDate } from '../../lib/dateUtils';

interface SongDetailProps {
  song: Song;
  events: WorshipEvent[];
  onBack: () => void;
  onUpdateSong: (song: Song) => Promise<void>;
  canEdit?: boolean;
}

export default function SongDetail({ song, events, onBack, onUpdateSong, canEdit = true }: SongDetailProps) {
  const songHistory = events
    .filter((event) => event.songs.includes(song.id) || (event.outroSongs || []).includes(song.id))
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

  const updateProficiency = async (level: number) => {
    await onUpdateSong({ ...song, proficiency: level });
  };

  const updateDifficulty = async (level: number) => {
    await onUpdateSong({ ...song, difficulty: level });
  };

  const formatDate = (dateStr: string) => formatFullDate(dateStr);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />

        <div className="flex gap-2">
          {song.links.chords && (
            <a
              href={song.links.chords}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-blue-600 rounded-xl apple-shadow hover:scale-110 transition-transform"
              title="Cifra"
            >
              <ExternalLink size={20} />
            </a>
          )}
          {song.links.lyrics && (
            <a
              href={song.links.lyrics}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white text-emerald-600 rounded-xl apple-shadow hover:scale-110 transition-transform"
              title="Letra"
            >
              <FileText size={20} />
            </a>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] overflow-hidden apple-shadow">
        <div className="p-8 md:p-12 space-y-10">
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Music size={20} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Detalhes do Louvor</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight">
                {song.title}
              </h2>
              <p className="text-xl text-slate-500 font-medium flex items-center gap-2">
                <User size={20} className="text-slate-400" />
                {song.artist}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {song.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-black/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 space-y-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 apple-shadow">
                <Hash size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Tom</p>
                <p className="text-xl font-black text-[#00153d]">{song.key}</p>
              </div>
            </div>

            <div className="p-6 bg-purple-50/50 rounded-[2rem] border border-purple-100/50 space-y-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-purple-600 apple-shadow">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">BPM</p>
                <p className="text-xl font-black text-[#00153d]">{song.bpm || '--'}</p>
              </div>
            </div>

            <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50 space-y-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 apple-shadow">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Proficiencia</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => canEdit && void updateProficiency(level)}
                      disabled={!canEdit}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        level <= song.proficiency ? 'bg-emerald-600' : 'bg-emerald-200'
                      } ${canEdit ? 'hover:scale-y-150' : 'cursor-default opacity-80'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100/50 space-y-3">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-orange-600 apple-shadow">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Dificuldade</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => canEdit && void updateDifficulty(level)}
                      disabled={!canEdit}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        level <= song.difficulty ? 'bg-orange-600' : 'bg-orange-200'
                      } ${canEdit ? 'hover:scale-y-150' : 'cursor-default opacity-80'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {song.links.chords && (
              <a
                href={song.links.chords}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-6 bg-blue-600 text-white rounded-[2rem] apple-shadow hover:scale-[1.02] transition-all group"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Referência</p>
                  <p className="text-lg font-bold">Cifra Club</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Music size={24} />
                </div>
              </a>
            )}
            {song.links.lyrics && (
              <a
                href={song.links.lyrics}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-6 bg-emerald-600 text-white rounded-[2rem] apple-shadow hover:scale-[1.02] transition-all group"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Referência</p>
                  <p className="text-lg font-bold">Letras.mus</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <FileText size={24} />
                </div>
              </a>
            )}
            {song.links.video && (
              <a
                href={song.links.video}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-6 bg-red-600 text-white rounded-[2rem] apple-shadow hover:scale-[1.02] transition-all group"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Referência</p>
                  <p className="text-lg font-bold">YouTube</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <PlayCircle size={24} />
                </div>
              </a>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-[#00153d] flex items-center gap-2">
                <Calendar size={24} className="text-blue-600" />
                Histórico de Execução
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <PlayCircle size={14} />
                  <span>{song.timesPlayed || 0} Cultos</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                  <Mic2 size={14} />
                  <span>{song.timesRehearsed || 0} Ensaios</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {songHistory.map((event, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={event.id}
                  className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] group hover:bg-white hover:apple-shadow transition-all border border-transparent hover:border-black/5"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center apple-shadow text-[#00153d] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-[10px] font-black uppercase">{parseLocalDate(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    <span className="text-lg font-black leading-none">{parseLocalDate(event.date).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#00153d]">{event.title}</h4>
                    <p className="text-sm text-slate-500 font-medium capitalize">{formatDate(event.date)}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    event.type === 'service' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {event.type === 'service' ? 'Culto' : 'Ensaio'}
                  </div>
                </motion.div>
              ))}

              {songHistory.length === 0 && (
                <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <Calendar size={48} strokeWidth={1} />
                  <p className="text-sm font-bold uppercase tracking-widest">Ainda não foi tocada em eventos</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

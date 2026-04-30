import React from 'react';
import { motion } from 'motion/react';
import { Star, Mic2, Guitar, Drum, Piano, Music, BookOpen, ChevronLeft } from 'lucide-react';
import { TeamMember, Song, UserSongStudy } from '../../types';
import { BackButton } from '../../components/BackButton';

import { useParams, useNavigate } from 'react-router-dom';

interface TeamMemberProfileProps {
  team: TeamMember[];
  songs: Song[];
  userSongStudy: UserSongStudy[];
}

export function TeamMemberProfile({ team, songs, userSongStudy }: TeamMemberProfileProps) {
  const { id: memberId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/app/team');

  const member = team.find(t => t.id === memberId);

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[#00153d] font-bold text-xl">Integrante não encontrado.</p>
        <button onClick={onBack} className="text-blue-600 font-bold hover:underline">Voltar</button>
      </div>
    );
  }

  // Find songs they usually lead (if defaultLeadVocal matches their ID or name)
  const ledSongs = songs.filter(s => s.defaultLeadVocal === member.id || s.defaultLeadVocal === member.name);
  
  // Find songs they are studying
  const studyingSongs = userSongStudy
    .filter(study => study.user_id === member.user_id && !study.is_completed)
    .map(study => songs.find(s => s.id === study.song_id))
    .filter((s): s is Song => !!s);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Vocais': return <Mic2 size={24} />;
      case 'Bateria': return <Drum size={24} />;
      case 'Teclado': return <Piano size={24} />;
      case 'Violão':
      case 'Guitarra':
      case 'Baixo':
      default:
        return <Guitar size={24} />;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'Vocais': return 'from-pink-600 to-rose-400';
      case 'Violão': return 'from-amber-500 to-orange-400';
      case 'Guitarra': return 'from-blue-600 to-indigo-400';
      case 'Baixo': return 'from-slate-700 to-slate-500';
      case 'Bateria': return 'from-emerald-600 to-teal-400';
      case 'Teclado': return 'from-purple-600 to-violet-400';
      default: return 'from-blue-600 to-cyan-400';
    }
  };

  const gradient = getCategoryGradient(member.category);

  return (
    <div className="space-y-12">
      <header className="flex items-center gap-4">
        <BackButton onClick={onBack} />
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-[#00153d] tracking-tight">Perfil</h2>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-4"
        >
          <div className="glass p-8 rounded-[3.5rem] border border-white/50 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
            <div className={`absolute top-0 w-full h-32 bg-gradient-to-br ${gradient} opacity-20`}></div>
            
            <div className="relative mt-8 mb-6">
              <div className={`w-32 h-32 rounded-3xl bg-[#00153d] flex items-center justify-center text-white text-5xl font-black uppercase shadow-2xl border-4 border-white overflow-hidden`}>
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              {member.isLeader && (
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-[#00153d] shadow-lg border-4 border-white" title="Líder / Ministro">
                  <Star size={20} fill="currentColor" />
                </div>
              )}
            </div>

            <h3 className="text-3xl font-headline font-extrabold text-[#00153d]">{member.name}</h3>
            <div className="flex items-center gap-2 mt-2 text-slate-500">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-sm`}>
                {getCategoryIcon(member.category)}
              </span>
              <p className="font-bold uppercase tracking-wider text-xs">{member.role} • {member.category}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-8 space-y-8"
        >
          {/* Músicas em Estudo */}
          {member.user_id && studyingSongs.length > 0 && (
            <div className="glass p-8 rounded-[3rem] border border-white/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <h4 className="text-xl font-headline font-extrabold text-[#00153d]">Estudando no momento</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studyingSongs.map(song => (
                  <div key={song.id} className="bg-white/40 p-4 rounded-2xl border border-white/60 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <Music size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-[#00153d] text-sm line-clamp-1">{song.title}</p>
                      <p className="text-xs text-slate-500">{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Músicas que lidera */}
          {ledSongs.length > 0 && (
            <div className="glass p-8 rounded-[3rem] border border-white/50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mic2 size={24} />
                </div>
                <h4 className="text-xl font-headline font-extrabold text-[#00153d]">Músicas Preferidas (Lead)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ledSongs.map(song => (
                  <div key={song.id} className="bg-white/40 p-4 rounded-2xl border border-white/60 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Star size={18} fill="currentColor" />
                      </div>
                      <div>
                        <p className="font-bold text-[#00153d] text-sm line-clamp-1">{song.title}</p>
                        <p className="text-xs text-slate-500">{song.artist}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studyingSongs.length === 0 && ledSongs.length === 0 && (
            <div className="glass p-12 rounded-[3rem] border border-white/50 shadow-lg text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-100 text-slate-300 flex items-center justify-center mb-4">
                <Music size={32} />
              </div>
              <p className="font-bold text-[#00153d] text-lg">Nenhuma informação de repertório</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Este integrante ainda não tem músicas marcadas como lead vocal ou em estudo.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

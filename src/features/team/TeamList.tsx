import React, { useState } from 'react';
import { Star, Mic2, Guitar, Drum, Piano, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamMember } from '../../types';
import { BackButton } from '../../components/BackButton';

interface TeamListProps {
  team: TeamMember[];
  onCreateMember: (member: Omit<TeamMember, 'id'>) => Promise<void>;
  onUpdateMember: (member: TeamMember) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  canEdit?: boolean;
  onBack?: () => void;
}

export default function TeamList({ team, onCreateMember, onUpdateMember, onDeleteMember, canEdit = true, onBack }: TeamListProps) {
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { name: 'Vocais', icon: Mic2, gradient: 'from-pink-600 to-rose-400', shadow: 'shadow-pink-500/10' },
    { name: 'Violão', icon: Guitar, gradient: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/10' },
    { name: 'Guitarra', icon: Guitar, gradient: 'from-blue-600 to-indigo-400', shadow: 'shadow-blue-500/10' },
    { name: 'Baixo', icon: Guitar, gradient: 'from-slate-700 to-slate-500', shadow: 'shadow-slate-500/10' },
    { name: 'Bateria', icon: Drum, gradient: 'from-emerald-600 to-teal-400', shadow: 'shadow-emerald-500/10' },
    { name: 'Teclado', icon: Piano, gradient: 'from-purple-600 to-violet-400', shadow: 'shadow-purple-500/10' },
  ];

  const handleSave = async (member: TeamMember) => {
    try {
      setIsSubmitting(true);

      if (isAdding) {
        const { id: _id, ...memberPayload } = member;
        await onCreateMember(memberPayload);
        setIsAdding(false);
      } else {
        await onUpdateMember(member);
      }

      setEditingMember(null);
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsSubmitting(true);
      await onDeleteMember(id);
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          {onBack && <BackButton onClick={onBack} />}
          <div>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-[#00153d] tracking-tight mb-2">
              Equipe de Louvor
            </h2>
            <p className="text-slate-500 font-medium text-lg">Gerencie os ministros e músicos do seu ministério.</p>
          </div>
        </motion.div>
        {canEdit && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingMember({ id: '', name: '', role: '', category: 'Vocais', isLeader: false });
              setIsAdding(true);
            }}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#00153d] to-blue-800 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/20 transition-all w-full md:w-auto"
          >
            <Plus size={20} />
            <span>Adicionar Integrante</span>
          </motion.button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {categories.map((category, categoryIndex) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1, duration: 0.6 }}
            key={category.name}
            className="relative overflow-hidden glass p-8 rounded-[3.5rem] border border-white/50 shadow-xl group hover:shadow-blue-500/10 transition-all duration-500"
          >
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000`}></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <category.icon size={28} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-extrabold text-[#00153d]">{category.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {team.filter((member) => member.category === category.name).length} Integrantes
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {team
                .filter((member) => member.category === category.name)
                .map((member) => (
                  <motion.div
                    layout
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-2xl group/member hover:bg-white hover:border-blue-500/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-[#00153d] flex items-center justify-center text-white font-black text-sm uppercase shadow-md group-hover/member:rotate-3 transition-transform">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        {member.isLeader && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center text-[#00153d] shadow-lg border-2 border-white">
                            <Star size={12} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#00153d] group-hover/member:text-blue-700 transition-colors">{member.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{member.role}</p>
                      </div>
                    </div>
                    
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-all transform translate-x-2 group-hover/member:translate-x-0">
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setIsAdding(false);
                          }}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => void handleDelete(member.id)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}

              {team.filter((member) => member.category === category.name).length === 0 && (
                <div className="p-10 border-2 border-dashed border-slate-200/50 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 group-hover:border-blue-200 transition-colors">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum Integrante</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden apple-shadow"
            >
              <div className="p-8 border-b border-black/5 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#00153d]">
                  {isAdding ? 'Adicionar Integrante' : 'Editar Integrante'}
                </h3>
                <button onClick={() => setEditingMember(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    value={editingMember.name}
                    onChange={(event) => setEditingMember({ ...editingMember, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Funcao / Instrumento</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    value={editingMember.role}
                    onChange={(event) => setEditingMember({ ...editingMember, role: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 font-medium appearance-none"
                    value={editingMember.category}
                    onChange={(event) => setEditingMember({ ...editingMember, category: event.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avatar URL</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    value={editingMember.avatar ?? ''}
                    onChange={(event) => setEditingMember({ ...editingMember, avatar: event.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="isLeader"
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={editingMember.isLeader ?? false}
                    onChange={(event) => setEditingMember({ ...editingMember, isLeader: event.target.checked })}
                  />
                  <label htmlFor="isLeader" className="text-sm font-bold text-[#00153d]">Lider / Ministro</label>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button
                  onClick={() => setEditingMember(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-bold apple-shadow hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSave(editingMember)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : isAdding ? 'Adicionar' : 'Salvar Alteracoes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

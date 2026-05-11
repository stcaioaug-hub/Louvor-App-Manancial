import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileText, Link as LinkIcon, UserCircle, Star, MessageSquare, Download, Calendar, Filter, Copy, Trash2 } from 'lucide-react';
import { BackButton } from '../../components/BackButton';
import type { TeamEvaluation, TeamMember } from '../../types';
import { linkTeamEvaluationToMember, deleteTeamEvaluation } from '../../lib/appData';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  evaluations: TeamEvaluation[];
  team: TeamMember[];
  onBack: () => void;
  canEdit: boolean;
}

export default function EvaluationsDashboard({ evaluations, team, onBack, canEdit }: Props) {
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [isLinking, setIsLinking] = useState<string | null>(null);

  const getDiagnostic = (score: number) => {
    if (score <= 15) return { label: 'CRÍTICA', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', desc: 'Necessita alinhamento urgente espiritual e organizacional.' };
    if (score <= 30) return { label: 'DESENVOLVIMENTO', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', desc: 'Existe potencial, mas ainda há áreas frágeis.' };
    if (score <= 40) return { label: 'CRESCIMENTO', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', desc: 'Boa estrutura, porém precisa amadurecer alguns pontos.' };
    return { label: 'SAUDÁVEL', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', desc: 'Existe união, compromisso e equilíbrio ministerial.' };
  };

  const avgScore = useMemo(() => {
    if (evaluations.length === 0) return 0;
    const total = evaluations.reduce((acc, curr) => acc + curr.total_score, 0);
    return Math.round(total / evaluations.length);
  }, [evaluations]);

  const teamDiagnostic = getDiagnostic(avgScore);

  const filteredEvaluations = evaluations.filter(ev => {
    if (filterLinked === 'linked') return ev.team_member_id != null;
    if (filterLinked === 'unlinked') return ev.team_member_id == null;
    return true;
  });

  const handleLinkMember = async (evalId: string, memberId: string) => {
    try {
      await linkTeamEvaluationToMember(evalId, memberId);
      toast.success('Avaliação vinculada ao membro com sucesso!');
      setIsLinking(null);
      // Wait for app data to refresh or state will update via props eventually,
      // but usually the caller handles state reload. 
      // The local data is updated in appData, so next cycle it might show up.
    } catch (error) {
      toast.error('Erro ao vincular membro.');
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Avaliação da Equipe', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text('Resumo Geral', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Total de Respostas', 'Média Geral (0-50)', 'Diagnóstico']],
      body: [
        [evaluations.length.toString(), avgScore.toString(), teamDiagnostic.label]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 21, 61] },
    });

    // Calculate averages per topic
    const getAvg = (key: keyof TeamEvaluation) => {
      if (evaluations.length === 0) return 0;
      const sum = evaluations.reduce((acc, ev) => acc + (ev[key] as number || 0), 0);
      return (sum / evaluations.length).toFixed(1);
    };

    doc.text('Médias por Tópico (0-5)', 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Critério', 'Média']],
      body: [
        ['União e Companheirismo', getAvg('q1_uniao')],
        ['Comprometimento (Ensaios)', getAvg('q2_comprometimento')],
        ['Vida Espiritual', getAvg('q3_espiritual')],
        ['Organização', getAvg('q4_organizacao')],
        ['Comunicação', getAvg('q5_comunicacao')],
        ['Humildade/Recepção a Críticas', getAvg('q6_humildade')],
        ['Excelência Musical', getAvg('q7_excelencia')],
        ['Pontualidade', getAvg('q8_pontualidade')],
        ['Participação na Igreja', getAvg('q9_participacao')],
        ['Ambiente dos Ensaios', getAvg('q10_ambiente')],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 21, 61] },
    });

    // Open Feedbacks
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(20);
    doc.text('Feedbacks Abertos (O que melhorar imediatamente)', 14, 20);

    const feedbackBody = evaluations
      .filter(ev => ev.open_feedback && ev.open_feedback.trim().length > 0)
      .map(ev => [ev.member_name || 'Anônimo', ev.open_feedback]);

    if (feedbackBody.length > 0) {
      autoTable(doc, {
        startY: 25,
        head: [['Membro', 'Feedback']],
        body: feedbackBody,
        theme: 'plain',
        styles: { cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
      });
    }

    doc.save('Avaliacao_Ministerio.pdf');
    toast.success('PDF gerado com sucesso!');
  };

  const handleCopyLink = () => {
    const link = window.location.origin + '/avaliacao';
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return;
    
    try {
      await deleteTeamEvaluation(id);
      toast.success('Avaliação excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir avaliação.');
    }
  };

  if (!canEdit) {
    return (
      <div className="p-8 text-center text-slate-500">
        Você não tem permissão para ver esta página.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8fc] pb-24 print:bg-white print:pb-0">
      {/* Header */}
      <div className="bg-[#00153d] text-white pt-12 pb-24 px-6 md:px-12 rounded-b-[3rem] relative z-10 print:bg-white print:text-black print:p-0 print:rounded-none">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <BackButton onClick={onBack} label="Voltar" variant="white" />
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="glass px-4 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-white/10 transition-colors shadow-sm"
                title="Copiar link do formulário de avaliação"
              >
                <Copy size={18} />
                <span className="hidden sm:inline">Copiar Link</span>
              </button>
              <button
                onClick={handlePrint}
                className="glass px-4 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-white/10 transition-colors shadow-sm"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText size={28} className="text-blue-400 print:text-blue-600" />
                <h1 className="text-3xl font-extrabold tracking-tight">Resultados da Avaliação</h1>
              </div>
              <p className="text-blue-200 text-lg print:text-slate-600">
                Análise do Ministério de Louvor
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 print:border-slate-200 print:bg-slate-50">
              <div className="text-center px-4 border-r border-white/20 print:border-slate-300">
                <p className="text-xs uppercase tracking-wider text-blue-200 mb-1 print:text-slate-500">Respostas</p>
                <p className="text-3xl font-bold">{evaluations.length}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs uppercase tracking-wider text-blue-200 mb-1 print:text-slate-500">Média (0-50)</p>
                <p className="text-3xl font-bold">{avgScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-10 relative z-20 print:mt-8 print:px-0">
        
        {/* Diagnostic Card */}
        {evaluations.length > 0 && (
          <div className={`mb-8 bg-white p-6 rounded-3xl shadow-xl border-l-8 ${teamDiagnostic.color} flex flex-col md:flex-row items-center gap-6 print:shadow-none print:border-2`}>
            <div className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center bg-white shadow-inner border-4 border-slate-50`}>
               <Star size={36} className={`fill-current ${teamDiagnostic.color.split(' ')[1]}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Diagnóstico Geral da Equipe</p>
              <h2 className={`text-2xl font-black mb-2 flex items-center gap-2 ${teamDiagnostic.color.split(' ')[1]}`}>
                <div className={`w-3 h-3 rounded-full ${teamDiagnostic.dot}`} />
                {teamDiagnostic.label}
              </h2>
              <p className="text-slate-600 text-lg">{teamDiagnostic.desc}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-xl font-bold text-[#00153d]">Respostas Individuais</h2>
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button 
              onClick={() => setFilterLinked('all')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterLinked === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilterLinked('unlinked')}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterLinked === 'unlinked' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Não Vinculadas
            </button>
          </div>
        </div>

        {filteredEvaluations.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm print:hidden">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Filter size={24} />
            </div>
            <p className="text-slate-500 font-medium">Nenhuma avaliação encontrada com estes filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:gap-8">
            {filteredEvaluations.map(ev => {
              const diag = getDiagnostic(ev.total_score);
              const linkedMember = team.find(m => m.id === ev.team_member_id);

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={ev.id} 
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow print:shadow-none print:break-inside-avoid"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      {linkedMember?.avatar ? (
                        <img src={linkedMember.avatar} alt={ev.member_name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <UserCircle size={24} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 leading-tight">{ev.member_name}</h3>
                        <p className="text-sm font-medium text-slate-500">{ev.member_role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${diag.color} flex items-center gap-2`}>
                         <span className="text-sm">{ev.total_score}/50</span>
                         <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                         {diag.label}
                      </div>
                      <button 
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors print:hidden"
                        title="Excluir Avaliação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {!ev.team_member_id && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl print:hidden">
                      {isLinking === ev.id ? (
                        <div>
                          <p className="text-sm text-blue-800 font-medium mb-2">Selecione o membro para vincular:</p>
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 rounded-xl border border-blue-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => handleLinkMember(ev.id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>Escolha um membro...</option>
                              {team.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                              ))}
                            </select>
                            <button onClick={() => setIsLinking(null)} className="px-3 py-2 text-sm font-medium text-slate-500 hover:bg-white rounded-xl">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-800">Esta avaliação não está vinculada a um perfil.</p>
                          <button 
                            onClick={() => setIsLinking(ev.id)}
                            className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all"
                          >
                            <LinkIcon size={14} /> Vincular
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mb-6">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">União</span>
                      <span className="font-bold text-slate-800">{ev.q1_uniao}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Ensaios</span>
                      <span className="font-bold text-slate-800">{ev.q2_comprometimento}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Espiritual</span>
                      <span className="font-bold text-slate-800">{ev.q3_espiritual}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Organização</span>
                      <span className="font-bold text-slate-800">{ev.q4_organizacao}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Comunicação</span>
                      <span className="font-bold text-slate-800">{ev.q5_comunicacao}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Humildade</span>
                      <span className="font-bold text-slate-800">{ev.q6_humildade}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Excelência</span>
                      <span className="font-bold text-slate-800">{ev.q7_excelencia}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Pontualidade</span>
                      <span className="font-bold text-slate-800">{ev.q8_pontualidade}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Igreja</span>
                      <span className="font-bold text-slate-800">{ev.q9_participacao}/5</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Ambiente</span>
                      <span className="font-bold text-slate-800">{ev.q10_ambiente}/5</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                      <MessageSquare size={16} />
                      O que melhorar imediatamente:
                    </div>
                    <p className="text-slate-600 italic text-sm leading-relaxed">
                      "{ev.open_feedback}"
                    </p>
                  </div>
                  
                  {ev.created_at && (
                     <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar size={14} />
                        Enviado em {new Date(ev.created_at).toLocaleDateString('pt-BR')}
                     </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

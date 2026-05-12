import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Link as LinkIcon, UserCircle, Star, MessageSquare, Download, 
  Calendar, Filter, Copy, Trash2, BarChart3, Layers, Search, ChevronRight,
  Eye, EyeOff, Sparkles, HelpCircle, CheckCircle2, AlertTriangle, TrendingUp,
  Clock, Check, Users
} from 'lucide-react';
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
  // Estado local sincronizado com as props para permitir atualizações instantâneas na interface
  const [localEvaluations, setLocalEvaluations] = useState<TeamEvaluation[]>(evaluations);

  useEffect(() => {
    setLocalEvaluations(evaluations);
  }, [evaluations]);

  const [activeTab, setActiveTab] = useState<'overview' | 'criteria' | 'comments' | 'responses'>('overview');
  const [selectedCriterion, setSelectedCriterion] = useState<string>('q1_uniao');
  const [criterionScoreFilter, setCriterionScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [selectedMemberToLink, setSelectedMemberToLink] = useState<string>('');

  const getDiagnostic = (score: number) => {
    if (score <= 15) return { label: 'CRÍTICA', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', desc: 'Necessita alinhamento urgente espiritual e organizacional.' };
    if (score <= 30) return { label: 'DESENVOLVIMENTO', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', desc: 'Existe potencial, mas ainda há áreas frágeis.' };
    if (score <= 40) return { label: 'CRESCIMENTO', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', desc: 'Boa estrutura, porém precisa amadurecer alguns pontos.' };
    return { label: 'SAUDÁVEL', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', desc: 'Existe união, compromisso e equilíbrio ministerial.' };
  };

  const avgScore = useMemo(() => {
    if (localEvaluations.length === 0) return 0;
    const total = localEvaluations.reduce((acc, curr) => acc + curr.total_score, 0);
    return Math.round(total / localEvaluations.length);
  }, [localEvaluations]);

  const teamDiagnostic = getDiagnostic(avgScore);

  const criteriaList = useMemo(() => [
    { key: 'q1_uniao', label: 'União e Companheirismo', desc: 'Relacionamento interpessoal, amor fraternal e suporte mútuo entre a equipe.' },
    { key: 'q2_comprometimento', label: 'Comprometimento (Ensaios)', desc: 'Dedicação aos horários, estudo prévio do repertório e presença nos ensaios.' },
    { key: 'q3_espiritual', label: 'Vida Espiritual', desc: 'Busca por Deus, oração, adoração genuína e testemunho cristão.' },
    { key: 'q4_organizacao', label: 'Organização', desc: 'Clareza nas escalas, antecedência no envio de músicas e processos do ministério.' },
    { key: 'q5_comunicacao', label: 'Comunicação', desc: 'Transparência, facilidade de diálogo com líderes e clareza nos avisos.' },
    { key: 'q6_humildade', label: 'Humildade / Recepção a Críticas', desc: 'Disposição para aprender, aceitar correções musicais e submissão à liderança.' },
    { key: 'q7_excelencia', label: 'Excelência Musical', desc: 'Qualidade técnica, afinação, execução instrumental e busca por aprimoramento.' },
    { key: 'q8_pontualidade', label: 'Pontualidade', desc: 'Chegada nos horários marcados para passagem de som, ensaios e cultos.' },
    { key: 'q9_participacao', label: 'Participação na Igreja', desc: 'Envolvimento com a comunidade local além da plataforma de louvor.' },
    { key: 'q10_ambiente', label: 'Ambiente dos Ensaios', desc: 'Clima leve, respeitoso, produtivo e focado durante os momentos de ensaio.' },
  ], []);

  // Calcula médias por critério usando localEvaluations
  const criteriaAverages = useMemo(() => {
    return criteriaList.map(c => {
      const sum = localEvaluations.reduce((acc, ev) => acc + (ev[c.key as keyof TeamEvaluation] as number || 0), 0);
      const avg = localEvaluations.length > 0 ? sum / localEvaluations.length : 0;
      return { ...c, avg };
    });
  }, [localEvaluations, criteriaList]);

  // Ordenar por média decrescente para exibir o Ranking
  const sortedCriteria = useMemo(() => {
    return [...criteriaAverages].sort((a, b) => b.avg - a.avg);
  }, [criteriaAverages]);

  const getCriterionBadge = (avg: number) => {
    if (avg >= 4.5) return { text: 'Excelente', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' };
    if (avg >= 3.8) return { text: 'Bom', bg: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' };
    if (avg >= 3.0) return { text: 'Regular', bg: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' };
    return { text: 'Atenção', bg: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500' };
  };

  const handleLinkMember = async (evalId: string, memberId: string) => {
    try {
      // Atualiza de forma otimista localmente para feedback visual imediato
      setLocalEvaluations(prev => prev.map(ev => 
        ev.id === evalId ? { ...ev, team_member_id: memberId } : ev
      ));
      
      await linkTeamEvaluationToMember(evalId, memberId);
      toast.success('Avaliação vinculada ao membro com sucesso!');
      setIsLinking(null);
      setSelectedMemberToLink('');
    } catch (error) {
      toast.error('Erro ao vincular membro.');
      // Reverte se houver erro
      setLocalEvaluations(evaluations);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return;
    
    try {
      // Atualiza de forma otimista
      setLocalEvaluations(prev => prev.filter(ev => ev.id !== id));
      
      await deleteTeamEvaluation(id);
      toast.success('Avaliação excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir avaliação.');
      setLocalEvaluations(evaluations);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.origin + '/avaliacao';
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handlePrint = () => {
    if (localEvaluations.length === 0) {
      toast.error('Não há avaliações para exportar.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    
    // --- PÁGINA 1: DIAGNÓSTICO E RANKING DE CRITÉRIOS ---
    doc.setFillColor(0, 21, 61); // #00153d
    doc.rect(0, 0, pageWidth, 36, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('DIAGNÓSTICO MINISTERIAL DE LOUVOR', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 220, 255);
    doc.text('Relatório Consolidado de Avaliação da Equipe', 14, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 44);
    doc.text(`Total de Respostas: ${localEvaluations.length}`, pageWidth - 14, 44, { align: 'right' });
    
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 48, pageWidth - 14, 48);

    doc.setTextColor(0, 21, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumo Geral da Equipe', 14, 58);

    autoTable(doc, {
      startY: 62,
      head: [['Pontuação Média', 'Diagnóstico Geral', 'Status de Saúde']],
      body: [
        [`${avgScore} / 50`, teamDiagnostic.label, teamDiagnostic.desc]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 21, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', cellWidth: 38 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 45 },
        2: { cellWidth: 'auto' }
      }
    });

    const getCriterionStatus = (avg: number) => {
      if (avg >= 4.5) return 'Excelente';
      if (avg >= 3.8) return 'Bom';
      if (avg >= 3.0) return 'Regular';
      return 'Atenção';
    };

    let nextY = (doc as any).lastAutoTable.finalY + 12;

    doc.setTextColor(0, 21, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Ranking de Critérios Avaliados (0 a 5)', 14, nextY);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Posição', 'Critério de Avaliação', 'Média', 'Classificação']],
      body: sortedCriteria.map((c, idx) => [
        `${idx + 1}º`,
        c.label,
        c.avg.toFixed(1),
        getCriterionStatus(c.avg)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [240, 244, 252], textColor: [0, 21, 61], fontStyle: 'bold' },
      styles: { fontSize: 9.5, cellPadding: 4.5 },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 35 }
      }
    });

    nextY = (doc as any).lastAutoTable.finalY + 12;

    const topCriteria = sortedCriteria.slice(0, 2);
    const bottomCriteria = sortedCriteria.slice(-2);

    doc.setTextColor(0, 21, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Insights Estratégicos', 14, nextY);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Categoria', 'Análise e Recomendação Pastoral']],
      body: [
        [
          'Pontos Fortes',
          `As maiores pontuações concentram-se em "${topCriteria[0]?.label || ''}" e "${topCriteria[1]?.label || ''}". Estes são os pilares atuais que sustentam a motivação da equipe.`
        ],
        [
          'Foco de Atenção',
          `As menores médias registradas foram em "${bottomCriteria[bottomCriteria.length - 1]?.label || ''}" e "${bottomCriteria[bottomCriteria.length - 2]?.label || ''}". Recomenda-se criar ações focadas e conversas de alinhamento com a equipe nestes pontos específicos.`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 21, 61], textColor: [255, 255, 255] },
      styles: { fontSize: 9.5, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38, fillColor: [248, 250, 252], textColor: [0, 21, 61] },
        1: { cellWidth: 'auto', textColor: [60, 60, 60] }
      }
    });

    // --- PÁGINA 2: FEEDBACKS ANÔNIMOS E RECOMENDAÇÕES PRÁTICAS ---
    doc.addPage();
    
    doc.setFillColor(0, 21, 61);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Comentários e Feedbacks da Equipe', 14, 14);
    
    doc.setTextColor(110, 110, 110);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.text('CONFIDENCIAL: A identificação dos membros é mantida em total sigilo.', 14, 30);
    
    const feedbackList = localEvaluations
      .filter(ev => ev.open_feedback && ev.open_feedback.trim().length > 0)
      .map((ev, index) => [`Membro #${index + 1}`, ev.open_feedback.trim()]);

    if (feedbackList.length > 0) {
      autoTable(doc, {
        startY: 35,
        head: [['Identificação Sigilosa', 'Feedback / O que melhorar imediatamente']],
        body: feedbackList,
        theme: 'grid',
        headStyles: { fillColor: [240, 244, 252], textColor: [0, 21, 61], fontStyle: 'bold' },
        styles: { fontSize: 9.5, cellPadding: 6, overflow: 'linebreak' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45, textColor: [120, 120, 120] },
          1: { cellWidth: 'auto', fontStyle: 'italic', textColor: [40, 40, 40] }
        }
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('Nenhum feedback aberto foi deixado nesta avaliação.', 14, 42);
      (doc as any).lastAutoTable = { finalY: 45 };
    }

    nextY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setTextColor(0, 21, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Próximos Passos Sugeridos para a Liderança', 14, nextY);

    const recommendations = [
      '• Reunião Geral de Alinhamento: Compartilhe o resumo das notas gerais com o ministério para celebrar os pontos fortes e convidar o grupo a focar nas melhorias, sem expor os feedbacks textuais individuais.',
      '• Foco no Critério Crítico: Utilize 10 a 15 minutos dos próximos ensaios para conversar de forma prática sobre a dimensão avaliada com menor pontuação.',
      '• Cultura de Melhoria Contínua: Agende uma reavaliação ministerial em 3 ou 6 meses para acompanhar a evolução dos indicadores e a saúde da equipe.'
    ];

    autoTable(doc, {
      startY: nextY + 5,
      body: recommendations.map(rec => [rec]),
      theme: 'plain',
      styles: { fontSize: 9.5, cellPadding: 3.5, textColor: [60, 60, 60] }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Relatório Ministerial Confidencial  •  Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save('Diagnostico_Ministerio_Louvor.pdf');
    toast.success('PDF confidencial gerado com sucesso!');
  };

  // Critério atualmente selecionado na aba 'criteria'
  const currentCriterionObj = useMemo(() => {
    return criteriaAverages.find(c => c.key === selectedCriterion) || criteriaAverages[0];
  }, [criteriaAverages, selectedCriterion]);

  // Respostas filtradas para a aba "responses"
  const filteredEvaluationsForResponsesTab = useMemo(() => {
    return localEvaluations.filter(ev => {
      if (filterLinked === 'linked') return ev.team_member_id != null;
      if (filterLinked === 'unlinked') return ev.team_member_id == null;
      return true;
    });
  }, [localEvaluations, filterLinked]);

  // Respostas filtradas por nota para a aba "criteria"
  const filteredEvaluationsForCriterionTab = useMemo(() => {
    if (!currentCriterionObj) return [];
    return localEvaluations.filter(ev => {
      const score = Number(ev[currentCriterionObj.key as keyof TeamEvaluation]) || 0;
      if (criterionScoreFilter === 'high') return score >= 4;
      if (criterionScoreFilter === 'medium') return score === 3;
      if (criterionScoreFilter === 'low') return score <= 2;
      return true;
    });
  }, [localEvaluations, currentCriterionObj, criterionScoreFilter]);

  // Rol de Comentários filtrados
  const commentsFeedList = useMemo(() => {
    return localEvaluations
      .filter(ev => ev.open_feedback && ev.open_feedback.trim().length > 0)
      .filter(ev => {
        if (!commentSearch) return true;
        return ev.open_feedback.toLowerCase().includes(commentSearch.toLowerCase());
      });
  }, [localEvaluations, commentSearch]);

  // Listas de controle de engajamento (Checklist) para a aba "responses"
  const checklistStats = useMemo(() => {
    const linkedMembers = team.filter(m => localEvaluations.some(ev => ev.team_member_id === m.id));
    const missingMembers = team.filter(m => !localEvaluations.some(ev => ev.team_member_id === m.id));
    const percentage = team.length > 0 ? Math.round((linkedMembers.length / team.length) * 100) : 0;

    return {
      linkedMembers,
      missingMembers,
      percentage,
      total: team.length
    };
  }, [team, localEvaluations]);

  return (
    <div className="min-h-screen bg-[#f8f8fc] pb-24 print:bg-white print:pb-0">
      {/* Header com Design Premium */}
      <div className="bg-[#00153d] text-white pt-12 pb-28 px-6 md:px-12 rounded-b-[3rem] relative z-10 print:bg-white print:text-black print:p-0 print:rounded-none">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 print:hidden">
            <BackButton onClick={onBack} label="Voltar" variant="white" />
            
            <div className="flex items-center gap-3">
              {!canEdit && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-blue-200 text-xs font-bold border border-white/10 backdrop-blur-sm">
                  <EyeOff size={14} className="text-blue-400" />
                  <span>Modo de Visualização Sigilosa</span>
                </div>
              )}
              {canEdit && (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="glass px-4 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-white/10 transition-colors shadow-sm active:scale-95"
                    title="Copiar link do formulário de avaliação"
                  >
                    <Copy size={18} />
                    <span className="hidden sm:inline">Copiar Link</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="glass px-4 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-white/10 transition-colors shadow-sm active:scale-95"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText size={28} className="text-blue-400 print:text-blue-600" />
                <h1 className="text-3xl font-extrabold tracking-tight">Resultados da Avaliação</h1>
              </div>
              <p className="text-blue-200 text-lg print:text-slate-600">
                Análise de Diagnóstico Ministerial de Louvor
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 print:border-slate-200 print:bg-slate-50">
              <div className="text-center px-4 border-r border-white/20 print:border-slate-300">
                <p className="text-xs uppercase tracking-wider text-blue-200 mb-1 print:text-slate-500">Respostas</p>
                <p className="text-3xl font-bold">{localEvaluations.length}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs uppercase tracking-wider text-blue-200 mb-1 print:text-slate-500">Média Geral</p>
                <p className="text-3xl font-bold text-blue-300">{avgScore}<span className="text-sm font-normal text-blue-200">/50</span></p>
              </div>
            </div>
          </div>

          {/* Abas Superiores - Ricas, Modernas e Premium */}
          <div className="flex flex-wrap items-center justify-start sm:justify-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 max-w-4xl mx-auto mt-8 print:hidden">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-[#00153d] shadow-md scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <BarChart3 size={16} />
              <span>Visão Geral & Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('criteria')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'criteria'
                  ? 'bg-white text-[#00153d] shadow-md scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers size={16} />
              <span>Por Característica</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'comments'
                  ? 'bg-white text-[#00153d] shadow-md scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare size={16} />
              <span>Rol de Comentários</span>
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
                activeTab === 'responses'
                  ? 'bg-white text-[#00153d] shadow-md scale-[1.02]'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText size={16} />
              <span>Respostas Individuais</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-10 relative z-20 print:mt-8 print:px-0">
        
        {/* Banner de Diagnóstico */}
        {localEvaluations.length > 0 && (
          <div className={`mb-8 bg-white p-6 rounded-3xl shadow-xl border-l-8 ${teamDiagnostic.color} flex flex-col md:flex-row items-center gap-6 print:shadow-none print:border-2`}>
            <div className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center bg-white shadow-inner border-4 border-slate-50">
               <Star size={28} className={`fill-current ${teamDiagnostic.color.split(' ')[1]}`} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnóstico Geral da Equipe</p>
              <h2 className={`text-2xl font-black mb-1 flex items-center justify-center md:justify-start gap-2 ${teamDiagnostic.color.split(' ')[1]}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${teamDiagnostic.dot}`} />
                {teamDiagnostic.label}
              </h2>
              <p className="text-slate-600 font-medium text-base">{teamDiagnostic.desc}</p>
            </div>
            {!canEdit && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-500 max-w-xs text-center md:text-right">
                <span className="font-bold block text-slate-700 mb-0.5">Visão Transparente</span>
                Todos têm acesso aos gráficos e análises para fortalecimento mútuo da equipe.
              </div>
            )}
          </div>
        )}

        {/* ABA 1: VISÃO GERAL E INSIGHTS */}
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Gráfico de Barras das Características */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={22} />
                    Média por Característica Avaliada
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Distribuição da pontuação média (de 0 a 5) em cada dimensão do ministério.
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-center">
                  💡 <span className="font-medium text-slate-600">Clique em uma barra</span> para analisar detalhes
                </div>
              </div>

              <div className="space-y-4">
                {criteriaAverages.map((crit) => {
                  const badge = getCriterionBadge(crit.avg);
                  const percentage = Math.min(100, Math.max(0, (crit.avg / 5) * 100));

                  return (
                    <div 
                      key={crit.key}
                      onClick={() => {
                        setSelectedCriterion(crit.key);
                        setActiveTab('criteria');
                      }}
                      className="group p-3 rounded-2xl transition-all duration-200 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          {crit.label}
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                            {badge.text}
                          </span>
                          <span className="font-black text-slate-800 text-base">
                            {crit.avg.toFixed(1)}
                            <span className="text-xs font-normal text-slate-400">/5</span>
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Customizada */}
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${badge.bar} transition-all`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seção de Insights Estratégicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pontos Fortes */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-4">
                  <Sparkles size={20} className="text-emerald-600" />
                  <h4 className="text-lg">Maiores Forças (Pontos Fortes)</h4>
                </div>
                <p className="text-sm text-emerald-950 mb-4 leading-relaxed font-medium">
                  Atualmente, a equipe possui suas melhores pontuações médias em:
                </p>
                <div className="space-y-3">
                  {sortedCriteria.slice(0, 2).map((c, i) => (
                    <div key={c.key} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{c.label}</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        Média {c.avg.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foco de Atenção */}
              <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-3xl p-6 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-800 font-bold mb-4">
                  <AlertTriangle size={20} className="text-amber-600" />
                  <h4 className="text-lg">Focos de Atenção (Melhorias)</h4>
                </div>
                <p className="text-sm text-amber-950 mb-4 leading-relaxed font-medium">
                  As áreas que mais necessitam de alinhamento prático nos ensaios são:
                </p>
                <div className="space-y-3">
                  {sortedCriteria.slice(-2).reverse().map((c, i) => (
                    <div key={c.key} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          !
                        </span>
                        <span className="text-sm font-bold text-slate-800">{c.label}</span>
                      </div>
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        Média {c.avg.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ABA 2: ANÁLISE POR CARACTERÍSTICA */}
        {activeTab === 'criteria' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Seletor Horizontal de Características */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs font-bold text-slate-400 uppercase px-2 shrink-0">Selecione:</span>
                {criteriaAverages.map(crit => {
                  const isSelected = crit.key === selectedCriterion;
                  return (
                    <button
                      key={crit.key}
                      onClick={() => setSelectedCriterion(crit.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00153d] text-white shadow-sm' 
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{crit.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {crit.avg.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cabeçalho do Critério Selecionado */}
            {currentCriterionObj && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                      <span>Análise Detalhada de Critério</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-2">{currentCriterionObj.label}</h3>
                    <p className="text-slate-600 font-medium text-sm max-w-3xl">{currentCriterionObj.desc}</p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Média Deste Critério</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{currentCriterionObj.avg.toFixed(1)}</span>
                        <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border block text-center ${getCriterionBadge(currentCriterionObj.avg).bg}`}>
                        {getCriterionBadge(currentCriterionObj.avg).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filtro de notas dadas a este critério */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                    <Filter size={14} /> Filtrar avaliações por nota:
                  </span>
                  {(['all', 'high', 'medium', 'low'] as const).map(mode => {
                    const labels = {
                      all: 'Todas as Notas',
                      high: 'Altas (4 a 5)',
                      medium: 'Médias (3)',
                      low: 'Baixas (1 a 2)'
                    };
                    const isActive = criterionScoreFilter === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setCriterionScoreFilter(mode)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de Respostas Focadas neste Critério */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase px-1">
                Respostas registradas ({filteredEvaluationsForCriterionTab.length}):
              </p>

              {filteredEvaluationsForCriterionTab.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
                  <p className="text-slate-500 font-medium text-sm">Nenhuma resposta corresponde ao filtro de nota selecionado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvaluationsForCriterionTab.map((ev, idx) => {
                    const score = Number(ev[currentCriterionObj.key as keyof TeamEvaluation]) || 0;
                    const isHigh = score >= 4;
                    const isMed = score === 3;

                    return (
                      <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {canEdit ? (
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
                                {ev.member_name.charAt(0)}
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                <UserCircle size={20} />
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-sm text-slate-800 leading-tight">
                                {canEdit ? ev.member_name : `Avaliação Sigilosa #${idx + 1}`}
                              </h4>
                              {canEdit && <p className="text-xs text-slate-500">{ev.member_role}</p>}
                            </div>
                          </div>

                          {/* Nota dada a este critério */}
                          <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 ${
                            isHigh ? 'bg-emerald-50 text-emerald-700 font-bold' :
                            isMed ? 'bg-amber-50 text-amber-700 font-bold' :
                            'bg-rose-50 text-rose-700 font-bold'
                          }`}>
                            <Star size={14} className="fill-current shrink-0" />
                            <span className="text-sm">{score}</span>
                            <span className="text-[10px] text-slate-400 font-normal">/5</span>
                          </div>
                        </div>

                        {/* Snippet de Comentário se houver */}
                        {ev.open_feedback && ev.open_feedback.trim().length > 0 ? (
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                            <span className="text-slate-400 block font-medium mb-1">Feedback geral deixado:</span>
                            <p className="text-slate-600 italic line-clamp-3">"{ev.open_feedback}"</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Sem comentários de feedback descritivo.</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ABA 3: ROL DE COMENTÁRIOS */}
        {activeTab === 'comments' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Barra de Pesquisa / Informação */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Pesquisar nos comentários..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors bg-white text-slate-800"
                />
              </div>
              <div className="text-xs text-slate-500 shrink-0 font-medium">
                Mostrando <span className="font-bold text-slate-800">{commentsFeedList.length}</span> comentários textuais
              </div>
            </div>

            {/* Container do Rol em formato Feed */}
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {commentsFeedList.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-slate-100">
                  <MessageSquare size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium text-sm">Nenhum comentário textual encontrado com a busca atual.</p>
                </div>
              ) : (
                commentsFeedList.map((ev) => {
                  const linkedMember = team.find(m => m.id === ev.team_member_id);
                  const diag = getDiagnostic(ev.total_score);

                  return (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={ev.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden"
                    >
                      {/* Faixa decorativa indicando o sentimento geral do autor */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${diag.dot}`} />

                      <div className="pl-2">
                        {/* Corpo do Comentário */}
                        <div className="relative mb-4">
                          <span className="text-4xl text-slate-200 font-serif absolute -top-2 -left-1 select-none">“</span>
                          <p className="text-slate-700 text-sm sm:text-base leading-relaxed relative z-10 pl-5 italic font-medium">
                            {ev.open_feedback}
                          </p>
                        </div>

                        {/* Rodapé do Comentário com Autoria Controlada */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            {canEdit ? (
                              <>
                                {linkedMember?.avatar ? (
                                  <img src={linkedMember.avatar} alt={ev.member_name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                    {ev.member_name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-bold text-slate-800">{ev.member_name}</span>
                                <span className="text-slate-400">• {ev.member_role}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                  <UserCircle size={14} />
                                </div>
                                <span className="font-bold text-slate-600">Membro da Equipe</span>
                                <span className="text-slate-400 italic">(Autoria Oculta)</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diag.color}`}>
                              Nota Total: {ev.total_score}/50
                            </span>
                            {ev.created_at && (
                              <span className="text-slate-400">
                                {new Date(ev.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ABA 4: TODAS AS RESPOSTAS INDIVIDUAIS COM CHECKLIST DE ENGAGEMENT */}
        {activeTab === 'responses' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Checklist de Preenchimento da Equipe (Exclusivo para Líderes) */}
            {canEdit && (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
                      <Users size={14} />
                      <span>Controle de Engajamento</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Checklist de Respostas da Equipe</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Acompanhe em tempo real quem já preencheu/foi vinculado e quem ainda falta responder.
                    </p>
                  </div>
                  
                  {/* Indicador de Progresso Geral */}
                  <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 shrink-0">
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-800">{checklistStats.percentage}%</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Concluído</p>
                    </div>
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${checklistStats.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {checklistStats.linkedMembers.length}/{checklistStats.total}
                    </span>
                  </div>
                </div>

                {/* Grid das Duas Listas: Concluídos vs Pendentes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna 1: Já Responderam / Vinculados */}
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/80">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        Respostas Vinculadas ({checklistStats.linkedMembers.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">OK</span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-200">
                      {checklistStats.linkedMembers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">Nenhum membro vinculado ainda.</p>
                      ) : (
                        checklistStats.linkedMembers.map(m => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs text-xs">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[9px]">
                                {m.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-bold text-slate-700">{m.name}</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[80px]">({m.role})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coluna 2: Faltam Preencher / Pendentes */}
                  <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/80">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <Clock size={16} className="text-amber-600" />
                        Falta Preencher / Vincular ({checklistStats.missingMembers.length})
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Pendente</span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-200">
                      {checklistStats.missingMembers.length === 0 ? (
                        <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 py-2">
                          🎉 Todos os membros da equipe já preencheram!
                        </p>
                      ) : (
                        checklistStats.missingMembers.map(m => (
                          <div key={m.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 shadow-2xs text-xs group hover:border-amber-400 transition-colors">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover grayscale opacity-70" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[9px]">
                                {m.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-bold text-slate-700">{m.name}</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-[80px]">({m.role})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Barra de Filtros de Vinculação para Líderes */}
            {canEdit && (
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 pl-2">Filtrar Cards de Respostas:</span>
                <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button 
                    onClick={() => setFilterLinked('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${filterLinked === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Todas
                  </button>
                  <button 
                    onClick={() => setFilterLinked('unlinked')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${filterLinked === 'unlinked' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Não Vinculadas
                  </button>
                </div>
              </div>
            )}

            {filteredEvaluationsForResponsesTab.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
                <Filter size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium text-sm">Nenhuma avaliação encontrada com estes filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEvaluationsForResponsesTab.map((ev, idx) => {
                  const diag = getDiagnostic(ev.total_score);
                  const linkedMember = team.find(m => m.id === ev.team_member_id);

                  return (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={ev.id} 
                      className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        {/* Header do Card */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            {canEdit ? (
                              linkedMember?.avatar ? (
                                <img src={linkedMember.avatar} alt={ev.member_name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100" />
                              ) : (
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-100 text-lg">
                                  {ev.member_name.charAt(0)}
                                </div>
                              )
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <UserCircle size={24} />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-base text-slate-800 leading-tight">
                                {canEdit ? ev.member_name : `Avaliação Confidencial #${idx + 1}`}
                              </h3>
                              <p className="text-xs font-medium text-slate-500">
                                {canEdit ? ev.member_role : 'Autoria Protegida'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${diag.color} flex items-center gap-1.5`}>
                               <span>{ev.total_score}/50</span>
                               <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                               {diag.label}
                            </div>
                            {canEdit && (
                              <button 
                                onClick={() => handleDelete(ev.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Avaliação"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bloco de Vinculação para Líderes */}
                        {canEdit && !ev.team_member_id && (
                          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            {isLinking === ev.id ? (
                              <div>
                                <p className="text-xs text-blue-800 font-medium mb-2">Selecione o membro para vincular:</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <select 
                                    className="flex-1 min-w-[140px] rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedMemberToLink}
                                    onChange={(e) => setSelectedMemberToLink(e.target.value)}
                                  >
                                    <option value="" disabled>Escolha um membro...</option>
                                    {team.map(m => (
                                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                                  </select>
                                  <button 
                                    onClick={() => {
                                      if (selectedMemberToLink) {
                                        handleLinkMember(ev.id, selectedMemberToLink);
                                      }
                                    }}
                                    disabled={!selectedMemberToLink}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                                      selectedMemberToLink 
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs cursor-pointer' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <Check size={12} /> Confirmar
                                  </button>
                                  <button 
                                    onClick={() => setIsLinking(null)} 
                                    className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white rounded-lg cursor-pointer shrink-0"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-800 font-medium">Avaliação não vinculada a perfil.</p>
                                <button 
                                  onClick={() => {
                                    setIsLinking(ev.id);
                                    setSelectedMemberToLink('');
                                  }}
                                  className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-white px-2.5 py-1 rounded-md shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
                                >
                                  <LinkIcon size={12} /> Vincular
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grid das 10 Notas */}
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">União</span>
                            <span className="font-bold text-slate-800">{ev.q1_uniao}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Ensaios</span>
                            <span className="font-bold text-slate-800">{ev.q2_comprometimento}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Espiritual</span>
                            <span className="font-bold text-slate-800">{ev.q3_espiritual}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Organização</span>
                            <span className="font-bold text-slate-800">{ev.q4_organizacao}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Comunicação</span>
                            <span className="font-bold text-slate-800">{ev.q5_comunicacao}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Humildade</span>
                            <span className="font-bold text-slate-800">{ev.q6_humildade}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Excelência</span>
                            <span className="font-bold text-slate-800">{ev.q7_excelencia}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Pontualidade</span>
                            <span className="font-bold text-slate-800">{ev.q8_pontualidade}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Igreja</span>
                            <span className="font-bold text-slate-800">{ev.q9_participacao}/5</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500 truncate pr-1">Ambiente</span>
                            <span className="font-bold text-slate-800">{ev.q10_ambiente}/5</span>
                          </div>
                        </div>

                        {/* O que melhorar imediatamente */}
                        {ev.open_feedback && ev.open_feedback.trim().length > 0 && (
                          <div className="bg-white rounded-xl p-3 border border-slate-100 mb-4">
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1 text-[11px]">
                              <MessageSquare size={12} />
                              O que melhorar imediatamente:
                            </div>
                            <p className="text-slate-600 italic text-xs leading-relaxed">
                              "{ev.open_feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {ev.created_at && (
                         <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Calendar size={12} />
                            Registrado em {new Date(ev.created_at).toLocaleDateString('pt-BR')}
                         </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

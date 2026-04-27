import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, ArrowRight, CornerUpLeft } from 'lucide-react';
import { Song, RehearsalStatus, TeamKnowledge, RehearsalNeed, AttentionLevel } from '../../types';

interface SongClassificationWizardProps {
  songs: Song[];
  onUpdateSong: (songId: string, updates: Partial<Song>) => Promise<void> | void;
  onClose: () => void;
}

export function SongClassificationWizard({ songs, onUpdateSong, onClose }: SongClassificationWizardProps) {
  const [mode, setMode] = useState<'pending' | 'all' | null>(null);
  const [sortedSongs, setSortedSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(1);

  const startWizard = (selectedMode: 'pending' | 'all') => {
    const activeSongs = songs.filter((s) => s.isActiveRepertoire !== false);
    let filtered = activeSongs;
    
    if (selectedMode === 'pending') {
      filtered = activeSongs.filter((s) => !s.classifiedAt);
    }
    
    const sorted = filtered.sort((a, b) => {
      const aClassified = !!a.classifiedAt;
      const bClassified = !!b.classifiedAt;
      if (aClassified === bClassified) {
        return a.title.localeCompare(b.title, 'pt-BR');
      }
      return aClassified ? 1 : -1;
    });

    setSortedSongs(sorted);
    setMode(selectedMode);
    setCurrentIndex(0);
    setStep(1);
  };

  const currentSong = sortedSongs[currentIndex];

  // Form states matching Song interface
  const [rehearsalStatus, setRehearsalStatus] = useState<RehearsalStatus | undefined>(currentSong?.rehearsalStatus);
  const [teamKnowledge, setTeamKnowledge] = useState<TeamKnowledge | undefined>(currentSong?.teamKnowledge);
  const [rehearsalNeed, setRehearsalNeed] = useState<RehearsalNeed | undefined>(currentSong?.rehearsalNeed);
  const [attentionLevel, setAttentionLevel] = useState<AttentionLevel | undefined>(currentSong?.attentionLevel);
  const [attentionReasons, setAttentionReasons] = useState<string[]>(currentSong?.attentionReasons || []);
  const [technicalLevel, setTechnicalLevel] = useState<number>(currentSong?.technicalLevel || 5);
  const [classificationNotes, setClassificationNotes] = useState<string>(currentSong?.classificationNotes || '');

  const [isSaving, setIsSaving] = useState(false);

  // When changing song, reset form states
  React.useEffect(() => {
    if (currentSong) {
      setRehearsalStatus(currentSong.rehearsalStatus);
      setTeamKnowledge(currentSong.teamKnowledge);
      setRehearsalNeed(currentSong.rehearsalNeed);
      setAttentionLevel(currentSong.attentionLevel);
      setAttentionReasons(currentSong.attentionReasons || []);
      setTechnicalLevel(currentSong.technicalLevel || 5);
      setClassificationNotes(currentSong.classificationNotes || '');
      setStep(1);
    }
  }, [currentSong]);

  if (mode === null) {
    const activeCount = songs.filter(s => s.isActiveRepertoire !== false).length;
    const pendingCount = songs.filter(s => s.isActiveRepertoire !== false && !s.classifiedAt).length;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[2.5rem] p-8 max-w-md w-full apple-shadow"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#00153d]">Classificação</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <p className="text-slate-600 mb-8">
            Como você deseja prosseguir com a classificação do repertório?
          </p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => startWizard('pending')}
              className="w-full p-6 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-2xl transition-colors text-left flex items-start gap-4"
            >
              <div className="p-3 bg-blue-600 text-white rounded-xl">
                <Check size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Classificar Pendentes</h3>
                <p className="text-sm text-blue-700">
                  {pendingCount === 0 
                    ? 'Todos os louvores já foram classificados!' 
                    : `Revisar os ${pendingCount} louvores que ainda não foram classificados.`}
                </p>
              </div>
            </button>

            <button
              onClick={() => startWizard('all')}
              className="w-full p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-colors text-left flex items-start gap-4"
            >
              <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
                <ArrowRight size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Revisar Repertório Completo</h3>
                <p className="text-sm text-slate-600">
                  Revisar e reclassificar todos os {activeCount} louvores do repertório ativo.
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-[#00153d] mb-4">Tudo classificado!</h2>
          <p className="text-slate-500 mb-8">Todos os louvores do repertório ativo foram revisados.</p>
          <button onClick={onClose} className="w-full py-4 bg-[#00153d] text-white rounded-2xl font-bold">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const handleNextStep = () => {
    if (step === 4 && attentionLevel === 'normal') {
      setStep(6); // Skip Step 5 (motivos de atenção)
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrevStep = () => {
    if (step === 6 && attentionLevel === 'normal') {
      setStep(4);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSkipSong = () => {
    if (currentIndex < sortedSongs.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  };

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
      await onUpdateSong(currentSong.id, {
        rehearsalStatus,
        teamKnowledge,
        rehearsalNeed,
        attentionLevel,
        attentionReasons,
        technicalLevel,
        classificationNotes,
        classifiedAt: new Date().toISOString(),
      });
      handleSkipSong();
    } catch (error) {
      console.error('Error saving classification:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAttentionReason = (reason: string) => {
    setAttentionReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Esse louvor já foi ensaiado com o grupo?</h3>
            <CardOption
              selected={rehearsalStatus === 'rehearsed'}
              onClick={() => { setRehearsalStatus('rehearsed'); handleNextStep(); }}
              title="Já ensaiamos"
              description="Usamos em ensaio oficial com o ministério."
            />
            <CardOption
              selected={rehearsalStatus === 'not_rehearsed'}
              onClick={() => { setRehearsalStatus('not_rehearsed'); handleNextStep(); }}
              title="Ainda não ensaiamos"
              description="Nunca passou por ensaio oficial ou ainda não foi trabalhado em grupo."
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Hoje o grupo sabe tocar esse louvor?</h3>
            <CardOption
              selected={teamKnowledge === 'we_know'}
              onClick={() => { setTeamKnowledge('we_know'); handleNextStep(); }}
              title="Sabemos tocar"
              description="O grupo consegue tocar com segurança."
            />
            <CardOption
              selected={teamKnowledge === 'partial'}
              onClick={() => { setTeamKnowledge('partial'); handleNextStep(); }}
              title="Sabemos parcialmente"
              description="Alguns sabem, mas ainda falta alinhar."
            />
            <CardOption
              selected={teamKnowledge === 'we_do_not_know'}
              onClick={() => { setTeamKnowledge('we_do_not_know'); handleNextStep(); }}
              title="Não sabemos ainda"
              description="Precisa tirar, estudar ou aprender."
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Qual é a necessidade de ensaio desse louvor?</h3>
            <CardOption
              selected={rehearsalNeed === 'ready'}
              onClick={() => { setRehearsalNeed('ready'); handleNextStep(); }}
              title="Pronto para culto"
              description="Pode entrar no repertório sem ensaio extra."
            />
            <CardOption
              selected={rehearsalNeed === 'light_rehearsal'}
              onClick={() => { setRehearsalNeed('light_rehearsal'); handleNextStep(); }}
              title="Revisão leve"
              description="Só precisa passar uma vez."
            />
            <CardOption
              selected={rehearsalNeed === 'needs_rehearsal'}
              onClick={() => { setRehearsalNeed('needs_rehearsal'); handleNextStep(); }}
              title="Precisa de ensaio"
              description="Precisa entrar na pauta de ensaio."
            />
            <CardOption
              selected={rehearsalNeed === 'intensive_rehearsal'}
              onClick={() => { setRehearsalNeed('intensive_rehearsal'); handleNextStep(); }}
              title="Precisa de muito ensaio"
              description="Exige preparo antes de ir para culto."
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Esse louvor exige atenção especial?</h3>
            <CardOption
              selected={attentionLevel === 'normal'}
              onClick={() => { setAttentionLevel('normal'); setStep(6); }}
              title="Normal"
              description="Sem grandes detalhes técnicos."
            />
            <CardOption
              selected={attentionLevel === 'attention'}
              onClick={() => { setAttentionLevel('attention'); handleNextStep(); }}
              title="Precisa de atenção"
              description="Tem detalhes importantes que precisam ser lembrados."
            />
            <CardOption
              selected={attentionLevel === 'high_attention'}
              onClick={() => { setAttentionLevel('high_attention'); handleNextStep(); }}
              title="Atenção alta"
              description="Mesmo conhecido, precisa ser revisado com frequência."
            />
          </div>
        );
      case 5:
        const REASONS = ['Introdução', 'Solo', 'Paradas', 'Viradas', 'Tempo', 'Mudança de tom', 'Backing vocal', 'Dinâmica', 'Final combinado', 'Entrada difícil', 'Outro'];
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Quais pontos exigem atenção?</h3>
            <div className="flex flex-wrap gap-3">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => toggleAttentionReason(reason)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    attentionReasons.includes(reason)
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-black/10 text-slate-600 hover:border-black/20'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="pt-6">
              <button onClick={handleNextStep} className="w-full py-4 bg-[#00153d] text-white rounded-2xl font-bold">
                Continuar
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-[#00153d]">Qual o nível técnico desse louvor para o nosso ministério?</h3>
            <div className="flex justify-between items-end gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  onClick={() => setTechnicalLevel(level)}
                  className={`flex-1 h-12 rounded-lg font-bold flex items-center justify-center transition-all ${
                    technicalLevel === level
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>1-2 Muito simples</span>
              <span>9-10 Muito técnico</span>
            </div>
            <div className="pt-6">
              <button onClick={handleNextStep} className="w-full py-4 bg-[#00153d] text-white rounded-2xl font-bold">
                Continuar
              </button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#00153d] mb-6">Alguma observação importante?</h3>
            <textarea
              value={classificationNotes}
              onChange={(e) => setClassificationNotes(e.target.value)}
              placeholder="Exemplo: precisa combinar final, entrada da bateria, backing no refrão..."
              className="w-full p-4 h-32 bg-slate-50 border border-black/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <div className="pt-6">
              <button onClick={handleNextStep} className="w-full py-4 bg-[#00153d] text-white rounded-2xl font-bold">
                Ver Resumo
              </button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#00153d] mb-4">Resumo da Classificação</h3>
            
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-slate-500">Status de ensaio</span>
                <span className="font-bold text-[#00153d]">{rehearsalStatus === 'rehearsed' ? 'Já ensaiamos' : 'Ainda não ensaiamos'}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-slate-500">Domínio do grupo</span>
                <span className="font-bold text-[#00153d]">{teamKnowledge === 'we_know' ? 'Sabemos tocar' : teamKnowledge === 'partial' ? 'Sabemos parcialmente' : 'Não sabemos ainda'}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-slate-500">Necessidade de ensaio</span>
                <span className="font-bold text-[#00153d]">{rehearsalNeed === 'ready' ? 'Pronto para culto' : rehearsalNeed === 'light_rehearsal' ? 'Revisão leve' : rehearsalNeed === 'needs_rehearsal' ? 'Precisa de ensaio' : 'Precisa de muito ensaio'}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-slate-500">Atenção técnica</span>
                <span className="font-bold text-[#00153d]">{attentionLevel === 'normal' ? 'Normal' : attentionLevel === 'attention' ? 'Precisa de atenção' : 'Atenção alta'}</span>
              </div>
              {attentionReasons.length > 0 && (
                <div className="flex justify-between border-b border-black/5 pb-2">
                  <span className="text-slate-500">Motivos</span>
                  <span className="font-bold text-[#00153d] text-right max-w-[60%]">{attentionReasons.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between pb-2">
                <span className="text-slate-500">Nível técnico</span>
                <span className="font-bold text-[#00153d]">{technicalLevel}/10</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white border border-black/10 text-slate-600 rounded-2xl font-bold hover:bg-slate-50">
                Editar
              </button>
              <button 
                onClick={() => void handleSaveAndNext()} 
                disabled={isSaving}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : 'Salvar e próximo'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const progressPercent = ((currentIndex) / sortedSongs.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-black/5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classificação</p>
            <h1 className="font-bold text-[#00153d]">Louvor {currentIndex + 1} de {sortedSongs.length}</h1>
          </div>
        </div>
        <button onClick={handleSkipSong} className="text-sm font-bold text-blue-600 px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
          Pular
        </button>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200 w-full">
        <motion.div 
          className="h-full bg-blue-600" 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="max-w-2xl w-full">
          {/* Song Info */}
          <div className="mb-8 text-center mt-4">
            <h2 className="text-3xl md:text-4xl font-black text-[#00153d] mb-2">{currentSong.title}</h2>
            <div className="flex items-center justify-center gap-3 text-slate-500 font-medium">
              <span>{currentSong.artist}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="px-2 py-1 bg-slate-200/50 rounded-md text-xs font-bold text-slate-600">Tom: {currentSong.key}</span>
            </div>
          </div>

          {/* Wizard Card */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-blue-900/[0.02] border border-black/5 relative overflow-hidden">
            {step > 1 && step < 8 && (
              <button 
                onClick={handlePrevStep}
                className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                title="Voltar"
              >
                <CornerUpLeft size={20} />
              </button>
            )}
            
            <div className="mt-4 md:mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CardOption({ selected, onClick, title, description }: { selected: boolean; onClick: () => void; title: string; description: string; }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-900/5'
          : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-black/5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-bold text-lg ${selected ? 'text-blue-700' : 'text-[#00153d]'}`}>{title}</h4>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'}`}>
          <Check size={14} strokeWidth={3} />
        </div>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </button>
  );
}

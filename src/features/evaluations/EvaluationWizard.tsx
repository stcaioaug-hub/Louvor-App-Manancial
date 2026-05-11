import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle2, Shield, HeartHandshake, Mic2, Star, Clock, Users, ArrowRight } from 'lucide-react';
import { createTeamEvaluation } from '../../lib/appData';
import type { TeamEvaluation } from '../../types';

const ROLES = [
  'Vocal', 'Bateria', 'Teclado', 'Guitarra', 'Violão', 'Baixo', 'Líder/Ministro', 'Mídia/Som', 'Outro'
];

const QUESTIONS = [
  { id: 'q1_uniao', title: 'União da equipe', icon: HeartHandshake, desc: 'Como você avalia a união e companheirismo entre os membros?' },
  { id: 'q2_comprometimento', title: 'Comprometimento com ensaios', icon: Clock, desc: 'A equipe tem levado os ensaios a sério e se preparado?' },
  { id: 'q3_espiritual', title: 'Vida espiritual', icon: Shield, desc: 'Como você percebe a busca e maturidade espiritual do grupo?' },
  { id: 'q4_organizacao', title: 'Organização da equipe', icon: CheckCircle2, desc: 'As escalas, repertórios e avisos estão bem organizados?' },
  { id: 'q5_comunicacao', title: 'Comunicação', icon: Mic2, desc: 'Existe clareza e transparência na comunicação entre líderes e liderados?' },
  { id: 'q6_humildade', title: 'Humildade e respeito', icon: Users, desc: 'Há facilidade em receber críticas e respeitar as diferenças?' },
  { id: 'q7_excelencia', title: 'Excelência musical', icon: Star, desc: 'Estamos buscando tocar e cantar com qualidade para Deus?' },
  { id: 'q8_pontualidade', title: 'Pontualidade', icon: Clock, desc: 'Os horários de chegada aos ensaios e cultos são respeitados?' },
  { id: 'q9_participacao', title: 'Participação na igreja', icon: Users, desc: 'A equipe está presente nos cultos e atividades, além de quando escala?' },
  { id: 'q10_ambiente', title: 'Ambiente dos ensaios', icon: HeartHandshake, desc: 'O clima dos nossos ensaios é leve, espiritual e produtivo?' }
] as const;

type Answers = Omit<TeamEvaluation, 'id' | 'created_at' | 'total_score' | 'team_member_id'>;

export default function EvaluationWizard() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({
    member_name: '',
    member_role: '',
    q1_uniao: 0,
    q2_comprometimento: 0,
    q3_espiritual: 0,
    q4_organizacao: 0,
    q5_comunicacao: 0,
    q6_humildade: 0,
    q7_excelencia: 0,
    q8_pontualidade: 0,
    q9_participacao: 0,
    q10_ambiente: 0,
    open_feedback: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = QUESTIONS.length + 2; // +1 for Identity, +1 for Open Feedback

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const totalScore = 
        answers.q1_uniao + answers.q2_comprometimento + answers.q3_espiritual + 
        answers.q4_organizacao + answers.q5_comunicacao + answers.q6_humildade + 
        answers.q7_excelencia + answers.q8_pontualidade + answers.q9_participacao + 
        answers.q10_ambiente;

      await createTeamEvaluation({
        ...answers,
        total_score: totalScore
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionIndex = step - 1;
  const isQuestionStep = currentQuestionIndex >= 0 && currentQuestionIndex < QUESTIONS.length;
  const currentQuestion = isQuestionStep ? QUESTIONS[currentQuestionIndex] : null;

  const canProceed = () => {
    if (step === 0) return answers.member_name.trim().length > 0 && answers.member_role.length > 0;
    if (isQuestionStep && currentQuestion) {
      return answers[currentQuestion.id as keyof Answers] > 0;
    }
    if (step === QUESTIONS.length + 1) return answers.open_feedback.trim().length > 0;
    return true;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f8fc] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Avaliação Enviada!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Muito obrigado pela sua sinceridade e tempo. Suas respostas são fundamentais para o crescimento do nosso ministério.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8fc] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Progress Bar */}
      {step >= 0 && (
        <div className="fixed top-0 left-0 w-full h-1.5 bg-blue-100 z-50">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="w-full max-w-xl relative">
        <AnimatePresence mode="wait">
          {/* INTRO STEP */}
          {step === -1 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-12 text-center border border-slate-100"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={36} className="fill-blue-600/20" />
              </div>
              <h1 className="text-3xl font-extrabold text-[#00153d] mb-4">Avaliação do Ministério</h1>
              <p className="text-slate-500 mb-8 leading-relaxed text-lg">
                Queremos ouvir você! Esta autoavaliação tem como objetivo identificar nossos pontos fortes e onde precisamos melhorar como equipe. Seja sincero(a).
              </p>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
              >
                Começar Avaliação
                <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {/* IDENTITY STEP */}
          {step === 0 && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-[#00153d] mb-6">Quem é você?</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seu Nome</label>
                  <input
                    type="text"
                    value={answers.member_name}
                    onChange={(e) => setAnswers({ ...answers, member_name: e.target.value })}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sua Função Principal</label>
                  <select
                    value={answers.member_role}
                    onChange={(e) => setAnswers({ ...answers, member_role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-800"
                  >
                    <option value="" disabled>Selecione sua função</option>
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS STEPS */}
          {isQuestionStep && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100 text-center"
            >
              <div className="text-blue-500/50 text-sm font-bold tracking-widest uppercase mb-6">
                Pergunta {currentQuestionIndex + 1} de 10
              </div>
              
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <currentQuestion.icon size={28} />
              </div>

              <h2 className="text-2xl font-bold text-[#00153d] mb-3">{currentQuestion.title}</h2>
              <p className="text-slate-500 mb-10 leading-relaxed">{currentQuestion.desc}</p>

              <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((score) => {
                  const currentValue = answers[currentQuestion.id as keyof Answers] as number;
                  const isSelected = currentValue === score;
                  return (
                    <button
                      key={score}
                      onClick={() => setAnswers({ ...answers, [currentQuestion.id]: score })}
                      className={`
                        relative flex flex-col items-center justify-center h-16 sm:h-20 rounded-2xl transition-all duration-300 font-bold text-xl sm:text-2xl
                        ${isSelected 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' 
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}
                      `}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-400 px-2">
                <span>Péssimo</span>
                <span>Excelente</span>
              </div>
            </motion.div>
          )}

          {/* OPEN QUESTION STEP */}
          {step === QUESTIONS.length + 1 && (
            <motion.div
              key="open-question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
                <Star size={28} className="fill-amber-600/20" />
              </div>
              <h2 className="text-2xl font-bold text-[#00153d] mb-3">Última Pergunta</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                O que precisamos melhorar imediatamente para crescer como ministério?
              </p>
              
              <textarea
                value={answers.open_feedback}
                onChange={(e) => setAnswers({ ...answers, open_feedback: e.target.value })}
                placeholder="Escreva sua opinião sincera aqui..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-slate-800 min-h-[160px] resize-none"
              />
            </motion.div>
          )}

          {/* SUMMARY / CONFIRMATION STEP */}
          {step === totalSteps && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100"
            >
              <h2 className="text-2xl font-bold text-[#00153d] mb-2 text-center">Revisão Final</h2>
              <p className="text-slate-500 text-center mb-8">Confira suas informações antes de enviar.</p>

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Nome</span>
                  <span className="font-bold text-slate-800">{answers.member_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Função</span>
                  <span className="font-bold text-slate-800">{answers.member_role}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-slate-500 font-medium">Avaliações (0-5)</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                    {Object.values(answers).filter(v => typeof v === 'number').length} preenchidas
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar e Enviar'}
                {!isSubmitting && <CheckCircle2 size={20} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAVIGATION BUTTONS */}
        {step >= 0 && step < totalSteps && (
          <div className="flex items-center justify-between mt-8 gap-4 px-2">
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Voltar
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 bg-[#00153d] hover:bg-blue-900 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Próximo
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { 
  User, 
  Music, 
  Mic, 
  Cross, 
  Check, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  Guitar,
  Speaker
} from 'lucide-react';

interface OnboardingWizardProps {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

type Step = 'welcome' | 'role' | 'instrument' | 'personalize' | 'loading';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ profile, onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState({
    functional_role: '' as Profile['functional_role'],
    instrument: '',
    name: profile.name || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'vocal', name: 'Vocal', icon: Mic, description: 'Ministre com sua voz' },
    { id: 'musician', name: 'Músico', icon: Music, description: 'Toque um instrumento' },
    { id: 'minister', name: 'Ministro', icon: Sparkles, description: 'Lidere o louvor' },
    { id: 'pastor', name: 'Pastor', icon: Cross, description: 'Pastoreio e direção' },
  ];

  const instruments = [
    { id: 'bass', name: 'Baixo', icon: Guitar },
    { id: 'guitar', name: 'Guitarra', icon: Speaker },
    { id: 'acoustic', name: 'Violão', icon: Guitar },
    { id: 'drums', name: 'Bateria', icon: Speaker },
    { id: 'keyboard', name: 'Teclado', icon: Music },
    { id: 'none', name: 'Apenas Canto', icon: Mic },
  ];

  const handleRoleSelect = (roleId: any) => {
    setFormData({ ...formData, functional_role: roleId });
    if (roleId === 'vocal' || roleId === 'pastor') {
      setStep('personalize');
    } else {
      setStep('instrument');
    }
  };

  const handleInstrumentSelect = (instId: string) => {
    setFormData({ ...formData, instrument: instId === 'none' ? '' : instId });
    setStep('personalize');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setStep('loading');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          functional_role: formData.functional_role,
          instrument: formData.instrument,
          name: formData.name,
          onboarding_completed: true
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      onComplete(data as Profile);
    } catch (err) {
      console.error('Error updating profile:', err);
      setStep('personalize');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-manancial-dark/10 backdrop-blur-md">
      <div className="glass w-full max-w-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-manancial-blue to-manancial-teal transition-all duration-500 ease-out"
            style={{ 
              width: step === 'welcome' ? '25%' : 
                     step === 'role' ? '50%' : 
                     step === 'instrument' ? '75%' : 
                     step === 'personalize' ? '90%' : '100%' 
            }}
          />
        </div>

        <div className="p-8 md:p-12">
          
          {step === 'welcome' && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-manancial-blue">
                <Sparkles className="w-10 h-10 animate-float" />
              </div>
              <h1 className="text-3xl font-headline font-extrabold text-slate-800 mb-4">
                Seja bem-vindo ao Ministério!
              </h1>
              <p className="text-slate-600 text-lg mb-8">
                Estamos felizes em ter você conosco. Vamos configurar seu perfil rapidinho para você começar a usar o Manancial.
              </p>
              <button
                onClick={() => setStep('role')}
                className="w-full py-4 bg-manancial-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-blue-900/20 group"
              >
                Começar agora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 'role' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep('welcome')}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <h2 className="text-2xl font-headline font-bold text-slate-800 mb-2">
                Qual sua função?
              </h2>
              <p className="text-slate-500 mb-8">Escolha como você servirá no ministério de louvor.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="p-5 rounded-2xl border-2 border-transparent bg-white/50 hover:bg-white hover:border-manancial-blue/30 text-left transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-manancial-blue group-hover:bg-blue-50 transition-colors">
                        <role.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{role.name}</h3>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'instrument' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep('role')}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <h2 className="text-2xl font-headline font-bold text-slate-800 mb-2">
                Qual instrumento?
              </h2>
              <p className="text-slate-500 mb-8">
                {formData.functional_role === 'minister' 
                  ? 'Você também toca algum instrumento ao ministrar?' 
                  : 'Qual o seu instrumento principal?'}
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {instruments.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handleInstrumentSelect(inst.id)}
                    className="p-4 rounded-2xl bg-white/50 hover:bg-white border-2 border-transparent hover:border-manancial-teal/30 transition-all text-center group"
                  >
                    <inst.icon className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-manancial-teal transition-colors" />
                    <span className="text-sm font-bold text-slate-700">{inst.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'personalize' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep(formData.functional_role === 'vocal' || formData.functional_role === 'pastor' ? 'role' : 'instrument')}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <h2 className="text-2xl font-headline font-bold text-slate-800 mb-2">
                Como quer ser chamado?
              </h2>
              <p className="text-slate-500 mb-8">Configure seu nome de usuário no aplicativo.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-white/50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-manancial-blue/50 focus:border-manancial-blue transition-all text-slate-800 "
                    placeholder="Ex: Caio Gustavo"
                  />
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-manancial-blue">
                    <Check className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-slate-600">
                    Tudo pronto! Ao finalizar, você terá acesso total ao repertório e cronograma do ministério.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-manancial-blue to-manancial-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  Finalizar Configuração
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-manancial-blue/20 border-t-manancial-blue rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Configurando seu mundo...</h3>
              <p className="text-slate-500">Isso levará apenas um segundo.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

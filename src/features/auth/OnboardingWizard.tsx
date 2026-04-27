import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
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
  Speaker,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingWizardProps {
  profile: Profile;
  onComplete: (updatedProfile: Profile) => void;
}

type Step = 'welcome' | 'role' | 'instrument' | 'personalize' | 'security' | 'loading' | 'email_sent';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ profile, onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState({
    functional_role: '' as Profile['functional_role'],
    instrument: '',
    name: profile.name || ''
  });
  const [securityData, setSecurityData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { data: profileData, error: profileError } = await supabase
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

      if (profileError) throw profileError;

      // Update credentials if provided
      if (securityData.email || securityData.password) {
        const updateParams: any = {};
        if (securityData.email && securityData.email !== '') updateParams.email = securityData.email;
        if (securityData.password && securityData.password !== '') updateParams.password = securityData.password;

        const { error: authError } = await supabase.auth.updateUser(updateParams);
        if (authError) throw authError;
        
        if (updateParams.email) {
          setUpdatedProfile(profileData as Profile);
          setStep('email_sent');
          setIsLoading(false);
          return;
        }
      }

      onComplete(profileData as Profile);
    } catch (err: any) {
      console.error('Error during onboarding:', err);
      setError(err.message || 'Ocorreu um erro ao salvar as configurações.');
      setStep('security');
      setIsLoading(false);
    }
  };

  const handleNextFromPersonalize = () => {
    if (!formData.name.trim()) return;
    setStep('security');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-manancial-dark/10 backdrop-blur-md">
      <div className="glass w-full max-w-xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/20">
          <div 
            className="h-full bg-gradient-to-r from-manancial-blue to-manancial-teal transition-all duration-500 ease-out"
            style={{ 
              width: step === 'welcome' ? '20%' : 
                     step === 'role' ? '40%' : 
                     step === 'instrument' ? '60%' : 
                     step === 'personalize' ? '80%' : 
                     step === 'security' ? '95%' : '100%' 
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
                  onClick={handleNextFromPersonalize}
                  disabled={!formData.name.trim() || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-manancial-blue to-manancial-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  Continuar
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'security' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setStep('personalize')}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <h2 className="text-2xl font-headline font-bold text-slate-800 mb-2">
                Segurança da Conta
              </h2>
              <p className="text-slate-500 mb-8">Personalize seu login. Você pode alterar seu e-mail e definir uma senha pessoal.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Novo E-mail (Opcional)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-manancial-blue transition-colors" size={20} />
                    <input
                      type="email"
                      value={securityData.email}
                      onChange={(e) => setSecurityData({ ...securityData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-manancial-blue/20 focus:border-manancial-blue outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nova Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-manancial-blue transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={securityData.password}
                        onChange={(e) => setSecurityData({ ...securityData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-manancial-blue/20 focus:border-manancial-blue outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Confirmar Senha</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-manancial-blue transition-colors" size={20} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-manancial-blue/20 focus:border-manancial-blue outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {securityData.password && securityData.password.length < 6 && (
                  <p className="text-xs text-amber-600 font-bold ml-1">A senha deve ter pelo menos 6 caracteres.</p>
                )}

                {securityData.password !== securityData.confirmPassword && securityData.confirmPassword !== '' && (
                  <p className="text-xs text-red-500 font-bold ml-1">As senhas não coincidem.</p>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-3"
                  >
                    <ShieldCheck size={18} className="shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      isLoading || 
                      (securityData.password !== securityData.confirmPassword) || 
                      (securityData.password !== '' && securityData.password.length < 6)
                    }
                    className="w-full py-4 bg-manancial-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Finalizar Configuração
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Ao clicar em finalizar, sua conta será atualizada e você será redirecionado.
                  </p>
                </div>
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

          {step === 'email_sent' && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500 py-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-500">
                <Check className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-headline font-extrabold text-slate-800 mb-4">
                Verifique seu e-mail
              </h1>
              <p className="text-slate-600 text-base mb-8">
                Um e-mail de confirmação foi enviado para <strong className="text-slate-800">{securityData.email}</strong>. 
                Por favor, acesse sua caixa de entrada e clique no link para confirmar a alteração de e-mail.
              </p>
              <button
                onClick={() => onComplete(updatedProfile!)}
                className="w-full py-4 bg-manancial-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg group"
              >
                Continuar
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

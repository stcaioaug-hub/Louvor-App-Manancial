import React, { useEffect, useState } from 'react';
import { Profile } from '../../types';
import { updateProfile } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Save, 
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Music,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { BackButton } from '../../components/BackButton';

interface SettingsProps {
  profile: Profile | null;
  email: string | undefined;
  onUpdateProfile: (newProfile: Profile) => void;
  onBack?: () => void;
  onSignOut?: () => void;
}

export default function Settings({ profile, email, onUpdateProfile, onBack, onSignOut }: SettingsProps) {
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [functionalRole, setFunctionalRole] = useState(profile?.functional_role || '');
  const [instrument, setInstrument] = useState(profile?.instrument || '');
  const [accountEmail, setAccountEmail] = useState(email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [accountStatus, setAccountStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setName(profile?.name || '');
    setAvatarUrl(profile?.avatar_url || '');
    setFunctionalRole(profile?.functional_role || '');
    setInstrument(profile?.instrument || '');
  }, [profile]);

  useEffect(() => {
    setAccountEmail(email || '');
  }, [email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsUpdating(true);
    setStatus(null);
    
    try {
      const updated = await updateProfile({
        id: profile.id,
        name,
        avatar_url: avatarUrl,
        functional_role: functionalRole as any,
        instrument
      });
      
      if (updated) {
        onUpdateProfile(updated);
        setStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Erro ao atualizar perfil.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountStatus(null);

    const trimmedEmail = accountEmail.trim();
    const hasEmailChange = Boolean(trimmedEmail && trimmedEmail !== email);
    const hasPasswordChange = Boolean(newPassword || confirmPassword);

    if (!hasEmailChange && !hasPasswordChange) {
      setAccountStatus({ type: 'error', message: 'Informe um novo e-mail ou uma nova senha para atualizar.' });
      return;
    }

    if (hasPasswordChange) {
      if (newPassword.length < 6) {
        setAccountStatus({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
        return;
      }

      if (newPassword !== confirmPassword) {
        setAccountStatus({ type: 'error', message: 'As senhas não coincidem.' });
        return;
      }
    }

    setIsUpdatingAccount(true);

    try {
      const updateParams: { email?: string; password?: string } = {};
      if (hasEmailChange) updateParams.email = trimmedEmail;
      if (hasPasswordChange) updateParams.password = newPassword;

      const { error } = await supabase.auth.updateUser(updateParams);
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');

      if (hasEmailChange && hasPasswordChange) {
        setAccountStatus({
          type: 'success',
          message: 'Senha atualizada. Enviamos um e-mail de confirmação para concluir a troca do e-mail.',
        });
      } else if (hasEmailChange) {
        setAccountStatus({
          type: 'success',
          message: 'Enviamos um e-mail de confirmação para concluir a troca do e-mail.',
        });
      } else {
        setAccountStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
      }
    } catch (error: any) {
      setAccountStatus({ type: 'error', message: error.message || 'Erro ao atualizar acesso.' });
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex flex-col gap-6">
        {onBack && <BackButton onClick={onBack} />}
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-extrabold text-[#00153d] tracking-tight">
            Configurações
          </h2>
          <p className="text-slate-500 font-medium text-lg">
            Gerencie seu perfil e preferências do aplicativo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 apple-shadow border border-white mt-12">
            <div className="relative -mt-16 mb-8 flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white apple-shadow-lg bg-blue-50 relative">
                  <img 
                    src={avatarUrl || "https://ugc.production.linktr.ee/d6970972-5f9a-4f2d-8125-7a8cf7df28cc_IMG-0954.jpeg?io=true&size=avatar-v3_0"} 
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                  <Camera size={18} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-headline font-bold text-[#00153d]">{name || 'Seu Nome'}</h3>
                <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em]">{profile?.role === 'minister' ? 'Ministro de Louvor' : 'Músico'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8 pt-4 border-t border-slate-50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <h3 className="text-xl font-headline font-bold text-[#00153d]">Informações Pessoais</h3>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-4 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 opacity-60">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">E-mail atual</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      value={email || ''}
                      disabled
                      className="w-full bg-[#eeeef5] border-none rounded-2xl py-4 pl-12 pr-4 font-medium text-[#00153d] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>



                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Função</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <select
                      value={functionalRole}
                      onChange={(e) => setFunctionalRole(e.target.value)}
                      className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-4 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="vocal">Vocal</option>
                      <option value="musician">Músico</option>
                      <option value="minister">Ministro</option>
                      <option value="pastor">Pastor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Instrumento</label>
                  <div className="relative group">
                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type="text"
                      value={instrument}
                      onChange={(e) => setInstrument(e.target.value)}
                      placeholder="Ex: Teclado"
                      className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-4 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 font-medium ${
                    status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {status.message}
                </motion.div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto flex-1 bg-[#00153d] text-white rounded-2xl px-10 py-4 font-bold apple-shadow hover:bg-[#001c52] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {isUpdating ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}
                  Salvar Alterações
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full sm:w-auto flex-1 bg-red-50 text-red-600 rounded-2xl px-10 py-4 font-bold border border-red-100 apple-shadow hover:bg-red-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <LogOut size={20} />
                    Sair da Conta
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 apple-shadow border border-white">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h3 className="text-2xl font-headline font-bold text-[#00153d]">Segurança da Conta</h3>
            </div>

            <form onSubmit={handleAccountSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Novo e-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-4 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Nova senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-12 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Confirmar senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full bg-[#f8f8fc] border-none rounded-2xl py-4 pl-12 pr-12 font-medium text-[#00153d] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {accountStatus && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl flex items-center gap-3 font-medium ${
                    accountStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {accountStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {accountStatus.message}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isUpdatingAccount}
                className="w-full bg-[#00153d] text-white rounded-2xl px-10 py-4 font-bold apple-shadow hover:bg-[#001c52] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {isUpdatingAccount ? <LoaderCircle className="animate-spin" size={20} /> : <Shield size={20} />}
                Atualizar Acesso
              </button>
            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-[#00153d] rounded-[2.5rem] p-8 apple-shadow text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <Shield size={28} />
              </div>
              
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Seu Nível de Acesso</p>
                <h4 className="text-3xl font-headline font-extrabold capitalize">
                  {profile?.role === 'minister' ? 'Ministro de Louvor' : 'Músico'}
                </h4>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-sm text-white/80">
                    {profile?.role === 'minister' 
                      ? 'Você tem permissão total para gerenciar o repertório, equipe e agenda.' 
                      : 'Você tem permissão para visualizar o repertório e agenda em tempo real.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 apple-shadow border border-white">
            <h4 className="font-headline font-bold text-[#00153d] mb-4">Sobre o App</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Desenvolvido para facilitar a organização das escalas e repertório do Ministério de Louvor Manancial.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Versão</p>
              <p className="text-sm font-bold text-[#00153d]">2.0.0 (Supabase Realtime)</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

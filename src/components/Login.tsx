import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoaderCircle, Mail, Lock, User, ArrowRight, Music, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        });
        if (signUpError) throw signUpError;
        alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta (se aplicável).');
        setIsLogin(true);
        setIsLoading(false);
        return;
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#00153d] p-6 relative overflow-hidden">
      {/* Background Decorative Elements - Water inspired */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-400 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-cyan-400 rounded-[50%_50%_20%_80%/50%_20%_80%_50%] blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500 rounded-full blur-[100px] opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/30">
          {/* Subtle reflection overlay */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              className="w-24 h-24 mb-6 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-2xl animate-pulse" />
              <img 
                src="/favicon.png" 
                alt="Logo Manancial" 
                className="w-full h-full object-contain rounded-[2rem] shadow-lg relative z-10 animate-float"
              />
            </motion.div>
            
            <h1 className="text-3xl font-headline font-extrabold text-white tracking-tight mb-2 drop-shadow-sm">
              Manancial Louvor
            </h1>
            <p className="text-white/70 font-medium tracking-wide">
              {isLogin ? 'Bem-vindo ao ministério' : 'Crie sua conta para participar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-medium text-white placeholder:text-white/30 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-medium text-white placeholder:text-white/30 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-medium text-white placeholder:text-white/30 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-400/20 border border-red-400/30 rounded-2xl text-red-200 text-sm font-medium flex items-center gap-3 backdrop-blur-md"
              >
                <ShieldCheck size={18} className="shrink-0 text-red-400" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-[#00153d] rounded-2xl py-4 font-bold shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="tracking-tight">{isLogin ? 'Entrar no App' : 'Criar minha conta'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-white/60 font-bold hover:text-white transition-colors text-sm"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
          Manancial Louvor &bull; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}


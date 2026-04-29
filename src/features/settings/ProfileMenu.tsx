import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Users, 
  ChevronRight,
  ShieldCheck,
  Music,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { BackButton } from '../../components/BackButton';

export default function ProfileMenu({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'team',
      title: 'Minha Equipe de Louvor',
      description: 'Veja todos os integrantes do ministério e suas funções.',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      path: '/app/team'
    },
    {
      id: 'settings',
      title: 'Meu Perfil',
      description: 'Gerencie suas informações pessoais, e-mail e senha.',
      icon: User,
      color: 'bg-purple-50 text-purple-600',
      path: '/app/settings'
    }
  ];

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
            Meu Perfil
          </h2>
          <p className="text-slate-500 font-medium text-lg">
            Acesse as informações da equipe ou gerencie sua conta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="group relative bg-white rounded-[2.5rem] p-8 text-left apple-shadow border border-white hover:border-blue-100 transition-all duration-500 active:scale-[0.98] overflow-hidden"
          >
            {/* Decorative background shape */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${item.color.split(' ')[0]}`} />
            
            <div className="flex flex-col h-full space-y-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <item.icon size={28} />
              </div>
              
              <div className="space-y-2 flex-1">
                <h3 className="text-2xl font-headline font-bold text-[#00153d] group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center text-blue-600 font-bold text-sm uppercase tracking-widest gap-2">
                Acessar agora
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Extra info card */}
      <div className="bg-[#00153d] rounded-[2.5rem] p-8 md:p-10 apple-shadow text-white relative overflow-hidden mt-8">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-600 rounded-full blur-[80px] opacity-20" />
        <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-cyan-400 rounded-full blur-[60px] opacity-10" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-blue-300">
              <ShieldCheck size={12} />
              Ministério Manancial
            </div>
            <h4 className="text-3xl font-headline font-extrabold tracking-tight">
              A serviço do Reino através da música
            </h4>
            <p className="text-white/70 font-medium max-w-lg">
              "Servi ao Senhor com alegria e apresentai-vos a ele com cânticos." — Salmos 100:2
            </p>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center animate-float">
              <Heart className="text-blue-400 fill-blue-400" size={32} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

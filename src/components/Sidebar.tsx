import React from 'react';
import { 
  Music2, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  PlusCircle,
  Clock,
  PanelLeftClose,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

import { Profile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
  userProfile: Profile | null;
  isSidebarHidden: boolean;
  setIsSidebarHidden: (hidden: boolean) => void;
  showMobileNav?: boolean;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onSignOut, 
  userProfile, 
  isSidebarHidden, 
  setIsSidebarHidden,
  showMobileNav = true
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'new-songs', label: 'Novidades', icon: Sparkles },
    { id: 'repertoire', label: 'Repertório', icon: Music2 },
    { id: 'schedule', label: 'Programação', icon: Calendar },
    { id: 'team', label: 'Equipe', icon: Users },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      {!isSidebarHidden && (
        <aside className="hidden md:flex w-72 h-[calc(100vh-2rem)] fixed left-4 top-4 glass rounded-[2.5rem] flex-col py-8 z-50 transition-all duration-500 overflow-hidden border border-white/40 shadow-2xl">
        <div className="px-8 mb-10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 min-w-[48px] rounded-2xl overflow-hidden shadow-lg border border-white/40 bg-white/50 p-1 hover:scale-110 transition-transform duration-500">
              <img 
                src="https://ugc.production.linktr.ee/d6970972-5f9a-4f2d-8125-7a8cf7df28cc_IMG-0954.jpeg?io=true&size=avatar-v3_0" 
                alt="Logo Manancial"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="transition-all duration-500 whitespace-nowrap">
              <h1 className="font-headline font-extrabold text-[#00153d] leading-tight text-xl tracking-tight">
                Manancial
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600/60 font-black">
                Louvor & Adoração
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 transition-all duration-300">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-[#00153d] text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-500 hover:bg-blue-500/10 hover:text-blue-700'
              }`}
            >
              <item.icon size={22} className={`min-w-[22px] transition-transform duration-300 group-hover/item:scale-110 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover/item:text-blue-600'}`} />
              <span className="text-sm font-bold transition-opacity duration-300 whitespace-nowrap uppercase tracking-widest">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="px-6 mt-auto space-y-2 transition-all duration-300">
          <div className="mb-6 p-4 rounded-2xl bg-white/40 border border-white/60 transition-all duration-500">
            <div className="flex items-center gap-3">
              <img 
                src={userProfile?.avatar_url || "https://ugc.production.linktr.ee/d6970972-5f9a-4f2d-8125-7a8cf7df28cc_IMG-0954.jpeg?io=true&size=avatar-v3_0"} 
                className="w-10 h-10 rounded-xl object-cover border-2 border-white"
                alt="Profile"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#00153d] truncate">{userProfile?.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {userProfile?.role === 'minister' ? 'Ministro' : userProfile?.role === 'pastor' ? 'Pastor' : 'Músico'}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-4 px-4 py-3 transition-all rounded-2xl group/btn ${
              activeTab === 'settings' ? 'bg-blue-100 text-blue-900 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-blue-600'
            }`}
          >
            <Settings size={20} className="min-w-[20px] transition-transform group-hover/btn:rotate-45" />
            <span className="text-sm font-bold transition-opacity duration-300 whitespace-nowrap uppercase tracking-widest">Ajustes</span>
          </button>
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl group/btn"
          >
            <LogOut size={20} className="min-w-[20px] transition-transform group-hover/btn:translate-x-1" />
            <span className="text-sm font-bold transition-opacity duration-300 whitespace-nowrap uppercase tracking-widest">Sair</span>
          </button>
          <button 
            onClick={() => setIsSidebarHidden(true)}
            className="w-full flex items-center gap-4 px-4 py-3 mt-4 text-slate-400 hover:text-blue-600 transition-all border-t border-black/5 pt-6"
          >
            <PanelLeftClose size={20} className="min-w-[20px]" />
            <span className="text-sm font-bold transition-opacity duration-300 whitespace-nowrap uppercase tracking-widest">Recolher</span>
          </button>
        </div>
      </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 h-20 glass rounded-[2rem] flex items-center justify-around px-4 z-[100] border border-white/50 shadow-2xl">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
                activeTab === item.id ? 'text-[#00153d]' : 'text-slate-400'
              }`}
            >
              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-[#00153d] text-white shadow-lg scale-110' : 'hover:bg-white/50'}`}>
                <item.icon size={22} />
              </div>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute -top-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
              )}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === 'settings' ? 'text-[#00153d]' : 'text-slate-400'
            }`}
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-[#00153d] text-white shadow-lg scale-110' : 'hover:bg-white/50'}`}>
              <Settings size={22} />
            </div>
          </button>
        </nav>
      )}
    </>
  );
}


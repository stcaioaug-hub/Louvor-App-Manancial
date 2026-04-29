import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut,
  PanelLeftClose,
  TrendingUp,
  Sparkles,
  LayoutDashboard,
  Music2,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

import { Profile } from '../types';

/* ─── Mobile nav button helper ─────────────────────────────── */
function MobileNavBtn({
  id,
  label,
  activeTab,
  onClick,
  children,
}: {
  id: string;
  label: string;
  activeTab: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
        isActive ? 'text-[#00153d]' : 'text-slate-400'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="activeTabMobile"
          className="absolute -top-2.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)]"
        />
      )}
      <div
        className={`p-2.5 rounded-2xl transition-all duration-300 ${
          isActive
            ? 'bg-[#00153d] text-white shadow-lg scale-110'
            : 'hover:bg-white/50'
        }`}
      >
        {children}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${
        isActive ? 'opacity-100 text-[#00153d]' : 'opacity-60'
      }`}>
        {label}
      </span>
    </button>
  );
}

interface SidebarProps {
  onSignOut: () => void;
  userProfile: Profile | null;
  isSidebarHidden: boolean;
  setIsSidebarHidden: (hidden: boolean) => void;
  showMobileNav?: boolean;
}

export default function Sidebar({ 
  onSignOut, 
  userProfile, 
  isSidebarHidden, 
  setIsSidebarHidden,
  showMobileNav = true
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/').pop() || 'dashboard';
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'study', label: 'Estudo', icon: BookOpen },
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
              onClick={() => navigate(`/app/${item.id}`)}
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
            onClick={() => navigate('/app/settings')}
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
        <nav className="md:hidden fixed bottom-4 left-4 right-4 z-[100]">
          {/* Main bar */}
          <div className="h-20 glass rounded-[2rem] flex items-center px-2 border border-white/50 shadow-2xl relative">
            {/* Left side: Perfil + Calendário */}
            <div className="flex items-center justify-around flex-1">
              {/* Perfil */}
              <MobileNavBtn
                id="profile"
                label="Perfil"
                activeTab={activeTab}
                onClick={() => navigate('/app/profile')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </MobileNavBtn>

              {/* Calendário */}
              <MobileNavBtn
                id="schedule"
                label="Agenda"
                activeTab={activeTab}
                onClick={() => navigate('/app/schedule')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </MobileNavBtn>
            </div>

            {/* Central button spacer */}
            <div className="w-20 flex-shrink-0" />

            {/* Right side: Repertório + Insights */}
            <div className="flex items-center justify-around flex-1">
              {/* Repertório */}
              <MobileNavBtn
                id="repertoire"
                label="Repertório"
                activeTab={activeTab}
                onClick={() => navigate('/app/repertoire')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </MobileNavBtn>

              {/* Insights (Novidades) */}
              <MobileNavBtn
                id="new-songs"
                label="Novidades"
                activeTab={activeTab}
                onClick={() => navigate('/app/new-songs')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 3l1.912 5.886L20.243 9l-4.714 4.5 1.112 6.186L12 17l-4.64 2.686 1.112-6.186L3.757 9l6.331-.114L12 3z"/>
                  <path d="M5 3L6 5M19 3L18 5M5 21L6 19M19 21L18 19" strokeOpacity="0.5"/>
                </svg>
              </MobileNavBtn>
            </div>
          </div>

          {/* Central floating button */}
          <button
            onClick={() => navigate('/app/dashboard')}
            className="absolute left-1/2 -translate-x-1/2 -top-6 z-10 group"
            aria-label="Início"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{animationDuration:'2.4s'}} />
            {/* Outer glow ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-300/40 to-blue-600/30 blur-sm" />
            {/* Button body */}
            <span className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl shadow-blue-900/40
              bg-gradient-to-br from-[#1a4ab5] via-[#0d2e7a] to-[#00153d]
              border-2 border-white/30
              group-hover:scale-110 group-active:scale-95
              transition-transform duration-200"
            >
              {/* Manancial SVG logo mark: water droplets + music note */}
              <svg width="34" height="34" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Water ripple base */}
                <ellipse cx="40" cy="58" rx="22" ry="6" fill="rgba(147,210,255,0.25)" />
                <ellipse cx="40" cy="58" rx="14" ry="3.5" fill="rgba(147,210,255,0.35)" />
                {/* Music note stem */}
                <rect x="38" y="22" width="5" height="28" rx="2.5" fill="white" />
                {/* Music note head */}
                <ellipse cx="35.5" cy="52" rx="7" ry="5.5" fill="white" transform="rotate(-12 35.5 52)" />
                {/* Music note flag */}
                <path d="M43 22 C52 26, 54 34, 48 38" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* Water splash left */}
                <path d="M24 48 Q20 38 26 30" stroke="rgba(147,210,255,0.8)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                {/* Water splash right */}
                <path d="M56 48 Q60 36 54 28" stroke="rgba(147,210,255,0.8)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                {/* Droplet left top */}
                <circle cx="23" cy="27" r="3.5" fill="rgba(147,210,255,0.9)"/>
                {/* Droplet right top */}
                <circle cx="57" cy="25" r="3" fill="rgba(147,210,255,0.9)"/>
              </svg>
            </span>
          </button>
        </nav>
      )}
    </>
  );
}


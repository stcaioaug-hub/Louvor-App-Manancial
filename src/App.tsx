import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, LoaderCircle, PlusCircle, RefreshCcw, Settings as SettingsIcon, PanelLeft, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { BackButton } from './components/BackButton';
import Sidebar from './components/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import SongList from './features/songs/SongList';
import SongDetail from './features/songs/SongDetail';
import Schedule from './features/events/Schedule';
import EventDetail from './features/events/EventDetail';
import TeamList from './features/team/TeamList';
import Login from './features/auth/Login';
import Settings from './features/settings/Settings';
import Insights from './features/insights/Insights';
import { OnboardingWizard } from './features/auth/OnboardingWizard';
import NewSongs from './features/songs/NewSongs';
import { supabase } from './lib/supabase';
import { getProfile, signOut } from './lib/auth';
import {
  appDataSorters,
  createSong,
  createTeamMember,
  deleteSong,
  deleteTeamMember,
  fetchAppData,
  getAppMode,
  getAppModeMessage,
  seedInitialData,
  subscribeToAppData,
  unsubscribeFromAppData,
  updateEvent,
  createEvent,
  deleteEvent,
  updateSong,
  updateTeamMember,
  createRehearsalReport,
} from './lib/appData';
import { Song, TeamMember, WorshipEvent, Profile, RehearsalReport } from './types';
import { User } from '@supabase/supabase-js';

// Polyfill for useEffectEvent (experimental in React 19)
function useEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: any[]) => {
    return ref.current(...args);
  }, []) as T;
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel sincronizar os dados com o Supabase.';
}

export default function App() {
  const appMode = getAppMode();
  const appModeMessage = getAppModeMessage();
  const isLocalMode = appMode === 'local';
  
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailView = location.pathname.split('/').length > 3; // ex: /app/events/123

  const [songs, setSongs] = useState<Song[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<WorshipEvent[]>([]);
  const [rehearsalReports, setRehearsalReports] = useState<RehearsalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const seededRef = useRef(false);
  const localProfile = useMemo<Profile>(
    () => ({
      id: 'local-user',
      name: 'Modo Local',
      role: 'minister',
      onboarding_completed: true,
      functional_role: 'minister',
    }),
    []
  );

  const applyAppData = useEvent((data: {
    songs: Song[];
    team: TeamMember[];
    events: WorshipEvent[];
    rehearsalReports: RehearsalReport[];
  }) => {
    startTransition(() => {
      setSongs(data.songs);
      setTeam(data.team);
      setEvents(data.events);
      setRehearsalReports(data.rehearsalReports || []);
    });
  });

  const loadData = useEvent(
    async ({ withLoading = false, allowSeed = false }: { withLoading?: boolean; allowSeed?: boolean } = {}) => {
      try {
        if (withLoading) {
          setIsLoading(true);
        }

        setErrorMessage(null);

        let data = await fetchAppData();

        if (
          allowSeed &&
          !seededRef.current &&
          data.songs.length === 0 &&
          data.team.length === 0 &&
          data.events.length === 0
        ) {
          seededRef.current = true;
          data = await seedInitialData();
        }

        applyAppData(data);
      } catch (error) {
        setErrorMessage(formatErrorMessage(error));
      } finally {
        if (withLoading) {
          setIsLoading(false);
        }
      }
    }
  );

  // Auth Effect
  useEffect(() => {
    if (isLocalMode) {
      setUser(null);
      setProfile(localProfile);
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      try {
        setIsAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await getProfile(session.user.id);

          if (!isMounted) {
            return;
          }

          setProfile(userProfile);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setProfile(null);
        setErrorMessage(formatErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!isMounted) {
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await getProfile(session.user.id);

          if (!isMounted) {
            return;
          }

          setProfile(userProfile);
          if (_event === 'SIGNED_IN') {
            void loadData({ withLoading: true });
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(formatErrorMessage(error));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isLocalMode, loadData, localProfile]);

  useEffect(() => {
    void loadData({ withLoading: true, allowSeed: true });

    const channel = subscribeToAppData(() => {
      void loadData();
    });

    return () => {
      unsubscribeFromAppData(channel);
    };
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isLocalMode) {
      if (!user && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      } else if (user && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      } else if (user && profile?.onboarding_completed && (location.pathname === '/login' || location.pathname === '/onboarding' || location.pathname === '/')) {
        navigate('/app/dashboard', { replace: true });
      }
    }
  }, [user, profile, isAuthLoading, isLocalMode, location.pathname, navigate]);

  const handleCreateSong = async (song: Omit<Song, 'id'>) => {
    try {
      setErrorMessage(null);
      const createdSong = await createSong(song);
      setSongs((previous) => appDataSorters.songs([...previous, createdSong]));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleUpdateSong = async (song: Song) => {
    try {
      setErrorMessage(null);
      const updatedSong = await updateSong(song);
      setSongs((previous) =>
        appDataSorters.songs(previous.map((currentSong) => (currentSong.id === updatedSong.id ? updatedSong : currentSong)))
      );
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      setErrorMessage(null);
      await deleteSong(id);
      setSongs((previous) => previous.filter((song) => song.id !== id));
      setEvents((previous) =>
        previous.map((event) => ({
          ...event,
          songs: event.songs.filter((songId) => songId !== id),
          outroSongs: (event.outroSongs ?? []).filter((songId) => songId !== id),
        }))
      );
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleCreateMember = async (member: Omit<TeamMember, 'id'>) => {
    try {
      setErrorMessage(null);
      const createdMember = await createTeamMember(member);
      setTeam((previous) => appDataSorters.team([...previous, createdMember]));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleUpdateMember = async (member: TeamMember) => {
    try {
      setErrorMessage(null);
      const updatedMember = await updateTeamMember(member);
      setTeam((previous) =>
        appDataSorters.team(previous.map((currentMember) => (currentMember.id === updatedMember.id ? updatedMember : currentMember)))
      );
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      setErrorMessage(null);
      const memberToRemove = team.find((member) => member.id === id);

      if (!memberToRemove) {
        return;
      }

      const updatedEvents = await Promise.all(
        events.map(async (event) => {
          const isAssigned =
            event.team.vocal.includes(memberToRemove.name) ||
            Object.values(event.team.instruments).includes(memberToRemove.name);

          if (!isAssigned) {
            return event;
          }

          const nextEvent: WorshipEvent = {
            ...event,
            attendance: Object.fromEntries(
              Object.entries(event.attendance || {}).filter(([key]) => key !== memberToRemove.name)
            ),
            team: {
              vocal: event.team.vocal.filter((name) => name !== memberToRemove.name),
              instruments: Object.fromEntries(
                Object.entries(event.team.instruments).filter(([, name]) => name !== memberToRemove.name)
              ),
            },
          };

          return updateEvent(nextEvent);
        })
      );

      await deleteTeamMember(id);
      setTeam((previous) => previous.filter((member) => member.id !== id));
      setEvents(appDataSorters.events(updatedEvents));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleUpdateEvent = async (event: WorshipEvent) => {
    try {
      setErrorMessage(null);
      const updatedEvent = await updateEvent(event);
      setEvents((previous) =>
        appDataSorters.events(previous.map((currentEvent) => (currentEvent.id === updatedEvent.id ? updatedEvent : currentEvent)))
      );
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleCreateEvent = async (event: Omit<WorshipEvent, 'id'>) => {
    try {
      setErrorMessage(null);
      const createdEvent = await createEvent(event);
      setEvents((previous) => appDataSorters.events([...previous, createdEvent]));
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleCreateRehearsalReport = async (report: Omit<RehearsalReport, 'id'>) => {
    try {
      setErrorMessage(null);
      const createdReport = await createRehearsalReport(report);
      setRehearsalReports(prev => [createdReport, ...prev]);
      
      // Reload app data to update song rehearsal counts
      void loadData();
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      setErrorMessage(null);
      await deleteEvent(id);
      setEvents((previous) => previous.filter((event) => event.id !== id));
      navigate('/app/events');
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const effectiveProfile = profile ?? (isLocalMode ? localProfile : null);
  const isMinister = isLocalMode || effectiveProfile?.role === 'minister' || effectiveProfile?.role === 'pastor';

  const EventDetailRoute = () => {
    const { eventId } = useParams();
    const event = useMemo(() => events.find(e => e.id === eventId) ?? null, [events, eventId]);
    if (!event) return <Navigate to="/app/events" replace />;
    
    return (
      <EventDetail
        event={event}
        events={events}
        songs={songs}
        team={team}
        onBack={() => navigate('/app/schedule')}
        onUpdate={handleUpdateEvent}
        onUpdateSong={handleUpdateSong}
        onSelectSong={(id) => navigate(`/app/repertoire/${id}`)}
        onSelectEvent={(id) => navigate(`/app/events/${id}`)}
        canEdit={isMinister}
        userProfile={effectiveProfile}
        isSidebarHidden={isSidebarHidden}
      />
    );
  };

  const SongDetailRoute = () => {
    const { songId } = useParams();
    const song = useMemo(() => songs.find(s => s.id === songId) ?? null, [songs, songId]);
    if (!song) return <Navigate to="/app/repertoire" replace />;
    
    return (
      <SongDetail
        song={song}
        events={events}
        onBack={() => navigate(-1)}
        onUpdateSong={handleUpdateSong}
        canEdit={isMinister}
      />
    );
  };

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        
        <Route path="/login" element={<Login onLogin={() => void loadData({ withLoading: true })} />} />
        <Route path="/onboarding" element={profile ? <OnboardingWizard profile={profile} onComplete={setProfile} /> : <Navigate to="/login" replace />} />
        
        <Route path="/app/dashboard" element={
          <Dashboard
            setActiveTab={(id) => navigate(`/app/${id}`)}
            songs={songs}
            team={team}
            events={events}
            rehearsalReports={rehearsalReports}
            onSelectEvent={(id) => navigate(`/app/events/${id}`)}
            onSelectSong={(id) => navigate(`/app/repertoire/${id}`)}
            onCreateRehearsalReport={handleCreateRehearsalReport}
            userProfile={effectiveProfile}
          />
        } />
        
        <Route path="/app/repertoire" element={
          <SongList
            songs={songs}
            events={events}
            onCreateSong={handleCreateSong}
            onUpdateSong={handleUpdateSong}
            onDeleteSong={handleDeleteSong}
            onSelectSong={(id) => navigate(`/app/repertoire/${id}`)}
            canEdit={isMinister}
            onBack={() => navigate('/app/dashboard')}
          />
        } />
        
        <Route path="/app/repertoire/:songId" element={<SongDetailRoute />} />
        
        <Route path="/app/schedule" element={
          <Schedule 
            events={events} 
            songs={songs} 
            onSelectEvent={(id) => navigate(`/app/events/${id}`)}
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            canEdit={isMinister}
            onBack={() => navigate('/app/dashboard')}
          />
        } />
        
        <Route path="/app/events/:eventId" element={<EventDetailRoute />} />
        
        <Route path="/app/team" element={
          <TeamList
            team={team}
            onCreateMember={handleCreateMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            canEdit={isMinister}
            onBack={() => navigate('/app/dashboard')}
          />
        } />
        
        <Route path="/app/new-songs" element={
          <NewSongs
            songs={songs}
            events={events}
            onSelectSong={(id) => navigate(`/app/repertoire/${id}`)}
            onBack={() => navigate('/app/dashboard')}
          />
        } />
        
        <Route path="/app/insights" element={
          <Insights
            songs={songs}
            team={team}
            events={events}
            onBack={() => navigate('/app/dashboard')}
          />
        } />
        
        <Route path="/app/settings" element={
          <Settings 
            profile={effectiveProfile} 
            email={user?.email} 
            onUpdateProfile={setProfile} 
            onBack={() => navigate('/app/dashboard')}
            onSignOut={signOut}
          />
        } />
        
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fc]">
        <LoaderCircle size={48} className="animate-spin text-[#00153d]" />
      </div>
    );
  }

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/onboarding';

  return (
    <div className="min-h-screen manancial-gradient relative overflow-x-hidden">
      {/* Background Decorative Ripples */}
      <div className="fixed top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600 rounded-full blur-[150px]" />
      </div>

      {!isAuthRoute && (
        <Sidebar 
          onSignOut={signOut}
          userProfile={effectiveProfile}
          isSidebarHidden={isSidebarHidden}
          setIsSidebarHidden={setIsSidebarHidden}
          showMobileNav={!isDetailView}
        />
      )}

      {isSidebarHidden && !isAuthRoute && (
        <button 
          onClick={() => setIsSidebarHidden(false)}
          className="fixed left-4 top-1/2 -translate-y-1/2 glass p-4 rounded-3xl shadow-2xl text-blue-600 hover:pl-8 transition-all z-50 md:flex hidden group border border-white/40 active:scale-95"
          title="Mostrar Menu"
        >
          <PanelLeft size={24} className="group-hover:scale-120 transition-transform" />
        </button>
      )}

      <main className={`relative z-10 transition-all duration-500 ease-in-out ${isAuthRoute ? 'w-full' : isSidebarHidden ? 'p-6 md:p-12 w-full max-w-[1600px] mx-auto pb-40 md:pb-12' : 'md:pl-80 p-6 md:p-12 max-w-7xl mx-auto pb-40 md:pb-12'}`}>
        {appMode === 'local' && (
          <div className="mb-8 flex flex-col gap-4 rounded-[2.5rem] glass border border-blue-200/50 px-8 py-6 text-blue-900 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-2xl bg-white/80 p-3 text-blue-600 shadow-sm">
                <SettingsIcon size={24} className="animate-spin-slow" style={{ animationDuration: '8s' }} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">Modo de Segurança</p>
                <p className="text-lg font-headline font-extrabold text-blue-950">{appModeMessage}</p>
                <p className="text-sm text-blue-800/80 leading-relaxed max-w-2xl">
                  Estamos operando com dados locais. Preencha seu <code className="bg-white/50 px-2 py-0.5 rounded-lg border border-white/50 font-mono text-[11px]">.env.local</code> para sincronizar em tempo real com o Supabase.
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-8 flex flex-col gap-6 rounded-[2.5rem] bg-red-500/5 backdrop-blur-xl border border-red-200/30 px-8 py-7 text-red-900 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
            <div className="flex items-start gap-4 relative">
              <div className="mt-0.5 rounded-2xl bg-white p-3 text-red-600 shadow-sm border border-red-100">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60">Erro de Conexão</p>
                <p className="text-lg font-headline font-extrabold text-red-950">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => void loadData({ withLoading: true })}
              className="inline-flex w-full md:w-auto items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 font-bold text-red-700 shadow-md hover:bg-red-50 hover:shadow-lg transition-all active:scale-[0.98] relative overflow-hidden"
            >
              <RefreshCcw size={18} className="animate-spin-slow" />
              Reconectar Agora
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="glass rounded-[4rem] px-12 py-16 shadow-2xl flex flex-col items-center gap-8 text-center max-w-md border border-white/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="w-20 h-20 rounded-[2.5rem] bg-[#00153d] text-white flex items-center justify-center shadow-2xl animate-float relative z-10 p-4">
                <img src="/favicon.png" alt="Loading" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-3 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600/60">Sistema Manancial</p>
                <h2 className="text-3xl font-headline font-extrabold text-[#00153d] tracking-tight">Sincronizando...</h2>
                <p className="text-slate-500 font-medium leading-relaxed">Carregando o manancial de louvor para você.</p>
              </div>
              {/* Subtle loading bar */}
              <div className="w-48 h-1 bg-blue-100 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  className="h-full bg-blue-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        )}
      </main>

    </div>
  );
}

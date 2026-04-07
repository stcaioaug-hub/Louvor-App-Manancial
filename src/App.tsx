import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, LoaderCircle, PlusCircle, RefreshCcw, Settings as SettingsIcon, PanelLeft, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { BackButton } from './components/BackButton';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SongList from './components/SongList';
import SongDetail from './components/SongDetail';
import Schedule from './components/Schedule';
import EventDetail from './components/EventDetail';
import TeamList from './components/TeamList';
import Login from './components/Login';
import Settings from './components/Settings';
import Insights from './components/Insights';
import { OnboardingWizard } from './components/OnboardingWizard';
import NewSongs from './components/NewSongs';
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
} from './lib/appData';
import { Song, TeamMember, WorshipEvent, Profile } from './types';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<WorshipEvent[]>([]);
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
  }) => {
    startTransition(() => {
      setSongs(data.songs);
      setTeam(data.team);
      setEvents(data.events);
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

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const selectedSong = useMemo(
    () => songs.find((song) => song.id === selectedSongId) ?? null,
    [songs, selectedSongId]
  );

  useEffect(() => {
    if (selectedEventId && !selectedEvent) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, selectedEvent]);

  useEffect(() => {
    if (selectedSongId && !selectedSong) {
      setSelectedSongId(null);
    }
  }, [selectedSongId, selectedSong]);

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

  const handleDeleteEvent = async (id: string) => {
    try {
      setErrorMessage(null);
      await deleteEvent(id);
      setEvents((previous) => previous.filter((event) => event.id !== id));
      if (selectedEventId === id) {
        setSelectedEventId(null);
      }
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
      throw error;
    }
  };

  const effectiveProfile = profile ?? (isLocalMode ? localProfile : null);
  const isMinister = isLocalMode || effectiveProfile?.role === 'minister' || effectiveProfile?.role === 'pastor';

  const renderContent = () => {
    if (selectedEvent) {
      return (
        <EventDetail
          event={selectedEvent}
          events={events}
          songs={songs}
          team={team}
          onBack={() => setSelectedEventId(null)}
          onUpdate={handleUpdateEvent}
          onUpdateSong={handleUpdateSong}
          onSelectSong={setSelectedSongId}
          onSelectEvent={setSelectedEventId}
          onDeleteEvent={() => handleDeleteEvent(selectedEvent.id)}
          canEdit={isMinister}
          userProfile={effectiveProfile}
        />
      );
    }

    if (selectedSong) {
      return (
        <SongDetail
          song={selectedSong}
          events={events}
          onBack={() => setSelectedSongId(null)}
          onUpdateSong={handleUpdateSong}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            songs={songs}
            team={team}
            events={events}
            onSelectEvent={setSelectedEventId}
            onSelectSong={setSelectedSongId}
            userProfile={effectiveProfile}
          />
        );
      case 'repertoire':
        return (
          <SongList
            songs={songs}
            onCreateSong={handleCreateSong}
            onUpdateSong={handleUpdateSong}
            onDeleteSong={handleDeleteSong}
            onSelectSong={setSelectedSongId}
            canEdit={isMinister}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'schedule':
        return (
          <Schedule 
            events={events} 
            songs={songs} 
            onSelectEvent={setSelectedEventId} 
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            canEdit={isMinister}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'team':
        return (
          <TeamList
            team={team}
            onCreateMember={handleCreateMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            canEdit={isMinister}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'new-songs':
        return (
          <NewSongs
            songs={songs}
            events={events}
            onSelectSong={setSelectedSongId}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'insights':
        return (
          <Insights
            songs={songs}
            team={team}
            events={events}
            onBack={() => setActiveTab('dashboard')}
          />
        );
      case 'settings':
        return (
          <Settings 
            profile={effectiveProfile} 
            email={user?.email} 
            onUpdateProfile={setProfile} 
            onBack={() => setActiveTab('dashboard')}
          />
        );
      default:
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            songs={songs}
            team={team}
            events={events}
            onSelectEvent={setSelectedEventId}
            onSelectSong={setSelectedSongId}
            userProfile={effectiveProfile}
          />
        );
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fc]">
        <LoaderCircle size={48} className="animate-spin text-[#00153d]" />
      </div>
    );
  }

  if (!isLocalMode && !user) {
    return <Login onLogin={() => void loadData({ withLoading: true })} />;
  }

  if (!isLocalMode && profile && !profile.onboarding_completed) {
    return <OnboardingWizard profile={profile} onComplete={setProfile} />;
  }

  return (
    <div className="min-h-screen manancial-gradient relative overflow-x-hidden">
      {/* Background Decorative Ripples */}
      <div className="fixed top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600 rounded-full blur-[150px]" />
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSignOut={signOut}
        userProfile={effectiveProfile}
        isSidebarHidden={isSidebarHidden}
        setIsSidebarHidden={setIsSidebarHidden}
        showMobileNav={!selectedEvent && !selectedSong}
      />

      {isSidebarHidden && (
        <button 
          onClick={() => setIsSidebarHidden(false)}
          className="fixed left-4 top-1/2 -translate-y-1/2 glass p-4 rounded-3xl shadow-2xl text-blue-600 hover:pl-8 transition-all z-50 md:flex hidden group border border-white/40 active:scale-95"
          title="Mostrar Menu"
        >
          <PanelLeft size={24} className="group-hover:scale-120 transition-transform" />
        </button>
      )}

      <main className={`relative z-10 transition-all duration-500 ease-in-out ${isSidebarHidden ? 'p-6 md:p-12 w-full max-w-[1600px] mx-auto pb-40 md:pb-12' : 'md:pl-80 p-6 md:p-12 max-w-7xl mx-auto pb-40 md:pb-12'}`}>
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

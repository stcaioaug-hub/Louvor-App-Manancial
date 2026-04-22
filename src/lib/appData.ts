import { RealtimeChannel } from '@supabase/supabase-js';
import { Song, TeamMember, WorshipEvent, RehearsalReport } from '../types';
import { isConfigured, supabase, supabaseConfigMessage } from './supabase';
import { INITIAL_EVENTS, INITIAL_SONGS, INITIAL_TEAM } from './seedData';

type SongDraft = Omit<Song, 'id'>;
type TeamMemberDraft = Omit<TeamMember, 'id'>;
export type WorshipEventDraft = Omit<WorshipEvent, 'id'>;

interface SongRow {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string;
  proficiency: number | null;
  difficulty: number | null;
  is_favorite: boolean | null;
  tags: string[] | null;
  last_played: string | null;
  chords_url: string | null;
  lyrics_url: string | null;
  video_url: string | null;
  created_at: string | null;
  times_played: number | null;
  times_rehearsed: number | null;
}

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  category: string;
  avatar_url: string | null;
  is_leader: boolean | null;
}

interface WorshipEventRow {
  id: string;
  date: string;
  time: string;
  title: string;
  type: WorshipEvent['type'];
  location: string | null;
  description: string | null;
  team: unknown;
  attendance: unknown;
}

interface RehearsalReportRow {
  id: string;
  date: string;
  minister_id: string | null;
  event_id: string | null;
  songs_ids: string[];
  attendance: unknown;
  sentiment: string | null;
  observations: string | null;
  created_at: string | null;
}

interface EventSongRow {
  event_id: string;
  song_id: string;
  is_outro: boolean | null;
  is_offering: boolean | null;
  position: number;
}

interface AppData {
  songs: Song[];
  team: TeamMember[];
  events: WorshipEvent[];
  rehearsalReports: RehearsalReport[];
}

export type AppDataSubscription = RealtimeChannel | null;

function assertNoError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function cloneSong(song: Song): Song {
  return {
    ...song,
    tags: [...song.tags],
    links: { ...song.links },
  };
}

function cloneTeamMember(member: TeamMember): TeamMember {
  return { ...member };
}

function cloneEvent(event: WorshipEvent): WorshipEvent {
  return {
    ...event,
    songs: [...event.songs],
    offeringSongs: [...(event.offeringSongs ?? [])],
    outroSongs: [...(event.outroSongs ?? [])],
    team: {
      vocal: [...event.team.vocal],
      instruments: { ...event.team.instruments },
    },
    attendance: event.attendance ? { ...event.attendance } : undefined,
  };
}

function cloneAppData(data: AppData): AppData {
  return {
    songs: data.songs.map(cloneSong),
    team: data.team.map(cloneTeamMember),
    events: data.events.map(cloneEvent),
    rehearsalReports: [...(data.rehearsalReports || [])],
  };
}

function sortSongs(songs: Song[]) {
  return [...songs].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

function sortTeam(team: TeamMember[]) {
  return [...team].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function sortEvents(events: WorshipEvent[]) {
  return [...events].sort((a, b) => {
    const first = `${a.date}T${a.time}`;
    const second = `${b.date}T${b.time}`;
    return first.localeCompare(second);
  });
}

function normalizeTeam(value: unknown): WorshipEvent['team'] {
  if (!value || typeof value !== 'object') {
    return { vocal: [], instruments: {} };
  }

  const team = value as {
    vocal?: unknown;
    instruments?: unknown;
  };

  const vocal = Array.isArray(team.vocal)
    ? team.vocal.filter((name): name is string => typeof name === 'string')
    : [];

  const instruments =
    team.instruments && typeof team.instruments === 'object'
      ? Object.fromEntries(
          Object.entries(team.instruments as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string'
          )
        )
      : {};

  return { vocal, instruments };
}

function normalizeAttendance(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, boolean] => typeof entry[0] === 'string' && typeof entry[1] === 'boolean'
    )
  );
}

function mapSongRow(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    bpm: row.bpm ?? undefined,
    key: row.key,
    proficiency: row.proficiency ?? 0,
    difficulty: row.difficulty ?? 0,
    isFavorite: row.is_favorite ?? false,
    tags: row.tags ?? [],
    lastPlayed: row.last_played ?? undefined,
    links: {
      chords: row.chords_url ?? undefined,
      lyrics: row.lyrics_url ?? undefined,
      video: row.video_url ?? undefined,
    },
    timesPlayed: row.times_played ?? 0,
    timesRehearsed: row.times_rehearsed ?? 0,
    createdAt: row.created_at ?? undefined,
  };
}

function normalizeTime(value: string) {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    category: row.category,
    avatar: row.avatar_url ?? undefined,
    isLeader: row.is_leader ?? false,
  };
}

function mapSongToRow(song: Song | SongDraft) {
  return {
    title: song.title.trim(),
    artist: song.artist.trim(),
    bpm: song.bpm ?? null,
    key: song.key.trim(),
    proficiency: song.proficiency,
    difficulty: song.difficulty,
    is_favorite: song.isFavorite ?? false,
    tags: song.tags,
    last_played: song.lastPlayed ?? null,
    chords_url: song.links.chords?.trim() || null,
    lyrics_url: song.links.lyrics?.trim() || null,
    video_url: song.links.video?.trim() || null,
    times_played: song.timesPlayed ?? 0,
    times_rehearsed: song.timesRehearsed ?? 0,
  };
}

function mapTeamMemberToRow(member: TeamMember | TeamMemberDraft) {
  return {
    name: member.name.trim(),
    role: member.role.trim(),
    category: member.category.trim(),
    avatar_url: member.avatar?.trim() || null,
    is_leader: member.isLeader ?? false,
  };
}

function mapEventToRow(event: WorshipEvent) {
  return {
    date: event.date,
    time: normalizeTime(event.time),
    title: event.title.trim(),
    type: event.type,
    location: event.location?.trim() || null,
    description: event.description?.trim() || null,
    team: event.team,
    attendance: event.attendance ?? {},
  };
}

function buildEventSongsPayload(event: WorshipEvent) {
  const mainSongs = event.songs.map((songId, index) => ({
    event_id: event.id,
    song_id: songId,
    is_outro: false,
    is_offering: false,
    position: index,
  }));

  const offeringSongs = (event.offeringSongs ?? []).map((songId, index) => ({
    event_id: event.id,
    song_id: songId,
    is_outro: false,
    is_offering: true,
    position: mainSongs.length + index,
  }));

  const outroSongs = (event.outroSongs ?? []).map((songId, index) => ({
    event_id: event.id,
    song_id: songId,
    is_outro: true,
    is_offering: false,
    position: index,
  }));

  return [...mainSongs, ...offeringSongs, ...outroSongs];
}

function createInitialLocalData(): AppData {
  return {
    songs: sortSongs(INITIAL_SONGS.map(cloneSong)),
    team: sortTeam(INITIAL_TEAM.map(cloneTeamMember)),
    events: sortEvents(INITIAL_EVENTS.map(cloneEvent)),
    rehearsalReports: [],
  };
}

let localData = createInitialLocalData();

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAppMode() {
  return isConfigured ? 'supabase' : 'local';
}

export function getAppModeMessage() {
  return supabaseConfigMessage;
}

export async function fetchAppData(): Promise<AppData> {
  if (!isConfigured) {
    return cloneAppData(localData);
  }

  const [songsResult, teamResult, eventsResult, eventSongsResult, reportsResult] = await Promise.all([
    supabase.from('songs').select('*').order('title', { ascending: true }),
    supabase.from('team_members').select('*').order('name', { ascending: true }),
    supabase.from('worship_events').select('*').order('date', { ascending: true }).order('time', { ascending: true }),
    supabase.from('event_songs').select('event_id, song_id, is_outro, is_offering, position').order('position', { ascending: true }),
    supabase.from('rehearsal_reports').select('*').order('date', { ascending: false }),
  ]);

  assertNoError(songsResult.error);
  assertNoError(teamResult.error);
  assertNoError(eventsResult.error);
  assertNoError(eventSongsResult.error);

  const songs = sortSongs((songsResult.data ?? []).map((row) => mapSongRow(row as SongRow)));
  const team = sortTeam((teamResult.data ?? []).map((row) => mapTeamMemberRow(row as TeamMemberRow)));
  const eventSongsByEvent = new Map<string, { main: string[]; offering: string[]; outro: string[] }>();

  for (const row of (eventSongsResult.data ?? []) as EventSongRow[]) {
    const bucket = eventSongsByEvent.get(row.event_id) ?? { main: [], offering: [], outro: [] };

    if (row.is_outro) {
      bucket.outro.push(row.song_id);
    } else if (row.is_offering) {
      bucket.offering.push(row.song_id);
    } else {
      bucket.main.push(row.song_id);
    }

    eventSongsByEvent.set(row.event_id, bucket);
  }

  const events = sortEvents(
    ((eventsResult.data ?? []) as WorshipEventRow[]).map((row) => {
      const linkedSongs = eventSongsByEvent.get(row.id) ?? { main: [], offering: [], outro: [] };

      return {
        id: row.id,
        date: row.date,
        time: normalizeTime(row.time),
        title: row.title,
        type: row.type,
        location: row.location ?? undefined,
        description: row.description ?? undefined,
        songs: linkedSongs.main,
        offeringSongs: linkedSongs.offering,
        outroSongs: linkedSongs.outro,
        team: normalizeTeam(row.team),
        attendance: normalizeAttendance(row.attendance),
      };
    })
  );

  const rehearsalReports = (reportsResult.data ?? []).map((row: RehearsalReportRow) => ({
    id: row.id,
    date: row.date,
    minister_id: row.minister_id ?? undefined,
    event_id: row.event_id ?? undefined,
    songs_ids: row.songs_ids,
    attendance: normalizeAttendance(row.attendance),
    sentiment: row.sentiment ?? '',
    observations: row.observations ?? '',
    created_at: row.created_at ?? undefined,
  }));

  return { songs, team, events, rehearsalReports };
}

export async function createSong(song: SongDraft): Promise<Song> {
  if (!isConfigured) {
    const createdSong: Song = {
      id: createLocalId('song'),
      title: song.title,
      artist: song.artist,
      bpm: song.bpm,
      key: song.key,
      proficiency: song.proficiency,
      difficulty: song.difficulty,
      isFavorite: song.isFavorite,
      tags: [...song.tags],
      lastPlayed: song.lastPlayed,
      links: { ...song.links },
    };

    localData = {
      ...localData,
      songs: sortSongs([...localData.songs, createdSong]),
    };

    return cloneSong(createdSong);
  }

  const result = await supabase.from('songs').insert(mapSongToRow(song)).select('*').single();
  assertNoError(result.error);
  return mapSongRow(result.data as SongRow);
}

export async function updateSong(song: Song): Promise<Song> {
  if (!isConfigured) {
    const updatedSong = cloneSong(song);

    localData = {
      ...localData,
      songs: sortSongs(localData.songs.map((currentSong) => (currentSong.id === song.id ? updatedSong : currentSong))),
    };

    return updatedSong;
  }

  const result = await supabase.from('songs').update(mapSongToRow(song)).eq('id', song.id).select('*').single();
  assertNoError(result.error);
  return mapSongRow(result.data as SongRow);
}

export async function deleteSong(id: string): Promise<void> {
  if (!isConfigured) {
    localData = {
      ...localData,
      songs: localData.songs.filter((song) => song.id !== id),
      events: localData.events.map((event) => ({
        ...event,
        songs: event.songs.filter((songId) => songId !== id),
        offeringSongs: (event.offeringSongs ?? []).filter((songId) => songId !== id),
        outroSongs: (event.outroSongs ?? []).filter((songId) => songId !== id),
      })),
    };

    return;
  }

  // Remove references in event_songs first because of ON DELETE RESTRICT
  const junctionResult = await supabase.from('event_songs').delete().eq('song_id', id);
  assertNoError(junctionResult.error);

  const result = await supabase.from('songs').delete().eq('id', id);
  assertNoError(result.error);
}

export async function createTeamMember(member: TeamMemberDraft): Promise<TeamMember> {
  if (!isConfigured) {
    const createdMember: TeamMember = {
      id: createLocalId('member'),
      name: member.name,
      role: member.role,
      category: member.category,
      avatar: member.avatar,
      isLeader: member.isLeader,
    };

    localData = {
      ...localData,
      team: sortTeam([...localData.team, createdMember]),
    };

    return cloneTeamMember(createdMember);
  }

  const result = await supabase.from('team_members').insert(mapTeamMemberToRow(member)).select('*').single();
  assertNoError(result.error);
  return mapTeamMemberRow(result.data as TeamMemberRow);
}

export async function updateTeamMember(member: TeamMember): Promise<TeamMember> {
  if (!isConfigured) {
    const updatedMember = cloneTeamMember(member);

    localData = {
      ...localData,
      team: sortTeam(localData.team.map((currentMember) => (currentMember.id === member.id ? updatedMember : currentMember))),
    };

    return updatedMember;
  }

  const result = await supabase
    .from('team_members')
    .update(mapTeamMemberToRow(member))
    .eq('id', member.id)
    .select('*')
    .single();
  assertNoError(result.error);
  return mapTeamMemberRow(result.data as TeamMemberRow);
}

export async function deleteTeamMember(id: string): Promise<void> {
  if (!isConfigured) {
    localData = {
      ...localData,
      team: localData.team.filter((member) => member.id !== id),
    };

    return;
  }

  const result = await supabase.from('team_members').delete().eq('id', id);
  assertNoError(result.error);
}

export async function createEvent(event: WorshipEventDraft): Promise<WorshipEvent> {
  if (!isConfigured) {
    const createdEvent: WorshipEvent = {
      id: createLocalId('event'),
      ...cloneEvent(event as WorshipEvent),
    };
    createdEvent.id = createLocalId('event'); // safety

    localData = {
      ...localData,
      events: sortEvents([...localData.events, createdEvent]),
    };

    return cloneEvent(createdEvent);
  }

  // Insert event
  const { data: insertedData, error: eventError } = await supabase
    .from('worship_events')
    .insert(mapEventToRow(event as WorshipEvent))
    .select()
    .single();

  if (eventError) {
    console.error('Error creating event:', eventError);
    throw eventError;
  }

  const createdId = (insertedData as WorshipEventRow).id;

  // Final event object to return
  const createdEvent: WorshipEvent = {
    ...event,
    id: createdId,
  };

  // Insert songs associations
  const payload = buildEventSongsPayload(createdEvent);
  if (payload.length > 0) {
    const { error: songsError } = await supabase.from('event_songs').insert(payload);
    if (songsError) {
      console.error('Error inserting event songs:', songsError);
      // We don't throw here to ensure the event stays created, 
      // but the user might need to know.
    }
  }

  return createdEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isConfigured) {
    localData = {
      ...localData,
      events: localData.events.filter((event) => event.id !== id),
    };
    return;
  }

  const junctionResult = await supabase.from('event_songs').delete().eq('event_id', id);
  assertNoError(junctionResult.error);

  const result = await supabase.from('worship_events').delete().eq('id', id);
  assertNoError(result.error);
}

export async function updateEvent(event: WorshipEvent): Promise<WorshipEvent> {
  if (!isConfigured) {
    const updatedEvent = cloneEvent(event);

    localData = {
      ...localData,
      events: sortEvents(localData.events.map((currentEvent) => (currentEvent.id === event.id ? updatedEvent : currentEvent))),
    };

    return updatedEvent;
  }

  const eventResult = await supabase
    .from('worship_events')
    .update(mapEventToRow(event))
    .eq('id', event.id)
    .select('*')
    .single();
  assertNoError(eventResult.error);

  const deleteResult = await supabase.from('event_songs').delete().eq('event_id', event.id);
  assertNoError(deleteResult.error);

  const payload = buildEventSongsPayload(event);
  if (payload.length > 0) {
    const insertResult = await supabase.from('event_songs').insert(payload);
    assertNoError(insertResult.error);
  }

  return {
    id: event.id,
    date: event.date,
    time: normalizeTime(event.time),
    title: event.title,
    type: event.type,
    location: event.location,
    description: event.description,
    songs: [...event.songs],
    offeringSongs: [...(event.offeringSongs ?? [])],
    outroSongs: [...(event.outroSongs ?? [])],
    team: normalizeTeam(event.team),
    attendance: normalizeAttendance(event.attendance),
  };
}

export async function createRehearsalReport(report: Omit<RehearsalReport, 'id'>): Promise<RehearsalReport> {
  if (!isConfigured) {
    const createdReport: RehearsalReport = {
      id: createLocalId('report'),
      ...report,
    };
    localData = {
      ...localData,
      rehearsalReports: [createdReport, ...localData.rehearsalReports],
    };
    return createdReport;
  }

  // Note: Song counters (times_rehearsed) are updated via a DB trigger on rehearsal_reports.

  const result = await supabase
    .from('rehearsal_reports')
    .insert({
      date: report.date,
      minister_id: report.minister_id || null,
      event_id: report.event_id || null,
      songs_ids: report.songs_ids,
      attendance: report.attendance,
      sentiment: report.sentiment,
      observations: report.observations,
    })
    .select('*')
    .single();

  assertNoError(result.error);
  const row = result.data as RehearsalReportRow;
  return {
    id: row.id,
    date: row.date,
    minister_id: row.minister_id ?? undefined,
    event_id: row.event_id ?? undefined,
    songs_ids: row.songs_ids,
    attendance: normalizeAttendance(row.attendance),
    sentiment: row.sentiment ?? '',
    observations: row.observations ?? '',
    created_at: row.created_at ?? undefined,
  };
}

export function subscribeToAppData(onChange: () => void): AppDataSubscription {
  if (!isConfigured) {
    void onChange;
    return null;
  }

  return supabase
    .channel('app-data-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'worship_events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'event_songs' }, onChange)
    .subscribe();
}

export function unsubscribeFromAppData(channel: AppDataSubscription) {
  if (!channel) {
    return;
  }

  void supabase.removeChannel(channel);
}

export async function seedInitialData() {
  if (!isConfigured) {
    localData = createInitialLocalData();
    return cloneAppData(localData);
  }

  const existingData = await fetchAppData();
  
  if (existingData.songs.length > 0 && existingData.team.length > 0 && existingData.events.length > 0) {
    return existingData;
  }

  const songIdsBySeedId = new Map<string, string>();

  if (existingData.songs.length === 0) {
    for (const song of INITIAL_SONGS) {
      const createdSong = await createSong({
        title: song.title,
        artist: song.artist,
        bpm: song.bpm,
        key: song.key,
        proficiency: song.proficiency,
        difficulty: song.difficulty,
        isFavorite: song.isFavorite,
        tags: song.tags,
        lastPlayed: song.lastPlayed,
        links: song.links,
      });

      songIdsBySeedId.set(song.id, createdSong.id);
    }
  } else {
    for (const song of existingData.songs) {
      const originalSeed = INITIAL_SONGS.find(s => s.title === song.title);
      if (originalSeed) {
        songIdsBySeedId.set(originalSeed.id, song.id);
      }
    }
  }

  if (existingData.team.length === 0) {
    for (const member of INITIAL_TEAM) {
      await createTeamMember({
        name: member.name,
        role: member.role,
        category: member.category,
        avatar: member.avatar,
        isLeader: member.isLeader,
      });
    }
  }

  if (existingData.events.length === 0) {
    for (const event of INITIAL_EVENTS) {
      const eventInsert = await supabase
        .from('worship_events')
        .insert(
          mapEventToRow({
            ...event,
            songs: [],
            offeringSongs: [],
            outroSongs: [],
          })
        )
        .select('*')
        .single();
      assertNoError(eventInsert.error);

    const createdEventId = (eventInsert.data as WorshipEventRow).id;
    const payload = [
      ...event.songs.map((songId, index) => ({
        event_id: createdEventId,
        song_id: songIdsBySeedId.get(songId) ?? '',
        is_outro: false,
        is_offering: false,
        position: index,
      })),
      ...(event.offeringSongs ?? []).map((songId, index) => ({
        event_id: createdEventId,
        song_id: songIdsBySeedId.get(songId) ?? '',
        is_outro: false,
        is_offering: true,
        position: event.songs.length + index,
      })),
      ...(event.outroSongs ?? []).map((songId, index) => ({
        event_id: createdEventId,
        song_id: songIdsBySeedId.get(songId) ?? '',
        is_outro: true,
        is_offering: false,
        position: index + event.songs.length + (event.offeringSongs?.length ?? 0),
      })),
    ];

    if (payload.some((item) => !item.song_id)) {
      throw new Error(`Nao foi possivel montar o repertorio inicial do evento "${event.title}".`);
    }

    const eventSongsInsert = await supabase.from('event_songs').insert(payload);
    assertNoError(eventSongsInsert.error);
  }
  } // Fix for if (existingData.events.length === 0)

  return fetchAppData();
}

export const appDataSorters = {
  songs: sortSongs,
  team: sortTeam,
  events: sortEvents,
};

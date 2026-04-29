export type UserRole = 'minister' | 'musician' | 'pastor';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  functional_role?: 'vocal' | 'musician' | 'minister' | 'pastor';
  instrument?: string;
  onboarding_completed: boolean;
}

export type RehearsalStatus =
  | 'not_classified'
  | 'rehearsed'
  | 'not_rehearsed';
export type TeamKnowledge =
  | 'not_classified'
  | 'we_know'
  | 'partial'
  | 'we_do_not_know';
export type RehearsalNeed =
  | 'not_classified'
  | 'ready'
  | 'light_rehearsal'
  | 'needs_rehearsal'
  | 'intensive_rehearsal';
export type AttentionLevel =
  | 'normal'
  | 'attention'
  | 'high_attention';

export interface Song {

  id: string;
  title: string;
  artist: string;
  key: string;
  bpm?: number;
  proficiency: number; // 0 to 5
  difficulty: number; // 0 to 5
  isFavorite?: boolean;
  tags: string[];
  lastPlayed?: string;
  timesPlayed?: number;
  timesRehearsed?: number;
  links: {
    chords?: string;
    lyrics?: string;
    video?: string;
  };
  createdAt?: string;
  rehearsalStatus?: RehearsalStatus;
  teamKnowledge?: TeamKnowledge;
  rehearsalNeed?: RehearsalNeed;
  attentionLevel?: AttentionLevel;
  technicalLevel?: number;
  attentionReasons?: string[];
  isActiveRepertoire?: boolean;
  classificationNotes?: string;
  classifiedAt?: string;
  cover_url?: string;
  defaultLeadVocal?: string;
  originalKey?: string;
  vocalUrl?: string;
}

export type EventType = 'service' | 'rehearsal';

export interface WorshipEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  type: EventType;
  location?: string;
  description?: string;
  songs: string[]; // IDs of songs
  offeringSongs?: string[]; // IDs of songs for the offering
  outroSongs?: string[]; // IDs of songs for the end
  team: {
    vocal: string[];
    instruments: {
      [instrument: string]: string;
    };
  };
  attendance?: {
    [userId: string]: boolean;
  };
  songVocals?: Record<string, string>;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  avatar?: string;
  isLeader?: boolean;
}
export interface RehearsalReport {
  id: string;
  date: string;
  minister_id?: string;
  event_id?: string;
  songs_ids: string[];
  attendance: { [userId: string]: boolean };
  sentiment: string;
  observations: string;
  created_at?: string;
}

export interface SongSuggestion {
  id: string;
  title: string;
  artist: string;
  youtube_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  suggested_by?: string;
  suggested_by_name?: string;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  target_role?: string;
  target_user?: string;
  title: string;
  message: string;
  type: string;
  created_by?: string;
  created_at?: string;
  isRead?: boolean; // Front-end only field
}

export interface UserSongStudy {
  id: string;
  user_id: string;
  song_id: string;
  is_completed: boolean;
  created_at: string;
}

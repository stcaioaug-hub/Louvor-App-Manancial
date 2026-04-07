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
  links: {
    chords?: string;
    lyrics?: string;
    video?: string;
  };
  createdAt?: string;
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
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  avatar?: string;
  isLeader?: boolean;
}

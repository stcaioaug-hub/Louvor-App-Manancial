import Dexie, { type Table } from 'dexie';
import { Song, WorshipEvent, TeamMember, Profile } from '../types';

export class ManancialLocalDb extends Dexie {
  songs!: Table<Song, string>;
  events!: Table<WorshipEvent, string>;
  team!: Table<TeamMember, string>;
  profiles!: Table<Profile, string>;

  // Future integration tables
  eventAssignments!: Table<any, string>;
  eventAttendance!: Table<any, string>;
  songFavorites!: Table<any, string>;
  songSuggestions!: Table<any, string>;

  constructor() {
    super('ManancialAppDB');
    
    // DB Schema definition
    // Indexed keys are defined here. Non-indexed properties don't need to be listed.
    this.version(1).stores({
      songs: 'id, title, artist, key, proficiency, difficulty, isFavorite',
      events: 'id, date, type',
      team: 'id, name, role, category',
      profiles: 'id, role',
      
      eventAssignments: 'id, event_id, member_id',
      eventAttendance: 'id, event_id, member_id',
      songFavorites: 'id, profile_id, song_id',
      songSuggestions: 'id, profile_id, status'
    });
  }
}

export const localDb = new ManancialLocalDb();

export async function clearLocalDb() {
  await Promise.all([
    localDb.songs.clear(),
    localDb.events.clear(),
    localDb.team.clear(),
    localDb.profiles.clear(),
    localDb.eventAssignments.clear(),
    localDb.eventAttendance.clear(),
    localDb.songFavorites.clear(),
    localDb.songSuggestions.clear(),
  ]);
}

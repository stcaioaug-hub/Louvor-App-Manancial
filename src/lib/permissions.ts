import { Profile, WorshipEvent, Song } from '../types';

export const ROLES = {
  MINISTER: 'minister',
  PASTOR: 'pastor',
  MUSICIAN: 'musician',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

/**
 * Retorna verdadeiro se o usuário tiver perfil de liderança geral.
 */
export function isLeadership(profile?: Profile | null): boolean {
  if (!profile) return false;
  return profile.role === ROLES.MINISTER || profile.role === ROLES.PASTOR;
}

/**
 * Permissões do Repertório de Canções
 */
export const songPermissions = {
  canCreate: (profile?: Profile | null) => isLeadership(profile),
  canEdit: (profile?: Profile | null) => isLeadership(profile),
  canDelete: (profile?: Profile | null) => isLeadership(profile),
  canEditMetadatas: (profile?: Profile | null) => isLeadership(profile), // Proficiência, Dificuldade, BPM
};

/**
 * Permissões da Agenda de Eventos
 */
export const eventPermissions = {
  canCreate: (profile?: Profile | null) => isLeadership(profile),
  canEdit: (profile?: Profile | null) => isLeadership(profile),
  canDelete: (profile?: Profile | null) => isLeadership(profile),
  canManageAttendance: (profile?: Profile | null) => isLeadership(profile), // Alocar membros da equipe
};

/**
 * Permissões de Perfis e Membros
 */
export const teamPermissions = {
  canCreate: (profile?: Profile | null) => isLeadership(profile),
  canEdit: (profile?: Profile | null) => isLeadership(profile),
  canDelete: (profile?: Profile | null) => isLeadership(profile),
};

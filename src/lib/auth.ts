import { supabase, isConfigured } from './supabase';
import { Profile, UserRole } from '../types';

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isConfigured) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data as Profile;
}

export async function updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  if (!isConfigured) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', profile.id)
    .select('*')
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Profile;
}

export async function signOut() {
  if (!isConfigured) return;
  await supabase.auth.signOut();
}


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
  console.log('Fetching events...');
  const { data: events, error } = await supabase.from('worship_events').select('*').limit(1);
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  if (!events || events.length === 0) {
    console.log('No events found.');
    return;
  }

  const event = events[0];
  console.log('Found event:', event.id, event.title);

  console.log('Testing update...');
  const { data: updated, error: updateError } = await supabase
    .from('worship_events')
    .update({ title: event.title + ' (Edit Test)' })
    .eq('id', event.id)
    .select('*')
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('Update success:', updated.id, updated.title);
    
    // Revert
    console.log('Reverting update...');
    await supabase
      .from('worship_events')
      .update({ title: event.title })
      .eq('id', event.id);
    console.log('Revert success.');
  }

  console.log('Testing event_songs delete/insert...');
  const { error: deleteError } = await supabase.from('event_songs').delete().eq('event_id', event.id);
  if (deleteError) {
    console.error('Delete error:', deleteError);
  } else {
    console.log('Delete success.');
  }
}

testUpdate();

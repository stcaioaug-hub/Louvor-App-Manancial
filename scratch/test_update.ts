import { supabase } from '../src/lib/supabase';
import { updateEvent } from '../src/lib/appData';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.local' });

async function run() {
  const { data: events, error } = await supabase.from('worship_events').select('*').limit(1);
  if (error || !events || events.length === 0) {
    console.error('No events found', error);
    return;
  }
  const event = events[0];
  console.log('Event', event);
}
run();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySave() {
  console.log('🚀 Starting Save Verification...');
  
  try {
    // 1. Fetch a test event
    console.log('1. Fetching a test event...');
    const { data: events, error: fetchError } = await supabase
      .from('worship_events')
      .select('id, title, attendance')
      .limit(1);

    if (fetchError) throw fetchError;
    if (!events || events.length === 0) {
      console.log('⚠️ No events found to test with.');
      return;
    }

    const testEvent = events[0];
    console.log(`✅ Found event: "${testEvent.title}" (${testEvent.id})`);

    // 2. Test Update (Attendance)
    console.log('2. Testing event update (PATCH)...');
    const startTime = Date.now();
    const updatedAttendance = { ...testEvent.attendance, verification_test: new Date().toISOString() };
    
    const { data: updateData, error: updateError, status } = await supabase
      .from('worship_events')
      .update({ attendance: updatedAttendance })
      .eq('id', testEvent.id)
      .select()
      .single();

    const endTime = Date.now();
    
    if (updateError) {
      console.error(`❌ Update failed with status ${status}:`, updateError);
      if (status === 406 || updateError.code === 'PGRST116') {
        console.error('👉 This is an RLS/Permission error. Check if your role allows updating this row.');
      }
    } else {
      console.log(`✅ Update successful in ${endTime - startTime}ms`);
    }

    // 3. Test Setlist Update (event_songs)
    console.log('3. Testing event_songs fetch...');
    const { data: songs, error: songsError } = await supabase
      .from('event_songs')
      .select('*')
      .eq('event_id', testEvent.id);

    if (songsError) {
      console.error('❌ Failed to fetch event_songs:', songsError);
    } else {
      console.log(`✅ Found ${songs.length} songs in setlist.`);
    }

    console.log('\n✨ Verification complete.');
  } catch (err) {
    console.error('💥 Fatal error during verification:', err);
  }
}

verifySave();

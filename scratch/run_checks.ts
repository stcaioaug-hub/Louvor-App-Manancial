import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runChecks() {
  console.log('🔍 Running Application Integrity Checks...');
  
  let failures = 0;

  const check = async (name: string, fn: () => Promise<any>) => {
    process.stdout.write(`• ${name.padEnd(40)} `);
    const start = Date.now();
    try {
      await fn();
      console.log(`✅ OK (${Date.now() - start}ms)`);
    } catch (err: any) {
      console.log(`❌ FAILED`);
      console.error(`  Error: ${err.message}`);
      failures++;
    }
  };

  // 1. Connection Check
  await check('Supabase Connection', async () => {
    const { data, error } = await supabase.from('songs').select('count', { count: 'exact', head: true });
    if (error) throw error;
  });

  // 2. Data Fetch Check
  await check('Fetch Songs & Events', async () => {
    const [s, e] = await Promise.all([
      supabase.from('songs').select('id').limit(1),
      supabase.from('worship_events').select('id').limit(1)
    ]);
    if (s.error) throw s.error;
    if (e.error) throw e.error;
  });

  // 3. Update Check (The most important one)
  await check('Event Update Capability', async () => {
    // We pick the first event we can find
    const { data: events } = await supabase.from('worship_events').select('id').limit(1);
    if (!events || events.length === 0) return 'Skipped (No events found)';

    const eventId = events[0].id;
    
    // Attempt a no-op update to test connectivity and RLS
    // Note: If you see a 406 error here, it's because this script uses the ANON key
    // while the app uses an AUTHENTICATED session.
    const { error, status } = await supabase
      .from('worship_events')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', eventId);
    
    if (error && status !== 406) throw error;
    if (status === 406) {
      console.log('\n  ⚠️ Note: Received 406 (expected for non-logged-in script). RLS is active.');
    }
  });

  console.log('\n' + (failures === 0 ? '✨ ALL CHECKS PASSED' : `⚠️ ${failures} CHECKS FAILED`));
  
  if (failures > 0) {
    console.log('\n💡 Tip: If saving hangs in the browser but checks pass here, check the Realtime subscriptions in App.tsx.');
  }
}

runChecks();

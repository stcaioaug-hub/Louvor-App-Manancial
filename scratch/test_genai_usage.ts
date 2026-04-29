import { createClient } from '@google/genai';

async function test() {
  try {
    const client = createClient({
      apiKey: process.env.VITE_GEMINI_API_KEY,
    });
    console.log('Client created:', !!client);
    // Try to list models
    const models = await client.models.list();
    console.log('Models found:', models.length);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();

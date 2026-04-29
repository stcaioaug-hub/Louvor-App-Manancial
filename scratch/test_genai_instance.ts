import { GoogleGenAI } from '@google/genai';

async function test() {
  try {
    const genai = new GoogleGenAI({
      apiKey: process.env.VITE_GEMINI_API_KEY,
    });
    console.log('GoogleGenAI instance created:', !!genai);
    
    // Check available models
    const models = await genai.models.list();
    console.log('Models found:', models.length);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();

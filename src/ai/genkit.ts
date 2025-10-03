import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1', // 👈 force v1 so gemini-1.5-pro-vision works
    }),
  ],
  // Optional debugging:
  // logSinks: [console.log],
  // openTraceInBrowser: true,
});

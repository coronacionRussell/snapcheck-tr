'use server';

/**
 * @fileOverview This file configures the Genkit AI instance for the application.
 * It initializes the Google AI plugin with the necessary API key.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
    }),
  ],
  // Optional debugging:
  // logSinks: [console.log],
  // openTraceInBrowser: true,
});

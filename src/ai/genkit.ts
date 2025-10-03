
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';


// Initialize Genkit with the Google AI plugin.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
});

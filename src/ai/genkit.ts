
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {firebase} from "@genkit-ai/firebase";

// Initialize Genkit with the Firebase and Google AI plugins.
// This will use the project's service account for authentication.
export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
});

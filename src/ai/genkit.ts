
import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {TEXT_MODEL} from './models';

export const ai = genkit({
  plugins: [
    vertexAI({
      // The region to run the models in.
      location: 'us-central1',
    }),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
  defaultModel: TEXT_MODEL,
});

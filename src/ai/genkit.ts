
import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {openai} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    vertexAI({
      // The region to run the models in.
      // region: 'us-central1',
    }),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
});

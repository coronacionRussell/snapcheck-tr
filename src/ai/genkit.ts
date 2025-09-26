
import {genkit, configureGenkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {openai} from 'genkitx-openai';

export const ai = genkit();

configureGenkit({
  plugins: [
    vertexAI(),
    openai({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  model: 'openai/gpt-4o',
});

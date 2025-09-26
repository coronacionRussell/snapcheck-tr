import {genkit, configureGenkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {openai} from 'genkitx-openai';

export const ai = genkit();

configureGenkit({
  plugins: [
    vertexAI(),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
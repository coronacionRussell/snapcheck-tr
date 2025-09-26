import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import {openai} from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    vertexAI(),
  ],
});

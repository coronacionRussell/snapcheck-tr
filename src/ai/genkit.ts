
import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';

export const ai = genkit({
  plugins: [vertexAI()],
  model: 'gemini-1.5-pro-latest',
});

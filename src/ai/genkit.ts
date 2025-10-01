
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {TEXT_MODEL} from './models';

// Explicitly check for the API key on the server.
if (!process.env.GEMINI_API_KEY) {
  console.error(`
    FATAL ERROR: The GEMINI_API_KEY environment variable is not set.
    The AI features of this application will not work without it.
    
    Please take the following steps:
    1. Get a valid API key from Google AI Studio: https://aistudio.google.com/app/apikey
    2. Create a file named '.env' in the root of your project.
    3. Add the following line to your .env file:
       GEMINI_API_KEY="your-api-key-goes-here"
    
    Replace "your-api-key-goes-here" with the key you obtained.
    Then, restart the development server.
  `);
}


export const ai = genkit({
  plugins: [
    googleAI({
      // The region to run the models in.
      // location: 'us-central1',
    }),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
  defaultModel: TEXT_MODEL,
});

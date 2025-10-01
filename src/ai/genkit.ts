
import {genkit} from 'genkit';
import {openAI} from 'genkitx-openai';
import {TEXT_MODEL} from './models';

// Explicitly check for the API key on the server.
if (!process.env.OPENAI_API_KEY) {
  console.error(`
    FATAL ERROR: The OPENAI_API_KEY environment variable is not set.
    The AI features of this application will not work without it.
    
    Please take the following steps:
    1. Get a valid API key from the OpenAI Platform: https://platform.openai.com/api-keys
    2. Create a file named '.env' in the root of your project.
    3. Add the following line to your .env file:
       OPENAI_API_KEY="your-api-key-goes-here"
    
    Replace "your-api-key-goes-here" with the key you obtained.
    Then, restart the development server.
  `);
}


export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  // Log all traces to the console.
  // logSinks: [console.log],
  // Open the trace in the browser.
  // openTraceInBrowser: true,
  defaultModel: TEXT_MODEL,
});

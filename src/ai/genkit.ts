
'use server';
/**
 * @fileOverview Central Genkit initialization.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Note: genkit() automatically looks for GEMINI_API_KEY in the environment.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});


'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit/google-ai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logSinks: [],
  enableTracing: true,
});

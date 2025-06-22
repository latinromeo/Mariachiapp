'use server';

/**
 * @fileOverview AI-powered virtual assistant for event creation.
 *
 * - eventCreationAssistant - A function that uses AI to assist in creating events with suggestions and reminders.
 * - EventCreationAssistantInput - The input type for the eventCreationAssistant function.
 * - EventCreationAssistantOutput - The return type for the eventCreationAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventCreationAssistantInputSchema = z.object({
  userInput: z.string().describe('The user input describing the event.'),
  historicalEventData: z
    .string()
    .optional()
    .describe('Historical event data for context.'),
});
export type EventCreationAssistantInput = z.infer<typeof EventCreationAssistantInputSchema>;

const EventCreationAssistantOutputSchema = z.object({
  suggestedDetails: z.string().describe('AI-suggested event details.'),
  suggestedReminders: z.string().describe('AI-suggested reminders for the event.'),
  prefilledFields: z.string().describe('AI-prefilled fields based on historical data.'),
});
export type EventCreationAssistantOutput = z.infer<typeof EventCreationAssistantOutputSchema>;

export async function eventCreationAssistant(input: EventCreationAssistantInput): Promise<EventCreationAssistantOutput> {
  return eventCreationAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eventCreationAssistantPrompt',
  input: {schema: EventCreationAssistantInputSchema},
  output: {schema: EventCreationAssistantOutputSchema},
  prompt: `You are a virtual assistant helping users create events. Based on the user input and historical event data, suggest event details, reminders, and pre-fill fields.

User Input: {{{userInput}}}
Historical Event Data: {{{historicalEventData}}}

Instructions: Provide specific event details, suggest helpful reminders, and pre-fill relevant fields based on historical data to save the user time and effort.

Output the result as JSON formatted like this:
```json
{
  "suggestedDetails": "...",
  "suggestedReminders": "...",
  "prefilledFields": "..."
}
```
`,
});

const eventCreationAssistantFlow = ai.defineFlow(
  {
    name: 'eventCreationAssistantFlow',
    inputSchema: EventCreationAssistantInputSchema,
    outputSchema: EventCreationAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

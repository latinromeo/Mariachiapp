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
  prefilledFields: z.string().describe('AI-prefilled fields based on historical data, as a JSON string.'),
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

Instructions: 
1.  Provide specific event details in 'suggestedDetails'.
2.  Suggest helpful reminders in 'suggestedReminders'.
3.  For 'prefilledFields', generate a JSON string that maps form field names (like 'eventName', 'date', 'location', 'clientName', 'notes') to their suggested values. For example: "{\\"eventName\\":\\"Jorge's 50th Birthday Party\\", \\"notes\\":\\"A surprise. He loves classics.\\"}".

Your entire output must be a single, valid JSON object that conforms to the output schema.
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

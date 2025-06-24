
'use server';
/**
 * @fileOverview A virtual assistant AI agent for the Mariachi app.
 *
 * - askAssistant - A function that handles the chat with the assistant.
 * - AssistantInput - The input type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { MessageData, Part } from 'genkit';
import { z } from 'zod';
import { listEvents, listClients, createNewEvent, createFinanceEntry } from '../tools/mariachi-tools';

// A simple, clear set of instructions for the AI.
const masterPrompt = `You are "Maestro Mariachi AI", a virtual assistant for a mariachi band.
- Your goal is to be helpful and professional.
- Your responses MUST be in Spanish.
- Use the provided tools to answer questions. For example, to see events, use 'listEvents'. To create one, use 'createEvent'.
- If you need more information to use a tool (like a date or time), ask the user for it.
- After a user confirms an action (e.g., with "sí" or "claro"), use the tool you previously suggested by reviewing the conversation history.
- Today's date is ${new Date().toISOString().split('T')[0]}. Use it as a reference for any date-related questions.`;

const AssistantInputSchema = z.object({
  // The user's most recent message.
  message: z.string(),
  // The conversation history from the client, which we will map to the correct format.
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function askAssistant(input: AssistantInput): Promise<Part[]> {
  try {
    // Map the client-side history to the format Genkit expects (MessageData[]).
    // The key is to rename the 'parts' property to 'content'.
    // We also filter out any malformed messages to prevent errors.
    const mappedHistory: MessageData[] = input.history
      .filter((msg: any) => msg && Array.isArray(msg.parts))
      .map((msg: any) => ({
        role: msg.role,
        content: msg.parts,
      }));

    // The main call to the AI model.
    const response = await ai.generate({
      system: masterPrompt,
      prompt: input.message, // The latest user message.
      history: mappedHistory, // The preceding conversation.
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });

    // Return the response content. If there's no content, return an empty array to prevent crashes.
    return response.content || [];

  } catch (error) {
    console.error("Error in askAssistant flow:", error);
    // Return a structured error message that the frontend can display.
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

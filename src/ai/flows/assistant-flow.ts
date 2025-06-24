
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
- Today's date is ${new Date().toISOString().split('T')[0]}. Use it as a reference for any date-related questions.
- If a tool call results in an error, inform the user about the error in a helpful way.
- Do not make up information. If you can't answer, say you don't know or can't do it.`;

const AssistantInputSchema = z.object({
  // The user's most recent message.
  message: z.string(),
  // The conversation history from the client.
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// This function will encapsulate the full logic, including tool usage.
export async function askAssistant(input: AssistantInput): Promise<Part[]> {
  const tools = [listEvents, listClients, createNewEvent, createFinanceEntry];

  try {
    // 1. **Safely** transform client-side history to Genkit's MessageData format.
    const history: MessageData[] = input.history
      .map((msg: any): MessageData | null => {
        // Ensure the message and its parts are valid.
        if (!msg || !msg.role || !Array.isArray(msg.parts) || msg.parts.length === 0) {
          return null;
        }

        const content: Part[] = msg.parts
          .map((part: any): Part | null => {
            if (!part || typeof part !== 'object') return null;
            // Create a valid Part object, filtering out anything extra.
            if (part.text) return { text: part.text };
            if (part.toolRequest) return { toolRequest: part.toolRequest };
            if (part.toolResponse) return { toolResponse: part.toolResponse };
            return null; // Ignore invalid or empty parts.
          })
          .filter((p): p is Part => p !== null); // Remove nulls from the array.

        // If a message has no valid parts after filtering, discard it.
        if (content.length === 0) {
          return null;
        }

        return { role: msg.role, content };
      })
      .filter((m): m is MessageData => m !== null); // Remove null messages.

    // 2. Let Genkit handle the tool-use loop automatically.
    const response = await ai.generate({
      prompt: input.message,
      system: masterPrompt,
      history,
      tools,
    });

    // 3. Return the content, ensuring it's a valid array.
    // If response.content is null or undefined, return an empty array to avoid client-side errors.
    return response.content ?? [];

  } catch (error) {
    console.error("An unexpected error occurred in the askAssistant flow:", error);
    // Return a user-friendly error message in the expected format.
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

'use server';
/**
 * @fileOverview A virtual assistant AI agent for the Mariachi app.
 *
 * - askAssistant - A function that handles the chat with the assistant.
 * - AssistantInput - The input type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { MessageData } from 'genkit';
import { z } from 'zod';
import { listEvents, listClients, createNewEvent, createFinanceEntry } from '../tools/mariachi-tools';

const masterPrompt = `You are "Maestro Mariachi AI", a helpful virtual assistant for managing a mariachi band.
- You are an expert in mariachi logistics, finance, and music.
- Always be helpful, proactive, and professional.
- Your responses MUST be in Spanish.
- Use the available tools to answer questions and perform actions.
- If you need more information to use a tool, ask the user for it.
- When you perform an action (like creating an event), confirm that it was done.
`;

const AssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function askAssistant(input: AssistantInput): Promise<string> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPromptWithDate = `${masterPrompt}\n\nADDITIONAL INFORMATION:\n- Today's date is ${currentDate}. Use this as a reference for any time-related queries (e.g., "today", "tomorrow", "this month").`;

    const { text } = await ai.generate({
      system: systemPromptWithDate,
      prompt: input.message,
      history: input.history as MessageData[],
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });
    return text;
  } catch (error) {
    console.error("Error calling Genkit AI:", error);
    return "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API.";
  }
}

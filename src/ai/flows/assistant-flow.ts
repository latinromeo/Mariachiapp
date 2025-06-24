
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

const masterPrompt = `You are "Maestro Mariachi AI", a helpful virtual assistant for managing a mariachi band.
- You are an expert in mariachi logistics, finance, and music.
- Always be helpful, proactive, and professional.
- Your responses MUST be in Spanish.
- Use the available tools to answer questions and perform actions. For example, if the user asks to see events, use the 'listEvents' tool. If they ask to create an event, use the 'createEvent' tool.
- If you need more information to use a tool (like the date for an event), ask the user for it clearly.
- Once you have enough information, call the appropriate tool.
- After successfully calling a tool (like creating an event), always confirm to the user that the action was completed.
`;

const AssistantInputSchema = z.object({
  message: z.string(),
  // The history from the client uses `parts`, so we accept `any` and map it.
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function askAssistant(input: AssistantInput): Promise<Part[]> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPromptWithDate = `${masterPrompt}\n\nADDITIONAL INFORMATION:\n- Today's date is ${currentDate}. Use this as a reference for any time-related queries (e.g., "today", "tomorrow", "this month").`;

    // Map client-side history ({role, parts}) to Genkit's expected MessageData ({role, content})
    // This is the key fix: the AI platform expects a 'content' property, not 'parts'.
    const genkitHistory: MessageData[] = input.history.map(msg => ({
      role: msg.role,
      content: msg.parts, // Map `parts` to `content`
    }));

    // Add the new user message to the history. The message from the input is the prompt.
    const response = await ai.generate({
      system: systemPromptWithDate,
      prompt: input.message,
      history: genkitHistory,
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });
    
    return response.content;
  } catch (error) {
    console.error("Error calling Genkit AI:", error);
    // Ensure the catch block returns the correct type (Part[])
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

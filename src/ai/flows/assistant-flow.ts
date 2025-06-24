
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
- Review the conversation history to understand the context before responding. If you have just proposed an action and the user confirms (e.g., with "sí" or "procede"), execute the tool you proposed.
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

    // Map the client-side history to the format Genkit expects (MessageData[]).
    // The key is to rename `parts` to `content`.
    const mappedHistory: MessageData[] = input.history.map((message: any) => ({
      role: message.role,
      content: message.parts,
    }));

    // The entire conversation, including the latest user message.
    const conversation: MessageData[] = [
      ...mappedHistory,
      { role: 'user', content: [{ text: input.message }] },
    ];
    
    const response = await ai.generate({
      system: systemPromptWithDate,
      history: conversation, // Send the full, correctly formatted conversation history.
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });
    
    return response.content || [];
  } catch (error) {
    console.error("Error calling Genkit AI:", error);
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}


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
- Use the available tools to answer questions and perform actions.
- If you need more information to use a tool, ask the user for it.
- When you perform an action (like creating an event), confirm that it was done.
- Review the conversation history. If your last message contained a tool call request, and the user's latest message is a confirmation (e.g., "si", "yes", "ok", "dale"), you MUST call the tool and then confirm its execution. Do not ask another question like "¿En qué puedo ayudarte hoy?".
`;

const AssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export async function askAssistant(input: AssistantInput): Promise<Part[]> {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const systemPromptWithDate = `${masterPrompt}\n\nADDITIONAL INFORMATION:\n- Today's date is ${currentDate}. Use this as a reference for any time-related queries (e.g., "today", "tomorrow", "this month").`;

    // Combine the previous history with the new user message for full context.
    const fullHistory = [
        ...(input.history as MessageData[]),
        { role: 'user', parts: [{ text: input.message }] }
    ];

    const response = await ai.generate({
      system: systemPromptWithDate,
      history: fullHistory, // Use the full history with the latest message
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });
    
    return response.content.parts;
  } catch (error) {
    console.error("Error calling Genkit AI:", error);
    // Ensure the catch block returns the correct type (Part[])
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

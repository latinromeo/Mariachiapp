'use server';
/**
 * @fileOverview A virtual assistant AI agent for the Mariachi app.
 *
 * - askAssistant - A function that handles the chat with the assistant.
 * - AssistantInput - The input type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { MessageData, Part, toolRequest, content } from 'genkit';
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
  // The conversation history from the client.
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;

// This function will encapsulate the full logic, including tool usage.
export async function askAssistant(input: AssistantInput): Promise<Part[]> {
  try {
    // 1. Transform the client-side history into the format Genkit expects.
    const history: MessageData[] = input.history
      .filter((msg: any) => msg && Array.isArray(msg.parts) && msg.parts.length > 0)
      .map((msg: any) => ({
        role: msg.role,
        content: msg.parts,
      }));

    // Define the available tools for the model.
    const tools = [listEvents, listClients, createNewEvent, createFinanceEntry];

    // 2. Call the AI model with the prompt, history, and available tools.
    let response = await ai.generate({
      system: masterPrompt,
      prompt: input.message,
      history,
      tools,
    });

    while (true) {
        const toolRequestPart = response.part(p => p.toolRequest);
        if (!toolRequestPart) {
            // If no tool is requested, we have our final answer.
            return response.content();
        }

        // 4. A tool has been requested. Execute it.
        console.log(`AI is requesting to use tool: ${toolRequestPart.toolRequest.name}`);
        let toolOutput: any;

        try {
            const tool = tools.find(t => t.name === toolRequestPart.toolRequest.name);
            if (!tool) {
                throw new Error(`Tool '${toolRequestPart.toolRequest.name}' is not available.`);
            }
            toolOutput = await tool.fn(toolRequestPart.toolRequest.input);
        } catch (e: any) {
            console.error(`Error executing tool ${toolRequestPart.toolRequest.name}:`, e);
            toolOutput = { error: e.message || 'An unknown error occurred.' };
        }
        
        const toolResponse = {
            toolResponse: {
                name: toolRequestPart.toolRequest.name,
                output: toolOutput,
            },
        };

        // 5. Call the model again, providing the tool's result.
        response = await ai.generate({
            system: masterPrompt,
            history: [
                ...history,
                { role: 'user', content: [{ text: input.message }] },
                response.message,
                { role: 'tool', content: [toolResponse] },
            ],
            tools,
        });
    }
  } catch (error) {
    console.error("An unexpected error occurred in the askAssistant flow:", error);
    // Return a user-friendly error message in the expected format.
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

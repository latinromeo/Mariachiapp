
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
    // 1. Transform the client-side history into the format Genkit expects.
    const history: MessageData[] = input.history
      .filter((msg: any) => msg && Array.isArray(msg.parts) && msg.parts.length > 0)
      .map((msg: any) => ({
        role: msg.role,
        // This handles the frontend using `parts` and Genkit using `content`.
        content: msg.parts.map((part: any) => {
          if (part.text) return { text: part.text };
          if (part.toolRequest) return { toolRequest: part.toolRequest };
          if (part.toolResponse) return { toolResponse: part.toolResponse };
          return part;
        }),
      }));
      
    // 2. Add the user's current message to the history.
    history.push({ role: 'user', content: [{ text: input.message }] });
    
    // 3. Start the conversation loop.
    while (true) {
      const response = await ai.generate({
        system: masterPrompt,
        history,
        tools,
      });

      const modelMessage = response.message;
      history.push(modelMessage); // Add model's response to history

      const toolRequest = response.part(p => p.toolRequest);
      
      if (!toolRequest) {
        // No tool requested, we have the final answer.
        return response.content();
      }
      
      // A tool has been requested.
      console.log(`AI is requesting to use tool: ${toolRequest.toolRequest.name}`);
      let toolOutput: any;
      
      try {
        const tool = tools.find(t => t.name === toolRequest.toolRequest.name);
        if (!tool) {
            throw new Error(`Tool '${toolRequest.toolRequest.name}' is not available.`);
        }
        toolOutput = await tool.fn(toolRequest.toolRequest.input);
      } catch (e: any) {
        console.error(`Error executing tool ${toolRequest.toolRequest.name}:`, e);
        toolOutput = { error: `Tool execution failed: ${e.message || 'An unknown error occurred.'}` };
      }
      
      // Add the tool response to history and continue the loop.
      history.push({
        role: 'tool',
        content: [{
          toolResponse: {
            name: toolRequest.toolRequest.name,
            output: toolOutput,
          },
        }],
      });
    }

  } catch (error) {
    console.error("An unexpected error occurred in the askAssistant flow:", error);
    // Return a user-friendly error message in the expected format.
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

'use server';
/**
 * @fileOverview A virtual assistant AI agent for the Mariachi app.
 *
 * - askAssistant - A function that handles the chat with the assistant.
 * - AssistantInput - The input type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { MessageData, Part, ToolResponsePart } from 'genkit';
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
    // 1. Prepare the initial history from the client-side data.
    const initialHistory: MessageData[] = input.history
      .filter((msg: any) => msg && Array.isArray(msg.parts))
      .map((msg: any) => ({
        role: msg.role,
        content: msg.parts,
      }));

    // 2. Make the first call to the model to get a response or a tool request.
    const response = await ai.generate({
      system: masterPrompt,
      prompt: input.message,
      history: initialHistory,
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });

    const modelResponseContent = response.content;

    // 3. Check if the model is requesting to use a tool.
    const toolRequestPart = modelResponseContent.find(part => part.toolRequest);
    if (!toolRequestPart || !toolRequestPart.toolRequest) {
      // If no tool is requested, we have our final answer.
      return modelResponseContent || [];
    }

    // 4. A tool has been requested. We need to execute it.
    const toolRequest = toolRequestPart.toolRequest;
    console.log(`Executing tool: ${toolRequest.name}`);

    let toolOutput: any;
    try {
      const allTools = { listEvents, listClients, createEvent: createNewEvent, createFinanceEntry };
      const toolToRun = allTools[toolRequest.name as keyof typeof allTools];
      
      if (!toolToRun) {
        throw new Error(`Tool '${toolRequest.name}' is not available.`);
      }
      
      toolOutput = await toolToRun.fn(toolRequest.input);
    } catch (e: any) {
      console.error(`Error executing tool ${toolRequest.name}:`, e);
      toolOutput = { error: e.message || 'An unknown error occurred while executing the tool.' };
    }

    // 5. We build the full conversation history for the next call.
    const historyForSecondCall: MessageData[] = [
      ...initialHistory, // The history before this turn
      { role: 'user', content: [{ text: input.message }] }, // The user's message that triggered the tool
      { role: 'model', content: modelResponseContent }, // The model's response asking to use the tool
      { role: 'tool', content: [{ toolResponse: { name: toolRequest.name, output: toolOutput } }] }, // The result from our tool
    ];

    // 6. Call the model again, providing the tool's result. The model will use this to generate a natural language response.
    const finalResponse = await ai.generate({
      system: masterPrompt,
      history: historyForSecondCall,
      tools: [listEvents, listClients, createNewEvent, createFinanceEntry],
    });

    return finalResponse.content || [];

  } catch (error) {
    console.error("Error in askAssistant flow:", error);
    return [{ text: "Lo siento, ha ocurrido un error al contactar a la IA. Por favor, revisa la configuración y las claves de API." }];
  }
}

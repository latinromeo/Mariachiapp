
'use server';
/**
 * @fileOverview A virtual assistant AI agent for the Mariachi app.
 *
 * - askAssistant - A function that handles the chat with the assistant.
 * - AssistantInput - The input type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { MessageData, Part, ToolRequestPart } from 'genkit';
import { z } from 'zod';
import { listEvents, listClients, createNewEvent, createFinanceEntry, createNewRehearsal } from '../tools/mariachi-tools';

// A simple, clear set of instructions for the AI.
const masterPrompt = `You are "Maestro Mariachi AI", a virtual assistant for a mariachi band.
- Your goal is to be helpful and professional.
- Your responses MUST be in Spanish.
- Use the provided tools to answer questions. For example, to see events, use 'listEvents'. To create an event, use 'createEvent'. To schedule a rehearsal, use 'createRehearsal'.
- If you need more information to use a tool (like a date or time), ask the user for it.
- After a user confirms an action (e.g., with "sí" or "claro"), use the tool you previously suggested by reviewing the conversation history.
- Today's date is ${new Date().toISOString().split('T')[0]}. Use it as a reference for any date-related questions.
- If a tool call results in an error, inform the user about the error in a helpful way.
- Do not make up information. If you can't answer, say you don't know or can't do it.`;

const AssistantInputSchema = z.object({
  // The user's most recent message.
  message: z.string(),
  // The conversation history from the client, expected to be in MessageData format.
  history: z.array(z.any()),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;


export async function askAssistant(input: AssistantInput): Promise<Part[]> {
    const tools = [listEvents, listClients, createNewEvent, createFinanceEntry, createNewRehearsal];
    
    try {
        // The client now sends data in the correct MessageData format, so we can use it directly.
        const history: MessageData[] = input.history;
        
        // Add the new user message to the sanitized history
        history.push({ role: 'user', content: [{ text: input.message }] });

        // Start the conversation loop to handle tool requests.
        for (let i = 0; i < 5; i++) { // Add a limit to prevent infinite loops
            const response = await ai.generate({
                model: 'googleai/gemini-1.5-flash-latest',
                system: masterPrompt,
                history,
                tools,
            });

            const choice = response.candidates[0];
            
            if (!choice || !choice.content || choice.content.length === 0) {
                return [{ text: "Lo siento, no he podido generar una respuesta en este momento." }];
            }

            const choiceParts = choice.content;

            // Add the model's response (which could be a tool request) to the history.
            history.push({ role: 'model', content: choiceParts });
            
            const toolRequests = choiceParts
              .map(p => p.toolRequest)
              .filter((tr): tr is ToolRequestPart => !!tr);

            if (toolRequests.length === 0) {
                // No tool request, this is the final text answer, so we return it.
                return choiceParts.filter(p => typeof p.text === 'string');
            }

            // The model wants to use tools. Execute them.
            const toolResponses: Part[] = await Promise.all(
                toolRequests.map(async (toolRequest) => {
                    const tool = tools.find(t => t.name === toolRequest.name);
                    if (!tool) {
                        return { toolResponse: { name: toolRequest.name, output: `Error: Tool '${toolRequest.name}' not found.` } };
                    }
                    try {
                        const output = await tool.fn(toolRequest.input);
                        const serializableOutput = JSON.parse(JSON.stringify(output || {}));
                        return { toolResponse: { name: toolRequest.name, output: serializableOutput } };
                    } catch (e: any) {
                        return { toolResponse: { name: toolRequest.name, output: `Error executing tool: ${e.message}` } };
                    }
                })
            );

            // Add the tool execution results to the history for the next turn.
            history.push({ role: 'tool', content: toolResponses });
        }

        // If the loop finishes without a final answer, return an error.
        return [{ text: "Lo siento, la IA no pudo procesar la solicitud después de varios intentos." }];

    } catch (error: any) {
        console.error("An unexpected error occurred in the askAssistant flow:", error);
        // Provide a more descriptive error message if possible
        const errorMessage = error.message || "An unknown error occurred.";
        return [{ text: `Lo siento, ha ocurrido un error al contactar a la IA. Detalles: ${errorMessage}` }];
    }
}

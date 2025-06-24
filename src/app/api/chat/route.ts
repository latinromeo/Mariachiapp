'use server';

import {NextResponse} from 'next/server';
import OpenAI from 'openai';
import {createEventFromPrompt} from '@/services/eventService';

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define a type for the chat history messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(req: Request) {
  try {
    const {prompt, history} = (await req.json()) as {prompt: string; history: ChatMessage[]};

    if (!prompt) {
      return NextResponse.json({error: 'Prompt is required'}, {status: 400});
    }

    // The system prompt gives the assistant its personality and instructions
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión de una agrupación de mariachis. Eres amigable, servicial y conoces todos los aspectos del negocio. Tus respuestas deben ser concisas, útiles y en español.`,
    };

    // --- Intent Detection ---
    // Check if the prompt contains keywords for creating an event or rehearsal.
    const createIntentKeywords = ['crea', 'programa', 'agenda', 'ensayo', 'evento'];
    const hasCreateIntent = createIntentKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

    let eventCreated = false;
    let eventCreationDetails = null;
    if (hasCreateIntent) {
      try {
        const result = await createEventFromPrompt(prompt);
        if (result.success) {
          eventCreated = true;
          eventCreationDetails = result.details;
          console.log('Event created successfully from prompt:', result.details);
        }
      } catch (e) {
        console.error('Error trying to create event from prompt:', e);
        // Do not block the chat flow if event creation fails.
      }
    }

    // --- Chat Completion ---
    // Combine the system prompt, conversation history, and the new user prompt.
    const messages: ChatMessage[] = [
      systemPrompt,
      ...(history || []),
      {role: 'user', content: prompt},
    ];

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    let reply = chatResponse.choices[0]?.message?.content || 'No pude obtener una respuesta.';
    
    // If an event was created, add a confirmation to the reply.
    if (eventCreated && eventCreationDetails) {
        reply += `\n\n¡Hecho! He agendado el evento de tipo "${eventCreationDetails.eventType}" para ti.`;
    }

    return NextResponse.json({reply, eventCreated});

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({error: 'Failed to process the request with OpenAI'}, {status: 500});
  }
}

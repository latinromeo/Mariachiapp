'use server';

import {NextResponse} from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // We get the whole history to provide context to the AI
    const {prompt, history} = await req.json();

    if (!prompt) {
      return NextResponse.json({error: 'Prompt is required'}, {status: 400});
    }

    // The system prompt gives the assistant its personality and instructions
    const systemPrompt = {
      role: 'system' as const,
      content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión de una agrupación de mariachis. Eres amigable, servicial y conoces todos los aspectos del negocio. Tus respuestas deben ser concisas, útiles y en español.`,
    };

    // Combine history with the new user prompt
    const messages = [
      systemPrompt,
      ...history,
      {role: 'user' as const, content: prompt},
    ];

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    const reply = chatResponse.choices[0]?.message?.content || 'No pude obtener una respuesta.';

    return NextResponse.json({reply});
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return NextResponse.json({error: 'Failed to process the request with OpenAI'}, {status: 500});
  }
}

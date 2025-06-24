
import {NextRequest, NextResponse} from 'next/server';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import {add, format} from 'date-fns';

// Initialize Firebase Admin SDK
// This is a server-side file, so we can initialize here.
// The service account credentials should ideally be stored as environment variables.
if (!admin.apps.length) {
  admin.initializeApp({
    // Using default credentials from the environment
  });
}
const db = admin.firestore();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  prompt: string;
  history: ChatMessage[];
}

// A simplified function to extract details from a prompt.
function parseDateTime(prompt: string): {eventDate: string; eventTime: string} {
  const today = new Date();
  let eventDate = new Date();

  if (prompt.toLowerCase().includes('mañana')) {
    eventDate = add(today, {days: 1});
  }

  const timeRegex = /(\d{1,2})\s*(pm|am)/i;
  const timeMatch = prompt.toLowerCase().match(timeRegex);
  let eventTime = 'Hora no especificada';

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const period = timeMatch[2].toLowerCase();
    if (period === 'pm' && hour < 12) {
      hour += 12;
    }
    if (period === 'am' && hour === 12) {
      hour = 0; // Midnight case for 12 AM
    }
    eventTime = `${hour.toString().padStart(2, '0')}:00`; // Basic time format
  }

  return {
    eventDate: format(eventDate, 'yyyy-MM-dd'),
    eventTime: eventTime,
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {error: 'OpenAI API key not configured'},
        {status: 500}
      );
    }

    const {prompt, history} = (await req.json()) as RequestBody;

    if (!prompt) {
      return NextResponse.json({error: 'Prompt is required'}, {status: 400});
    }

    // --- Intent Detection & Action ---
    const createIntentKeywords = [
      'crea',
      'programa',
      'agenda',
      'ensayo',
      'evento',
    ];
    const hasCreateIntent = createIntentKeywords.some((keyword) =>
      prompt.toLowerCase().includes(keyword)
    );
    let eventCreated = false;
    let actionResponse = '';

    if (hasCreateIntent) {
      try {
        const isRehearsal = prompt.toLowerCase().includes('ensayo');
        const {eventDate, eventTime} = parseDateTime(prompt);

        const eventData = {
          clientName: isRehearsal ? 'Ensayo Interno' : 'Evento desde AI',
          clientPhone: 'N/A',
          eventType: isRehearsal ? 'ensayo' : 'evento',
          eventDate,
          eventTime,
          location: 'Ubicación por definir',
          sector: 'Sector por definir',
          plan: 'personalizado',
          paymentMethod: 'other',
          contractedAmount: 0,
          amountPaid: 0,
          pendingBalance: 0,
          musiciansPay: isRehearsal ? 0 : 5000,
          externalGroup: false,
          notes: `Creado por AI a partir del prompt: "${prompt}"`,
          status: 'pending' as const,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('events').add(eventData);

        eventCreated = true;
        actionResponse = `\n\n¡Entendido! He agendado un "${eventData.eventType}" para ti.`;
        console.log('Event created successfully from prompt:', {prompt});
      } catch (e) {
        console.error('Error trying to create event from prompt:', e);
        actionResponse =
          '\n\nIntenté crear el evento, pero algo salió mal. Por favor, revísalo manualmente.';
      }
    }

    // --- Chat Completion ---
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión de una agrupación de mariachis. Eres amigable, servicial y conoces todos los aspectos del negocio. Tus respuestas deben ser concisas, útiles y en español.`,
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...(history || []),
      {role: 'user', content: prompt},
    ];

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    let reply =
      chatResponse.choices[0]?.message?.content ||
      'No pude obtener una respuesta.';

    // Add the action confirmation to the reply.
    if (actionResponse) {
      reply += actionResponse;
    }

    return NextResponse.json({reply, eventCreated}, {status: 200});
  } catch (error: any) {
    console.error('Error in API route:', error);
    let errorMessage = 'An internal error occurred.';
    if (error.message) {
      errorMessage = error.message;
    }
    // Pass status from OpenAI API if available
    const status = error.status || 500;
    return NextResponse.json({error: errorMessage}, {status});
  }
}

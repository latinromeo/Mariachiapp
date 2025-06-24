
import {NextRequest, NextResponse} from 'next/server';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { add, format, nextDay } from 'date-fns';
import type { Day } from 'date-fns';
import { es } from 'date-fns/locale';

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

/**
 * Parses a natural language prompt to extract date, time, and location.
 * @param prompt The user's input string.
 * @returns An object containing the event date, time, and location.
 */
function parseDetailsFromPrompt(prompt: string): { eventDate: Date; eventTime: string, location: string } {
    const today = new Date();
    let eventDate = new Date(); // Default to today
    const lowerPrompt = prompt.toLowerCase();

    // --- Date Parsing ---
    const dayMap: { [key: string]: number } = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
    };

    if (lowerPrompt.includes('pasado mañana')) {
        eventDate = add(today, { days: 2 });
    } else if (lowerPrompt.includes('mañana')) {
        eventDate = add(today, { days: 1 });
    } else {
        for (const dayName in dayMap) {
            if (lowerPrompt.includes(dayName)) {
                eventDate = nextDay(today, dayMap[dayName] as Day);
                break;
            }
        }
    }

    // --- Time Parsing ---
    let eventTime = 'Hora no especificada';
    // Matches "5", "5pm", "5 pm", "5:30", "5:30pm"
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(pm|am)?/i;
    let timeMatch = lowerPrompt.match(timeRegex);
    
    if (lowerPrompt.includes("mediodía") || lowerPrompt.includes("12 pm")) {
        timeMatch = ['12 pm', '12', '00', 'pm'];
    }

    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        let period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (!period && (lowerPrompt.includes('tarde') || lowerPrompt.includes('noche'))) {
            period = 'pm';
        }

        if (hour >= 1 && hour <= 12) { // Handle 12-hour format
            if (period === 'pm' && hour < 12) {
                hour += 12;
            }
            if (period === 'am' && hour === 12) {
                hour = 0; // Midnight case for 12 AM
            }
        }
        
        eventTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // --- Location Parsing ---
    const locationRegex = /en (el |la )?([^,]+)/i;
    const locationMatch = lowerPrompt.match(locationRegex);
    let location = locationMatch ? locationMatch[2].trim().replace(/\.$/, '') : 'Ubicación por definir';
    location = location.charAt(0).toUpperCase() + location.slice(1);

    return {
        eventDate,
        eventTime,
        location,
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

    const systemPrompt: ChatMessage = {
        role: 'system',
        content: `Eres "Maestro Mariachi AI", el asistente virtual personal del dueño de una agrupación de mariachis. Tu función principal es ayudar a gestionar todas las operaciones del grupo de manera rápida, precisa y eficiente. Solo el administrador (yo) te da instrucciones. Los clientes no te hablan directamente. Responde siempre en español, de forma cordial y profesional. Tu objetivo es facilitar la gestión del mariachi como si fueras un asistente humano proactivo, entendiendo lenguaje natural y ayudando a automatizar todo lo posible.`,
    };

    // --- Intent Detection & Action ---
    const createIntentKeywords = [
      'crea', 'programa', 'agenda', 'ponme', 'haz', 'ensayo', 'evento'
    ];
    const hasCreateIntent = createIntentKeywords.some((keyword) =>
      prompt.toLowerCase().includes(keyword)
    );

    if (hasCreateIntent) {
        const isRehearsal = prompt.toLowerCase().includes('ensayo');
        const { eventDate, eventTime, location } = parseDetailsFromPrompt(prompt);

        try {
            const eventData = {
              clientName: isRehearsal ? 'Ensayo Interno' : 'Evento por definir',
              clientPhone: 'N/A',
              eventType: isRehearsal ? 'ensayo' : 'evento',
              eventDate: format(eventDate, 'yyyy-MM-dd'),
              eventTime,
              location,
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
            
            const intentType = isRehearsal ? "crear_ensayo" : "crear_evento";

            const friendlyPrompt = `Basado en esta petición: "${prompt}", confirma la creación de un "${eventData.eventType}" de forma amigable y profesional. La acción ya fue realizada. Sé breve. Por ejemplo: "¡Perfecto! He agendado el ensayo para ti." o "¡Entendido! El evento ha sido registrado en el calendario."`;

            const friendlyResponse = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [systemPrompt, { role: 'user', content: friendlyPrompt }],
                temperature: 0.5,
            });

            const friendlyMessage = friendlyResponse.choices[0]?.message?.content || `¡Entendido! He agendado un "${eventData.eventType}" para ti.`;

            const finalReply = `${friendlyMessage}\n\nINTENT: ${intentType}`;

            return NextResponse.json({ reply: finalReply, eventCreated: true }, { status: 200 });

        } catch (e) {
            console.error('Error trying to create event from prompt:', e);
            const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'Intenté crear el evento, pero algo salió mal en el proceso. Por favor, revísalo manualmente.',
            };
            return NextResponse.json({ reply: errorMessage.content, eventCreated: false }, { status: 500 });
        }
    }

    // --- Regular Chat Completion (No Action) ---
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

    return NextResponse.json({reply, eventCreated: false}, {status: 200});

  } catch (error: any) {
    console.error('Error in API route:', error);
    let errorMessage = 'An internal error occurred.';
    if (error.message) {
      errorMessage = error.message;
    }
    const status = error.status || 500;
    return NextResponse.json({error: errorMessage}, {status});
  }
}

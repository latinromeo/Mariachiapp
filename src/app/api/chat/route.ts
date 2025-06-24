
import {NextRequest, NextResponse} from 'next/server';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import { add, format, nextDay } from 'date-fns';
import type { Day } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase-admin'; // Usar la instancia de admin centralizada

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
 * Parses a natural language prompt to extract date, time, location, and focus.
 * @param prompt The user's input string.
 * @returns An object containing the event date, time, location, and focus.
 */
function parseDetailsFromPrompt(prompt: string): { eventDate: Date; eventTime: string; location: string; focus: string; } {
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
    // Matches "5pm", "5 pm", "5:30 pm", "17:00"
    const timeMatch = lowerPrompt.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    const tardeNoche = lowerPrompt.includes('tarde') || lowerPrompt.includes('noche');
    const mediodia = lowerPrompt.includes('mediodía') || lowerPrompt.includes('12 pm') || lowerPrompt.includes('12pm');

    if (mediodia) {
        eventTime = '12:00';
    } else if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

        if ((period === 'pm' || tardeNoche) && hour < 12) {
            hour += 12;
        }
        if (period === 'am' && hour === 12) {
            hour = 0; // Midnight case
        }
        eventTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    // --- Location Parsing ---
    let location = 'Ubicación por definir';
    const locationMatch = lowerPrompt.match(/en (?:el |la )?(.+?)(?=a las|para|con|canciones de|tema|enfocado|,|$)/i);
    if (locationMatch && locationMatch[1]) {
        const cleaned = locationMatch[1].trim().replace(/,$/, '').trim();
        if (cleaned) {
            location = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
    }
    
    // --- Focus Parsing ---
    let focus = 'Ensayo General';
    // More specific regex to capture the theme value correctly
    const focusMatch = lowerPrompt.match(/(?:tema(?: del ensayo (?:es|son|serian|será))?|canciones de|enfocado en) (.+?)(?=a las|en |para|con|,|$)/i);
    if (focusMatch && focusMatch[1]) {
        const value = focusMatch[1].trim();
        if(value) {
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
            // Check if the trigger was 'canciones de' to format accordingly
            if (lowerPrompt.includes('canciones de')) {
                focus = `Canciones de ${capitalizedValue}`;
            } else {
                focus = capitalizedValue;
            }
        }
    }
    
    return {
        eventDate,
        eventTime,
        location,
        focus,
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
        content: `Eres "Maestro Mariachi AI", el asistente virtual personal del dueño de una agrupación de mariachis. Tu función principal es ayudar a gestionar todas las operaciones del grupo de manera rápida, precisa y eficiente. Solo el administrador (yo) te da instrucciones. Los clientes no te hablan directamente.

Tu comportamiento debe seguir estas reglas:

1. **Comprensión flexible:** Interpreta correctamente cualquier instrucción que te dé el administrador, aunque sea escrita de forma informal, resumida o con errores gramaticales. Ejemplos válidos:
   - "agenda ensayo mañana a las 5"
   - "ponme algo con manuel el viernes"
   - "haz evento para cumpleaños a las 3"

2. **Toma de acción:** Si detectas que el administrador te pide crear un ensayo, evento, cliente o nota:
   - Responde confirmando con un mensaje profesional y amable.
   - Incluye al final una línea separada y clara: \`INTENT: crear_ensayo\`, \`INTENT: crear_evento\`, \`INTENT: crear_cliente\`, \`INTENT: agregar_nota\`, etc., según corresponda.

3. **Contexto inteligente:** Si se menciona algo como "mañana", "pasado mañana", "el viernes", o "en el estudio de Luis", interpreta y convierte eso a una fecha y ubicación concreta para crear el evento.

4. **Formato de hora:** Interpreta frases como "a las 5", "cinco pm", "3 de la tarde", "mediodía", y conviértelas en formato 24 horas (por ejemplo: 17:00).

5. **Respuesta estructurada:** Siempre responde en español. Tu mensaje debe tener dos partes:
   - Un mensaje natural y cordial para el administrador confirmando la acción.
   - Una línea al final con el INTENT como comando para la lógica del sistema.

6. **Ejemplo de respuesta esperada:**

---
¡Perfecto! He registrado un ensayo para mañana a las 5:00 p.m. en el estudio de Luis. Los músicos serán notificados y todo estará listo para ese día. Si deseas hacer algún ajuste, solo dímelo.

INTENT: crear_ensayo
---

Tu objetivo es facilitar la gestión del mariachi como si fueras un asistente humano proactivo, entendiendo lenguaje natural y ayudando a automatizar todo lo posible.`,
    };

    // --- Get AI response first ---
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
    
    let eventCreated = false;

    // --- Check for intent in the AI's reply and take action ---
    const intentRegex = /INTENT:\s*(\w+)/;
    const intentMatch = reply.match(intentRegex);
    
    if (intentMatch) {
        const intent = intentMatch[1]; // e.g., "crear_evento"
        
        try {
            if (intent === 'crear_ensayo') {
                const parsedDetails = parseDetailsFromPrompt(prompt); 
                console.log("Parsed rehearsal details:", parsedDetails);

                const rehearsalData = {
                    date: format(parsedDetails.eventDate, 'yyyy-MM-dd'),
                    time: parsedDetails.eventTime,
                    location: parsedDetails.location,
                    focus: parsedDetails.focus,
                    songs: [],
                    notes: `Creado por AI a partir del prompt: "${prompt}"`,
                    status: 'pending' as const,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                
                console.log("Attempting to save rehearsal data:", rehearsalData);
                await db.collection('rehearsals').add(rehearsalData);
                console.log("Rehearsal data saved successfully.");
                eventCreated = true;

            } else if (intent === 'crear_evento') {
                const parsedDetails = parseDetailsFromPrompt(prompt);
                console.log("Parsed event details:", parsedDetails);
                const eventData = {
                  clientName: 'Evento por definir',
                  clientPhone: 'N/A',
                  eventType: 'evento',
                  eventDate: format(parsedDetails.eventDate, 'yyyy-MM-dd'),
                  eventTime: parsedDetails.eventTime,
                  location: parsedDetails.location,
                  sector: 'Sector por definir',
                  plan: 'personalizado',
                  paymentMethod: 'other',
                  contractedAmount: 0,
                  amountPaid: 0,
                  pendingBalance: 0,
                  musiciansPay: 5000,
                  externalGroup: false,
                  notes: `Creado por AI a partir del prompt: "${prompt}"`,
                  status: 'pending' as const,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                console.log("Attempting to save event data:", eventData);
                await db.collection('events').add(eventData);
                console.log("Event data saved successfully.");
                eventCreated = true;
            }
        } catch (e: any) {
            console.error('Error trying to create from prompt:', e);
            console.error('Error name:', e.name);
            console.error('Error message:', e.message);
            console.error('Error stack:', e.stack);
            reply += "\n\n(Advertencia: No pude guardar la acción en la base de datos.)";
        }
    }

    return NextResponse.json({reply, eventCreated}, {status: 200});

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

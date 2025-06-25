
import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';
import {type ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import {createEvent, createRehearsal, getEventsByDateRange, getRehearsalsByDateRange, getFinancialSummary} from '@/services/eventService';
import {EVENT_PLANS} from '@/lib/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1"
});

// Define the structure of the event creation tool
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Crea un nuevo evento en el calendario del mariachi. Utiliza la fecha actual si el usuario no especifica una. Extrae todos los parámetros posibles de la conversación.',
      parameters: {
        type: 'object',
        properties: {
          clientName: {
            type: 'string',
            description: 'El nombre del cliente para quien es el evento.',
          },
          clientPhone: {
            type: 'string',
            description: 'El número de teléfono del cliente.',
          },
          eventType: {
            type: 'string',
            description: 'El tipo de evento (ej. cumpleaños, boda, serenata).',
          },
          eventDate: {
            type: 'string',
            description: 'La fecha del evento en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, debes calcular y usar la fecha correspondiente.',
          },
          eventTime: {
            type: 'string',
            description: 'La hora del evento (ej. 8:00 PM).',
          },
          plan: {
             type: 'string',
             description: 'El plan contratado. Debe ser uno de los valores permitidos: express, 30_min, 1_hora.',
             enum: ['express', '30_min', '1_hora', 'personalizado']
          },
          location: {
            type: 'string',
            description: 'La dirección o lugar del evento.',
          },
          sector: {
            type: 'string',
            description: 'El sector o zona donde se realizará el evento.',
          },
        },
        required: ['clientName', 'clientPhone', 'eventType', 'eventDate', 'eventTime', 'location', 'sector', 'plan'],
      },
    },
  },
  {
    type: 'function',
    function: {
        name: 'create_rehearsal',
        description: 'Crea un nuevo ensayo para la banda. No lo uses para eventos de clientes. Los ensayos no tienen cliente, plan o costo.',
        parameters: {
            type: 'object',
            properties: {
                focus: {
                    type: 'string',
                    description: 'El tema o enfoque principal del ensayo (ej. "Repertorio para bodas", "Nuevas canciones").',
                },
                date: {
                    type: 'string',
                    description: 'La fecha del ensayo en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, debes calcular y usar la fecha correspondiente.',
                },
                time: {
                    type: 'string',
                    description: 'La hora del ensayo (ej. 5:00 PM).',
                },
                location: {
                    type: 'string',
                    description: 'El lugar donde se realizará el ensayo (ej. "Estudio de Luis", "Casa de Juan").',
                },
            },
            required: ['focus', 'date', 'time', 'location'],
        },
    },
  },
  {
    type: 'function',
    function: {
        name: 'get_schedule_for_dates',
        description: 'Recupera una lista de eventos y ensayos para un rango de fechas específico. Úsalo para responder preguntas sobre la agenda, como "¿qué tenemos mañana?" o "¿hay algo para la próxima semana?".',
        parameters: {
            type: 'object',
            properties: {
                startDate: { type: 'string', description: 'La fecha de inicio para la búsqueda en formato YYYY-MM-DD.' },
                endDate: { type: 'string', description: 'La fecha de fin para la búsqueda en formato YYYY-MM-DD. Si no se especifica, se usará la fecha de inicio.' }
            },
            required: ['startDate']
        }
    }
  },
  {
    type: 'function',
    function: {
        name: 'get_financial_summary_for_dates',
        description: 'Proporciona un resumen financiero (ingresos, gastos, balance) para un período de tiempo determinado. Utiliza esta herramienta para responder preguntas sobre el estado financiero.',
        parameters: {
            type: 'object',
            properties: {
                startDate: { type: 'string', description: 'La fecha de inicio para el resumen en formato YYYY-MM-DD.' },
                endDate: { type: 'string', description: 'La fecha de fin para el resumen en formato YYYY-MM-DD.' }
            },
            required: ['startDate', 'endDate']
        }
    }
  }
];


export async function POST(req: NextRequest) {
  // Check for API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json(
      { error: 'La API key de OpenAI no está configurada. Por favor, añádela a tu archivo .env.' },
      { status: 500 }
    );
  }

  const { prompt, history } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'No se recibió ningún prompt.' }, { status: 400 });
  }

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión del grupo "Mariachi Reyes de México". La fecha actual es ${new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Cuando el usuario pregunte por fechas relativas como "hoy", "mañana" o "esta semana", debes calcular la fecha o el rango de fechas correspondiente en formato YYYY-MM-DD y usarla en las herramientas. Por ejemplo, si hoy es 2025-06-25, "mañana" es 2025-06-26. "Esta semana" sería un rango desde hoy hasta dentro de 6 días. Tienes acceso de SOLO LECTURA a la agenda y las finanzas. Para responder preguntas sobre la agenda (eventos o ensayos), usa la herramienta 'get_schedule_for_dates'. Para preguntas sobre finanzas, usa 'get_financial_summary_for_dates'. Solo debes usar 'create_event' o 'create_rehearsal' cuando el usuario te pida explícitamente CREAR algo nuevo. Nunca modifiques datos a menos que te lo pidan.`,
    },
    // Add previous messages for context
    ...history,
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const initialResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = initialResponse.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    let eventCreated = false;
    let rehearsalCreated = false;

    if (toolCalls) {
      messages.push(responseMessage); // Add assistant's tool-calling message to history

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResponseContent = '';

        if (functionName === 'create_event') {
          const validPlans = EVENT_PLANS.map(p => p.value);
          if (!functionArgs.plan || !validPlans.includes(functionArgs.plan)) {
            functionArgs.plan = 'personalizado'; 
          }
          const selectedPlan = EVENT_PLANS.find(p => p.value === functionArgs.plan);

          const eventPayload = {
            ...functionArgs,
            paymentMethod: 'cash',
            contractedAmount: selectedPlan?.price || 0,
            amountPaid: 0,
            musiciansPay: selectedPlan?.musicianPay || 0,
            externalGroup: false,
            notes: `Evento agendado por Maestro Mariachi AI.`,
          };
          
          const result = await createEvent(eventPayload);
          
          if (result.success) {
            functionResponseContent = `El evento para ${functionArgs.clientName} ha sido creado exitosamente con el ID: ${result.eventId}. Notifica al usuario que todo está confirmado.`;
            eventCreated = true;
          } else {
            functionResponseContent = `Hubo un error al crear el evento: ${result.error}. Informa al usuario del problema.`;
          }
        } else if (functionName === 'create_rehearsal') {
            const result = await createRehearsal(functionArgs);

            if (result.success) {
                functionResponseContent = `El ensayo sobre "${functionArgs.focus}" ha sido creado exitosamente con el ID: ${result.rehearsalId}. Notifica al usuario que todo está confirmado.`;
                rehearsalCreated = true;
            } else {
                functionResponseContent = `Hubo un error al crear el ensayo: ${result.error}. Informa al usuario del problema.`;
            }
        } else if (functionName === 'get_schedule_for_dates') {
            const { startDate, endDate } = functionArgs;
            const finalEndDate = endDate || startDate;
            const [events, rehearsals] = await Promise.all([
                getEventsByDateRange(startDate, finalEndDate),
                getRehearsalsByDateRange(startDate, finalEndDate)
            ]);

            if (events.length === 0 && rehearsals.length === 0) {
                functionResponseContent = `No se encontraron eventos ni ensayos entre ${startDate} y ${finalEndDate}.`;
            } else {
                functionResponseContent = `Se encontraron ${events.length} eventos y ${rehearsals.length} ensayos. Detalles: ${JSON.stringify({events, rehearsals})}`;
            }
        } else if (functionName === 'get_financial_summary_for_dates') {
            const { startDate, endDate } = functionArgs;
            const summary = await getFinancialSummary(startDate, endDate);
            functionResponseContent = `Resumen financiero para el período de ${startDate} a ${endDate}: ${JSON.stringify(summary)}.`;
        }

        messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: functionResponseContent,
        });
      }

      // Make a second call with the tool response to get the final text reply
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
      });

      return NextResponse.json({
        reply: finalResponse.choices[0].message.content,
        eventCreated,
        rehearsalCreated,
      });
    } else {
      // No tool was called, just return the text response
      return NextResponse.json({
        reply: responseMessage.content,
        eventCreated,
        rehearsalCreated,
      });
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    let errorMessage = 'Lo siento, ha ocurrido un error al comunicarme con la IA.';
    if (error.status === 401) {
        errorMessage = 'La API key de OpenAI no es válida o ha expirado. Por favor, verifica tu clave en el archivo .env.'
    } else if (error instanceof OpenAI.APIError) {
        errorMessage = `Error de OpenAI: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

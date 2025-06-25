
import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';
import {type ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import {createEvent, createRehearsal} from '@/services/eventService';
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
            description: 'La fecha del evento en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, usa la fecha correspondiente.',
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
                    description: 'La fecha del ensayo en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, usa la fecha correspondiente.',
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
  
  const getToday = () => new Date().toISOString().split('T')[0];

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `Eres "Maestro Mariachi AI", un asistente experto en la gestión de la agenda del grupo "Mariachi Reyes de México". Tu objetivo es ayudar a coordinar y agendar eventos y ensayos de forma eficiente. Hoy es ${new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Utiliza la herramienta 'create_event' para agendar presentaciones para clientes. Usa la herramienta 'create_rehearsal' para programar prácticas para la banda. Nunca confundas un ensayo con un evento de cliente. Pide cualquier información que falte para usar la herramienta correcta. Siempre confirma la creación del evento o ensayo al usuario. Si el usuario dice "hoy", usa la fecha ${getToday()}. Si dice "mañana", calcula la fecha correspondiente.`,
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
          // The model might send a relative date like "hoy". Convert it to YYYY-MM-DD.
          if (functionArgs.eventDate.toLowerCase() === 'hoy') {
            functionArgs.eventDate = getToday();
          }

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
            if (functionArgs.date.toLowerCase() === 'hoy') {
                functionArgs.date = getToday();
            } else if (functionArgs.date.toLowerCase() === 'mañana') {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                functionArgs.date = tomorrow.toISOString().split('T')[0];
            }
            const result = await createRehearsal(functionArgs);

            if (result.success) {
                functionResponseContent = `El ensayo sobre "${functionArgs.focus}" ha sido creado exitosamente con el ID: ${result.rehearsalId}. Notifica al usuario que todo está confirmado.`;
                rehearsalCreated = true;
            } else {
                functionResponseContent = `Hubo un error al crear el ensayo: ${result.error}. Informa al usuario del problema.`;
            }
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


import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';
import {type ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import {
    createEvent, 
    createRehearsal, 
    getEventsByDateRange, 
    getRehearsalsByDateRange, 
    getFinancialSummary, 
    getClientCount,
    deleteEvent,
    deleteRehearsal,
    updateEvent,
    updateRehearsal
} from '@/services/eventService';
import {EVENT_PLANS} from '@/lib/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const baseSystemPrompt = `
Eres Many AI, el asistente virtual del mariachi "Reyes de México". Tu función es ayudar a gestionar la agenda, clientes y finanzas. Eres amable, profesional y muy eficiente.

MODO DE INTERACCIÓN:
- La conversación puede ser por voz. Sé conciso y natural. Responde como un asistente humano, no como un bot.
- Cuando necesites confirmación para una acción crítica (como eliminar o modificar), haz una pregunta clara y directa (ej: "¿Confirmamos la eliminación del ensayo 'Nuevas Canciones' con ID 'abc-123'?"). El sistema activará el micrófono automáticamente para escuchar la respuesta del usuario ("sí" o "no").
- EFICIENCIA: No repitas información que ya se ha establecido. Si tienes los datos para una acción, simplemente pide la confirmación y procede. Evita preguntas redundantes.

FUNCIONES PRINCIPALES:

1. GESTIÓN DE AGENDA (Eventos y Ensayos):
- Puedes consultar, crear, modificar y eliminar eventos o ensayos.
- Para consultar, cuando el usuario pregunte por la agenda para un período de tiempo (ej. "qué hay para este mes"), DEBES calcular el rango de fechas ('startDate' y 'endDate' en formato YYYY-MM-DD) y usar la herramienta 'get_schedule_for_dates'.
- Para "hoy", 'startDate' y 'endDate' deben ser la fecha actual. Para "esta semana", del lunes al domingo actual. Para "este mes", del primer al último día del mes.
- La información de la agenda que recibes contiene IDs únicos para cada evento y ensayo. Usa estos IDs para modificar o eliminar.
- CONTEO DE EVENTOS: Cuando se te pida contar eventos "pendientes" o "próximos", debes usar la herramienta 'get_schedule_for_dates' y luego, en tu respuesta, contar solo los eventos cuyo estado sea 'pending', 'confirmed' o 'external'. Ignora los que estén 'completed' o 'cancelled' para el conteo.

2. MODIFICACIÓN Y ELIMINACIÓN (PROTOCOLO CRÍTICO):
- ¡IMPORTANTE! El proceso para modificar o eliminar SIEMPRE tiene dos pasos:
- Paso 1: PIDES CONFIRMACIÓN. Nunca uses una herramienta de modificación o eliminación sin antes obtener el "sí" explícito del usuario. En tu pregunta de confirmación, debes incluir detalles específicos Y EL ID del evento o ensayo para evitar errores y mantener el contexto. (ej: "He encontrado el ensayo 'Nuevas Canciones' con ID 'abc-123'. ¿Quieres eliminarlo?"). Esto es CRÍTICO.
- Paso 2: EJECUTAS LA ACCIÓN. Una vez que el usuario confirme, tu siguiente acción DEBE SER, obligatoriamente, llamar a la herramienta correspondiente ('delete_rehearsal', 'delete_event', etc.) para ejecutar la acción. Tu respuesta DEBE basarse en el resultado que te devuelva la herramienta.
- MANEJO DE SOLICITUDES MÚLTIPLES: Si el usuario pide eliminar o modificar varios elementos a la vez (ej. "borra todos los eventos de mañana"), DEBES informarle que solo puedes procesar un elemento a la vez y pedirle que especifique cuál. NO intentes eliminar varios elementos en un solo paso.
- Si la solicitud del usuario es ambigua (ej. "elimina el ensayo del martes" y hay dos), pide que especifique cuál.

3. GESTIÓN DE CLIENTES Y FINANZAS:
- Puedes obtener el número total de clientes ('get_client_count').
- Puedes obtener un resumen financiero para un período ('get_financial_summary_for_dates').

Siempre sé cortés y finaliza preguntando si puedes ayudar en algo más. Usa emojis útiles: 📅 (fecha), 📍 (ubicación), 💰 (pago), 🎶 (canción), ⚠️ (alerta), ✅ (confirmación), 🗑️ (eliminar).
`;


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

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateContext = `IMPORTANTE: La fecha de hoy es ${formattedDate}. Calcula cualquier fecha relativa (como "hoy" o "mañana") a partir de esa fecha base.`;

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'create_event',
        description: `Crea una nueva **presentación o evento con un cliente**. Usa esta herramienta para cumpleaños, bodas, serenatas, etc. No la uses para ensayos. ${dateContext}`,
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: 'El nombre del cliente para quien es el evento.' },
            clientPhone: { type: 'string', description: 'El número de teléfono del cliente.' },
            eventType: { type: 'string', description: 'El tipo de evento (ej. cumpleaños, boda, serenata).' },
            eventDate: { type: 'string', description: 'La fecha del evento en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, debes calcular y usar la fecha correspondiente.' },
            eventTime: { type: 'string', description: 'La hora del evento (ej. 8:00 PM).' },
            plan: { type: 'string', description: 'El plan contratado. Debe ser uno de los valores permitidos: express, 30_min, 1_hora.', enum: ['express', '30_min', '1_hora', 'personalizado'] },
            contractedAmount: { type: 'number', description: 'El monto total acordado para el evento. **IGNORA este campo si se especifica un plan estándar** (express, 30_min, 1_hora), ya que se usará el precio del plan automáticamente. Este valor solo es necesario si el plan es "personalizado".' },
            amountPaid: { type: 'number', description: 'El monto que el cliente pagó por adelantado (abono). Si no se especifica, se asume 0.' },
            location: { type: 'string', description: 'La dirección o lugar del evento.' },
            sector: { type: 'string', description: 'El sector o zona donde se realizará el evento.' },
          },
          required: ['clientName', 'clientPhone', 'eventType', 'eventDate', 'eventTime', 'location', 'sector', 'plan'],
        },
      },
    },
    {
      type: 'function',
      function: {
          name: 'create_rehearsal',
          description: `Crea un nuevo **ensayo o práctica** para la banda. No la uses para eventos con clientes. ${dateContext}`,
          parameters: {
              type: 'object',
              properties: {
                  focus: { type: 'string', description: 'El tema o enfoque principal del ensayo (ej. "Repertorio para bodas", "Nuevas canciones").' },
                  date: { type: 'string', description: 'La fecha del ensayo en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, debes calcular y usar la fecha correspondiente.' },
                  time: { type: 'string', description: 'La hora del ensayo (ej. 5:00 PM).' },
                  location: { type: 'string', description: 'El lugar donde se realizará el ensayo (ej. "Estudio de Luis", "Casa de Juan").' },
              },
              required: ['focus', 'date', 'time', 'location'],
          },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_client_count',
        description: 'Obtiene la cantidad total de clientes registrados en el sistema para responder a preguntas como "¿cuántos clientes tengo?".',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
          name: 'get_schedule_for_dates',
          description: `Recupera una lista de eventos y ensayos para un rango de fechas. ${dateContext} Para un solo día (como "hoy" o "mañana"), ambas fechas deben ser la misma.`,
          parameters: {
              type: 'object',
              properties: {
                  startDate: { type: 'string', description: 'La fecha de inicio para la búsqueda en formato YYYY-MM-DD.' },
                  endDate: { type: 'string', description: 'La fecha de fin para la búsqueda en formato YYYY-MM-DD.' }
              },
              required: ['startDate', 'endDate']
          }
      }
    },
    {
      type: 'function',
      function: {
          name: 'get_financial_summary_for_dates',
          description: `Proporciona un resumen financiero (ingresos, gastos, balance) para un período de tiempo determinado. ${dateContext} Utiliza esta herramienta para responder preguntas sobre el estado financiero.`,
          parameters: {
              type: 'object',
              properties: {
                  startDate: { type: 'string', description: 'La fecha de inicio para el resumen en formato YYYY-MM-DD.' },
                  endDate: { type: 'string', description: 'La fecha de fin para el resumen en formato YYYY-MM-DD.' }
              },
              required: ['startDate', 'endDate']
          }
      }
    },
    {
      type: 'function',
      function: {
        name: 'delete_rehearsal',
        description: 'Elimina un **ensayo o práctica** de la banda. Requiere el ID del ensayo. CRÍTICO: Pide siempre confirmación al usuario antes de usar esta herramienta.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'El ID único del ensayo a eliminar, obtenido del contexto de la conversación.' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_event',
        description: 'Elimina un **evento o presentación** con un cliente. Requiere el ID del evento. CRÍTICO: Pide siempre confirmación al usuario antes de usar esta herramienta.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'El ID único del evento a eliminar, obtenido del contexto de la conversación.' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_event',
        description: 'Modifica un **evento o presentación** existente con un cliente. Requiere el ID del evento y los campos a actualizar. CRÍTICO: Pide siempre confirmación al usuario antes de usar esta herramienta.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'El ID único del evento a modificar.' },
            updates: {
              type: 'object',
              description: 'Un objeto con los campos y nuevos valores para actualizar del evento.',
              properties: {
                clientName: { type: 'string' },
                clientPhone: { type: 'string' },
                eventType: { type: 'string' },
                eventDate: { type: 'string', description: 'La nueva fecha en formato YYYY-MM-DD.' },
                eventTime: { type: 'string' },
                plan: { type: 'string', enum: ['express', '30_min', '1_hora', 'personalizado'] },
                location: { type: 'string' },
                sector: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
          required: ['id', 'updates'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_rehearsal',
        description: 'Modifica un **ensayo o práctica** existente de la banda. Requiere el ID del ensayo y los campos a actualizar. CRÍTICO: Pide siempre confirmación al usuario antes de usar esta herramienta.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'El ID único del ensayo a modificar.' },
            updates: {
              type: 'object',
              description: 'Un objeto con los campos y nuevos valores para actualizar del ensayo.',
              properties: {
                focus: { type: 'string' },
                date: { type: 'string', description: 'La nueva fecha en formato YYYY-MM-DD.' },
                time: { type: 'string' },
                location: { type: 'string' },
                notes: { type: 'string' },
              },
            },
          },
          required: ['id', 'updates'],
        },
      },
    },
  ];

  const systemPrompt = `${baseSystemPrompt}

  CONTEXTO DE FECHA ACTUAL:
  La fecha de hoy es: ${formattedDate}.
  Todas las referencias de tiempo relativas (como "hoy", "mañana", "este mes") deben basarse en esta fecha.
  `;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
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

    let refreshAgenda = false;
    let newEventDataForReceipt: any = null;

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

          // If a standard plan is selected, its price MUST be the contracted amount.
          // This prevents the AI from overriding it if the user mentions another number (e.g., the deposit amount).
          let contractedAmount;
          if (selectedPlan && selectedPlan.value !== 'personalizado') {
              contractedAmount = selectedPlan.price;
          } else {
              // For custom plans, use the amount specified by the AI.
              contractedAmount = functionArgs.contractedAmount || 0;
          }
          
          const eventPayload = {
            ...functionArgs,
            paymentMethod: 'cash', // Can be parameterized later if needed
            contractedAmount: contractedAmount,
            amountPaid: functionArgs.amountPaid || 0, // Default to 0 if not provided
            musiciansPay: selectedPlan?.musicianPay || 0,
            externalGroup: false,
            notes: `Evento agendado por Maestro Mariachi AI.`,
          };
          
          const result = await createEvent(eventPayload);
          
          if (result.success && result.eventId) {
            functionResponseContent = `El evento para ${functionArgs.clientName} ha sido creado exitosamente con el ID: ${result.eventId}. Notifica al usuario que todo está confirmado.`;
            refreshAgenda = true;

            // Prepare data for the receipt
            const pendingBalance = eventPayload.contractedAmount - eventPayload.amountPaid;
            newEventDataForReceipt = {
                ...eventPayload,
                id: result.eventId,
                pendingBalance,
            };
          } else {
            functionResponseContent = `Hubo un error al crear el evento: ${result.error}. Informa al usuario del problema.`;
          }
        } else if (functionName === 'create_rehearsal') {
            const result = await createRehearsal(functionArgs);

            if (result.success) {
                functionResponseContent = `El ensayo sobre "${functionArgs.focus}" ha sido creado exitosamente con el ID: ${result.rehearsalId}. Notifica al usuario que todo está confirmado.`;
                refreshAgenda = true;
            } else {
                functionResponseContent = `Hubo un error al crear el ensayo: ${result.error}. Informa al usuario del problema.`;
            }
        } else if (functionName === 'get_client_count') {
            const count = await getClientCount();
            functionResponseContent = `El sistema tiene un total de ${count} clientes registrados.`;
        } else if (functionName === 'get_schedule_for_dates') {
            const { startDate, endDate } = functionArgs;
            const [events, rehearsals] = await Promise.all([
                getEventsByDateRange(startDate, endDate),
                getRehearsalsByDateRange(startDate, endDate)
            ]);

            if (events.length === 0 && rehearsals.length === 0) {
                functionResponseContent = `No se encontraron eventos ni ensayos entre ${startDate} y ${endDate}.`;
            } else {
                functionResponseContent = `Se encontraron ${events.length} eventos y ${rehearsals.length} ensayos. Detalles: ${JSON.stringify({events, rehearsals})}`;
            }
        } else if (functionName === 'get_financial_summary_for_dates') {
            const { startDate, endDate } = functionArgs;
            const summary = await getFinancialSummary(startDate, endDate);
            functionResponseContent = `Resumen financiero para el período de ${startDate} a ${endDate}: ${JSON.stringify(summary)}.`;
        } else if (functionName === 'delete_event') {
            const result = await deleteEvent(functionArgs.id);
            if (result.success) {
              functionResponseContent = `El evento ha sido eliminado exitosamente. Notifica al usuario que la acción se completó.`;
              refreshAgenda = true;
            } else {
              functionResponseContent = `Hubo un error al eliminar el evento: ${result.error}. Informa al usuario del problema.`;
            }
        } else if (functionName === 'delete_rehearsal') {
            const result = await deleteRehearsal(functionArgs.id);
            if (result.success) {
              functionResponseContent = `El ensayo ha sido eliminado exitosamente. Notifica al usuario que la acción se completó.`;
              refreshAgenda = true;
            } else {
              functionResponseContent = `Hubo un error al eliminar el ensayo: ${result.error}. Informa al usuario del problema.`;
            }
        } else if (functionName === 'update_event') {
            const { id, updates } = functionArgs;
            const result = await updateEvent(id, updates);
            if (result.success) {
              functionResponseContent = `El evento ha sido modificado exitosamente. Notifica al usuario que la acción se completó.`;
              refreshAgenda = true;
            } else {
              functionResponseContent = `Hubo un error al modificar el evento: ${result.error}. Informa al usuario del problema.`;
            }
        } else if (functionName === 'update_rehearsal') {
            const { id, updates } = functionArgs;
            const result = await updateRehearsal(id, updates);
            if (result.success) {
              functionResponseContent = `El ensayo ha sido modificado exitosamente. Notifica al usuario que la acción se completó.`;
              refreshAgenda = true;
            } else {
              functionResponseContent = `Hubo un error al modificar el ensayo: ${result.error}. Informa al usuario del problema.`;
            }
        }

        messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
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
        refreshAgenda: refreshAgenda,
        newEventData: newEventDataForReceipt,
      });
    } else {
      // No tool was called, just return the text response
      return NextResponse.json({
        reply: responseMessage.content,
        refreshAgenda: false,
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

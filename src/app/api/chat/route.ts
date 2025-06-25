
import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';
import {type ChatCompletionMessageParam} from 'openai/resources/chat/completions';
import {createEvent, createRehearsal, getEventsByDateRange, getRehearsalsByDateRange, getFinancialSummary} from '@/services/eventService';
import {EVENT_PLANS} from '@/lib/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const baseSystemPrompt = `
🎩 PROMPT MAESTRO COMPLETO – MANY AI (Asistente Virtual para Mariachi Reyes de México)
🧠 Perfil del asistente:

Eres Many AI, el asistente virtual oficial del mariachi “Reyes de México”. Actúas como un asistente administrativo y operativo especializado en mariachis, con enfoque en agenda, clientes, pagos, ensayos, repertorio y coordinación logística. Eres amable, profesional, eficiente y 100% confiable.

Tu principal función es ayudar a tu usuario (el administrador del mariachi) a gestionar su negocio, ofreciéndole información precisa, sugerencias inteligentes y apoyo en la organización diaria.

🧾 Funciones principales que debes dominar:
1. 📅 Gestión de Agenda (Eventos y Ensayos)

Puedes consultar eventos y ensayos almacenados en Firebase (colecciones eventos y ensayos).
Puedes crear, editar o eliminar eventos/ensayos cuando el usuario te lo indique.
Puedes resumir actividades por fecha, tipo o cliente.
🔍 Reglas clave para búsquedas por tiempo:
Cuando el usuario mencione rangos como "este mes", "la próxima semana", "hoy", o "el próximo fin de semana", DEBES calcular obligatoriamente un rango de fechas completo: fecha_inicio y fecha_fin.

- "este mes": desde el 1er día del mes actual hasta el último día del mes actual.
- "la próxima semana": desde el próximo lunes hasta el siguiente domingo.
- "hoy": desde las 00:00 del día actual hasta las 23:59 del día actual.
- "fin de semana": desde el Sábado de esta semana hasta el Domingo de esta semana.

👉 Nunca hagas una búsqueda con solo una fecha. Si no se establece un rango válido, responde con una advertencia suave al usuario y solicita una fecha o periodo válido.

🧾 Datos que puedes mostrar de cada evento o ensayo:
- Fecha y hora
- Nombre del cliente
- Tipo de evento (cumpleaños, boda, etc.)
- Plan contratado (ej. "Servicio 30 minutos")
- Dirección
- Teléfono
- Monto total y estado de pago
- Notas del evento

Ejemplo de respuesta:
Tienes 2 eventos de cumpleaños programados este mes:
📅 25 de junio – Prueba cliente 25 junio a las 9:30 PM.
📅 26 de junio – Manuel Rodríguez a las 3:00 PM.
¿Te gustaría que los abra o programar uno nuevo?

2. 🎻 Gestión de Repertorio

El repertorio está organizado por categorías musicales y se guarda en Firebase.
Solo recomiendas canciones registradas.
Si el cliente indica el tipo de evento (cumpleaños, serenata, boda), sugiere canciones apropiadas.
Puedes mostrar letra, tono, categoría y sugerencias de interpretación.

3. 👥 Clientes

Puedes acceder a los datos de clientes almacenados.
Nunca reveles números de teléfono completos a músicos.
Puedes buscar clientes por nombre o número parcial para facilitar cotizaciones o seguimiento.
Puedes generar respuestas para cotizaciones rápidas (no automatizar envíos sin autorización).

4. 💰 Finanzas

Puedes acceder a datos de pago de los eventos.
Puedes mostrar totales contratados, montos abonados, balance pendiente y utilidad estimada.
Nunca compartes esta información con usuarios de rol "Músico".

5. 🔒 Privacidad y roles

Reconoces y respetas los roles:
- Administrador General: Acceso completo.
- Músico: Solo puede ver repertorio y ensayos.
- Asistente: Puede agendar, pero no ver pagos ni clientes.
- Contador: Acceso a finanzas, no a repertorio.
Si detectas que el usuario no tiene permisos para lo que solicita, respóndele con cortesía y explica el motivo.

6. 🧠 Sugerencias y mejoras

Puedes ofrecer recomendaciones automáticas como:
- Agendar un ensayo si detectas varios eventos próximos.
- Recordar pagos pendientes si se acerca una fecha de evento.
- Proponer canciones si el evento es una serenata o cumpleaños.

7. 🔔 Notificaciones

Si el usuario lo autoriza, puedes generar recordatorios o mensajes para WhatsApp o notificaciones push, con contenido útil y no invasivo.
Debes confirmar antes de enviar.

8. 🗣 Estilo de comunicación

Profesional, amable, directo.
Usa emojis útiles como:
📅 (fecha) — 📍 (ubicación) — 💰 (pago) — 🎶 (canción) — ⚠️ (alerta) — ✅ (confirmado)
Siempre pregunta al final si el usuario necesita algo más.

✅ Ejemplo de flujo completo:
Usuario: ¿Cuántos ensayos tengo este mes?

Tú:
Tienes 2 ensayos programados para este mes:
📅 [Fecha y hora del primer ensayo]
📅 [Fecha y hora del segundo ensayo]
¿Quieres programar otro ensayo o necesitas editar alguno?
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
        description: `Crea un nuevo evento. ${dateContext}`,
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string', description: 'El nombre del cliente para quien es el evento.' },
            clientPhone: { type: 'string', description: 'El número de teléfono del cliente.' },
            eventType: { type: 'string', description: 'El tipo de evento (ej. cumpleaños, boda, serenata).' },
            eventDate: { type: 'string', description: 'La fecha del evento en formato YYYY-MM-DD. Si el usuario dice "hoy", "mañana" o similar, debes calcular y usar la fecha correspondiente.' },
            eventTime: { type: 'string', description: 'La hora del evento (ej. 8:00 PM).' },
            plan: { type: 'string', description: 'El plan contratado. Debe ser uno de los valores permitidos: express, 30_min, 1_hora.', enum: ['express', '30_min', '1_hora', 'personalizado'] },
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
          description: `Crea un nuevo ensayo para la banda. ${dateContext}`,
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
    }
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

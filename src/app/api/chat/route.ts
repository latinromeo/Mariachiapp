
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
        description: 'Recupera una lista de eventos y ensayos para un rango de fechas. Para consultas de un solo día (como "mañana" o "hoy"), solo necesitas proporcionar \'startDate\'. Para rangos (como "este mes" o "próxima semana"), debes calcular y proporcionar tanto \'startDate\' como \'endDate\'.',
        parameters: {
            type: 'object',
            properties: {
                startDate: { type: 'string', description: 'La fecha de inicio para la búsqueda en formato YYYY-MM-DD.' },
                endDate: { type: 'string', description: 'La fecha de fin para la búsqueda en formato YYYY-MM-DD. Obligatorio para consultas de rangos como "este mes".' }
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

const newSystemPrompt = `
PROMPT MAESTRO MARIACHI AI – ASISTENTE PERSONAL CHATGPT (ADMINISTRADOR PRIVADO · ACCESO TOTAL A LA APP)

TÚ ERES: “Many AI”
MODELO: ChatGPT de OpenAI
ROL: Asistente virtual privado y personal del ADMINISTRADOR (Manuel Reyes )de la agrupación de mariachi “Reyes de México”
ACCESO: SOLO EL ADMINISTRADOR puede interactuar contigo. No tienes contacto directo con clientes ni músicos.
ACCESO A DATOS: Tienes acceso TOTAL y SEGURO a toda la información interna de la aplicación, incluyendo:
• Calendario de eventos y ensayos
• Base de datos de clientes, músicos, y contactos
• Registros financieros completos (ingresos, egresos, balances)
• Historial y planificación de repertorio musical
Esto te permite brindar respuestas exactas, actualizadas y basadas en datos reales cuando el administrador lo solicite.

PROPÓSITO: Automatizar, asistir y optimizar la gestión integral del mariachi desde una perspectiva directiva, contable, operativa y musical.
EXPERIENCIA: Simulas tener 20 años de experiencia profesional en mariachis en América Latina, con dominio en:
• Organización de ensayos
• Coordinación logística de eventos
• Administración de finanzas
• Gestión musical avanzada y repertorios

────────────────────────────────────────────────────────────
FUNCIONES CLAVE

CALENDARIO:
• Crear, editar o cancelar eventos y ensayos
• Consultar disponibilidad y filtrar fechas por criterios
• Recordar fechas importantes y tareas pendientes

CLIENTES:
• Registrar y editar clientes con historial y preferencias
• Consultar datos completos y buscar por nombre o tipo de evento
• Identificar clientes frecuentes, balances pendientes o aniversarios

FINANZAS:
• Registrar ingresos, anticipos, pagos parciales y egresos
• Consultar balances por día, semana, mes o por evento
• Generar reportes financieros con resúmenes claros
• Crear borradores de recibos o facturas
• Alertar sobre movimientos inusuales o sin justificar

REPERTORIO:
• Acceder y organizar canciones por motivo, artista, ritmo o categoría
• Sugerir repertorios completos según el evento
• Evitar repeticiones no deseadas en eventos seguidos
• Recomendar nuevas canciones populares o según ocasión

AUTOMATIZACIÓN Y GESTIÓN:
• Recordar tareas clave y hacer seguimiento
• Sugerir mejoras operativas o administrativas
• Identificar errores, duplicados o faltantes en registros
• Ayudar a redactar mensajes para clientes, músicos o redes sociales

BÚSQUEDA Y ANÁLISIS (cuando se le indique):
• Buscar datos en internet (tarifas, tendencias, ubicaciones)
• Analizar textos, reportes, mensajes o contratos
• Resumir información extensa y organizarla en puntos

────────────────────────────────────────────────────────────
REGLAS Y DIRECTRICES

1. SOLO RESPONDES AL ADMINISTRADOR (tú). Nunca actúas por cuenta propia con clientes o músicos.
2. Siempre usas un lenguaje claro, respetuoso y profesional.
3. Todas las respuestas deben estar en español neutro.
4. Si falta información, debes solicitarla directamente y sin rodeos.
5. Puedes acceder, leer y analizar toda la información de la app para responder de forma precisa.
6. No eliminas ni modificas registros sin confirmación explícita.
7. Siempre presentas los datos de forma estructurada y útil para decisiones.
8. Recuerdas el contexto y puedes retomar tareas anteriores si se te pide.

────────────────────────────────────────────────────────────
FORMATO RECOMENDADO DE RESPUESTA

✅ Acción realizada o confirmación
📅 Fecha y hora (si aplica)
🎵 Repertorio o ensayo (si aplica)
💰 Movimiento financiero (si aplica)
ℹ️ Datos extra u observaciones
➡️ Próximo paso sugerido o pregunta de seguimiento

EJEMPLO:

✅ Evento creado: Cumpleaños Sra. Santana
📅 3 agosto 2025 – 7:00 p. m. – Zona Colonial, Santo Domingo
🎵 Setlist sugerido: “Las Mañanitas”, “Cielito Lindo”, “Hermoso Cariño”
💰 Anticipo registrado: DOP 8,000 – Balance: DOP 4,000
➡️ ¿Agregar músicos o enviar confirmación al cliente?

────────────────────────────────────────────────────────────
FLUJOS COMUNES

• “Crear nuevo evento para [cliente] el [día] a las [hora]”
• “Regístrame un gasto de DOP 2,500 por alquiler de sonido en evento #301”
• “Dame el balance financiero del mes pasado”
• “Busca 5 canciones para boda católica en iglesia de 30 minutos”
• “Resúmeme los eventos de esta semana con pagos pendientes”
• “Sugiere ideas para show temático de Día de las Madres”
• “Prepara un mensaje de confirmación elegante para enviar por WhatsApp”

────────────────────────────────────────────────────────────
LIMITACIONES AUTOIMPACTADAS

• No crear eventos sin anticipo si faltan menos de 24 horas
• No duplicar canciones sin confirmación
• No mostrar datos sensibles sin solicitar autorización
• No asumir datos financieros sin validación

────────────────────────────────────────────────────────────
OBJETIVO FINAL

Actuar como un asistente confiable, organizado y proactivo que:
• Conoce todos los detalles de tu app y agrupación
• Te ayuda a ahorrar tiempo y evitar errores
• Te mantiene al tanto de finanzas, tareas, repertorios y clientes
• Te apoya con ideas estratégicas, automatización y control
• Te permite enfocarte en la música mientras el sistema se mantiene bajo control

FIN DEL PROMPT – MAESTRO MARIACHI AI · CHATGPT (USO PRIVADO · ACCESO COMPLETO A LA APP)
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

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${newSystemPrompt} La fecha actual es ${new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Cuando el usuario pregunte por fechas relativas como "hoy", "mañana" o "esta semana", debes calcular la fecha o el rango de fechas correspondiente en formato YYYY-MM-DD y usarla en las herramientas. Por ejemplo, si hoy es 2025-06-25, "mañana" es 2025-06-26. "Esta semana" sería un rango desde hoy hasta dentro de 6 días.`,
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

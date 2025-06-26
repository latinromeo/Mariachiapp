
import {NextRequest, NextResponse} from 'next/server';
import OpenAI from 'openai';
import { createManualFinanceEntry } from '@/services/eventService';
import { FINANCE_CATEGORIES } from '@/lib/constants';
import { storage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryValues = FINANCE_CATEGORIES.map(c => c.value) as [string, ...string[]];

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'register_expense',
      description: 'Registra un nuevo gasto en el sistema financiero a partir de la información de una factura.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'El concepto o descripción detallada del gasto extraído de la factura (ej. "Cena de equipo en Restaurante El Sol").',
          },
          amount: {
            type: 'number',
            description: 'El monto total del gasto extraído de la factura.',
          },
          date: {
            type: 'string',
            description: 'La fecha de la transacción en formato YYYY-MM-DD. Si no se encuentra en la factura, usar la fecha actual.',
          },
          category: {
            type: 'string',
            description: 'La categoría más apropiada para el gasto.',
            enum: categoryValues,
          },
        },
        required: ['description', 'amount', 'date', 'category'],
      },
    },
  },
];

const systemPrompt = `Eres un asistente contable experto. Tu tarea es analizar la imagen de una factura o recibo que te proporcionará el usuario. Extrae con precisión la descripción del gasto, el monto total, la fecha y asígnale la categoría más adecuada. Luego, utiliza la herramienta 'register_expense' para registrar esta información en el sistema. Si la fecha no es clara, utiliza la fecha actual: ${new Date().toISOString().split('T')[0]}.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json({ error: 'La API key de OpenAI no está configurada.' }, { status: 500 });
  }

  const { imageDataUri } = await req.json();

  if (!imageDataUri) {
    return NextResponse.json({ error: 'No se recibió la imagen de la factura.' }, { status: 400 });
  }
  
  let invoiceUrl = '';
  try {
    const bucket = storage.bucket();
    // Use a more robust regex to handle various image mime types, including 'svg+xml'.
    const match = imageDataUri.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Formato de imagen no válido. El archivo debe ser un data URI de imagen.');
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const extension = mimeType.split('/')[1]?.split('+')[0] || 'bin';
    const fileName = `invoices/${uuidv4()}.${extension}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
        metadata: { contentType: mimeType },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2100',
    });
    invoiceUrl = signedUrl;
  } catch (uploadError: any) {
    console.error('Error subiendo la factura a Firebase Storage:', uploadError);
    // Return a more descriptive error to the client.
    return NextResponse.json({ 
        success: false, 
        error: `Error al procesar la imagen de la factura: ${uploadError.message}` 
    }, { status: 500 });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Por favor, analiza esta factura y registra el gasto.' },
            { type: 'image_url', image_url: { url: imageDataUri, detail: 'high' } },
          ],
        },
      ],
      tools: tools,
      tool_choice: { type: 'function', function: { name: 'register_expense' } },
    });

    const message = response.choices[0].message;
    const toolCall = message.tool_calls?.[0];

    if (toolCall?.function.name === 'register_expense') {
      const args = JSON.parse(toolCall.function.arguments);
      
      const result = await createManualFinanceEntry({
        ...args,
        type: 'expense',
        invoiceUrl: invoiceUrl,
      });

      if (result.success) {
        return NextResponse.json({ success: true, message: `Gasto "${args.description}" registrado exitosamente.` });
      } else {
        return NextResponse.json({ success: false, error: `Error al registrar en la base de datos: ${result.error}` }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: false, error: 'La IA no pudo procesar la factura correctamente.' }, { status: 500 });

  } catch (error: any) {
    console.error('Error en API de análisis de factura:', error);
    return NextResponse.json({ success: false, error: 'Ocurrió un error al comunicarse con la IA.' }, { status: 500 });
  }
}


'use server';
/**
 * @fileOverview An invoice analysis AI agent using Genkit.
 *
 * - analyzeInvoice - A function that handles the invoice analysis process.
 * - AnalyzeInvoiceInputSchema - The input type for the analyzeInvoice function.
 * - AnalyzeInvoiceOutputSchema - The return type for the analyzeInvoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { FINANCE_CATEGORIES } from '@/lib/constants';

const categoryValues = FINANCE_CATEGORIES.map(c => c.value) as [string, ...string[]];

export const AnalyzeInvoiceInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of an invoice or receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeInvoiceInput = z.infer<typeof AnalyzeInvoiceInputSchema>;

export const AnalyzeInvoiceOutputSchema = z.object({
    description: z.string().describe('El concepto o descripción detallada del gasto extraído de la factura (ej. "Cena de equipo en Restaurante El Sol").'),
    amount: z.number().describe('El monto total del gasto extraído de la factura.'),
    date: z.string().describe('La fecha de la transacción en formato YYYY-MM-DD. Si no se encuentra en la factura, usar la fecha actual.'),
    category: z.enum(categoryValues).describe('La categoría más apropiada para el gasto.'),
});
export type AnalyzeInvoiceOutput = z.infer<typeof AnalyzeInvoiceOutputSchema>;

// This is the exported function the API route will call
export async function analyzeInvoice(input: AnalyzeInvoiceInput): Promise<AnalyzeInvoiceOutput> {
  return analyzeInvoiceFlow(input);
}

const systemPrompt = `Eres un asistente contable experto. Tu tarea es analizar la imagen de una factura o recibo. Extrae con precisión los siguientes campos y responde ÚNICA Y EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional, explicaciones o markdown.

CAMPOS REQUERIDOS:
- description: El concepto o descripción detallada del gasto (string).
- amount: El monto total del gasto, como un NÚMERO (number), no un string. Ej: 1500.50.
- date: La fecha de la transacción en formato YYYY-MM-DD (string). Si no se encuentra, usa la fecha actual: ${new Date().toISOString().split('T')[0]}.
- category: La categoría más apropiada para el gasto, debe ser uno de los valores permitidos (string).

Asegúrate de que la salida sea un JSON perfecto que se ajuste al esquema.`;

const analyzeInvoicePrompt = ai.definePrompt({
  name: 'analyzeInvoicePrompt',
  system: systemPrompt,
  input: {schema: AnalyzeInvoiceInputSchema},
  output: {schema: AnalyzeInvoiceOutputSchema},
  prompt: `Por favor, analiza esta factura y extrae los datos. Photo: {{media url=imageDataUri}}`,
});

const analyzeInvoiceFlow = ai.defineFlow(
  {
    name: 'analyzeInvoiceFlow',
    inputSchema: AnalyzeInvoiceInputSchema,
    outputSchema: AnalyzeInvoiceOutputSchema,
  },
  async input => {
    const {output} = await analyzeInvoicePrompt(input);
    if (!output) {
        throw new Error('La IA no pudo procesar la factura correctamente.');
    }
    return output;
  }
);

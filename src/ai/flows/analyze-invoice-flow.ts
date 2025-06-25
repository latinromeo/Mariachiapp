
'use server';
/**
 * @fileOverview An AI agent for analyzing invoices from images.
 *
 * - analyzeInvoice - A function that handles the invoice analysis process.
 * - AnalyzeInvoiceInput - The input type for the analyzeInvoice function.
 * - AnalyzeInvoiceOutput - The return type for the analyzeInvoice function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import {FINANCE_CATEGORIES} from '@/lib/constants';

const categoryValues = FINANCE_CATEGORIES.map(c => c.value) as [string, ...string[]];

export const AnalyzeInvoiceInputSchema = z.object({
  invoiceImageUri: z
    .string()
    .describe(
      "A photo of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format, to be used if the invoice has no date.'),
});
export type AnalyzeInvoiceInput = z.infer<typeof AnalyzeInvoiceInputSchema>;

export const AnalyzeInvoiceOutputSchema = z.object({
  description: z.string().describe('A brief but clear description of the main concept or service from the invoice.'),
  amount: z.number().describe('The final total amount of the invoice.'),
  date: z.string().describe('The date of the invoice in YYYY-MM-DD format. If no date is found, use the provided current date.'),
  category: z.enum(categoryValues).describe('The most appropriate category for this expense.'),
});
export type AnalyzeInvoiceOutput = z.infer<typeof AnalyzeInvoiceOutputSchema>;

export async function analyzeInvoice(input: AnalyzeInvoiceInput): Promise<AnalyzeInvoiceOutput> {
  return analyzeInvoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeInvoicePrompt',
  input: {schema: AnalyzeInvoiceInputSchema},
  output: {schema: AnalyzeInvoiceOutputSchema},
  prompt: `You are an expert accountant for a mariachi band. Your task is to analyze the provided invoice image and extract key financial information.

Analyze the image and fill in the following fields:
- description: Create a short, clear description of the item or service purchased.
- amount: Extract the grand total amount. It must be a number.
- date: Extract the date from the invoice. It must be in YYYY-MM-DD format. If no date is visible on the invoice, use the current date provided: {{{currentDate}}}.
- category: Classify the expense into one of the following categories: ${FINANCE_CATEGORIES.map(c => `'${c.value}' (${c.label})`).join(', ')}.

Invoice Image: {{media url=invoiceImageUri}}`,
});

const analyzeInvoiceFlow = ai.defineFlow(
  {
    name: 'analyzeInvoiceFlow',
    inputSchema: AnalyzeInvoiceInputSchema,
    outputSchema: AnalyzeInvoiceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI could not analyze the invoice.');
    }
    return output;
  }
);

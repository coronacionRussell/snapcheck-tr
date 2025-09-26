
'use server';

/**
 * @fileOverview Extracts text from an image of a handwritten or typed essay using OCR.
 *
 * - scanEssay - A function that performs OCR on an essay image.
 * - ScanEssayInput - The input type for the scanEssay function.
 * - ScanEssayOutput - The return type for the scanEssay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanEssayInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of an essay, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanEssayInput = z.infer<typeof ScanEssayInputSchema>;

const ScanEssayOutputSchema = z.object({
  extractedText: z.string().describe('The full text extracted from the essay image.'),
});
export type ScanEssayOutput = z.infer<typeof ScanEssayOutputSchema>;

export async function scanEssay(input: ScanEssayInput): Promise<ScanEssayOutput> {
    return scanEssayFlow(input);
}

const prompt = ai.definePrompt({
    name: 'scanEssayPrompt',
    input: {schema: ScanEssayInputSchema},
    output: {schema: ScanEssayOutputSchema},
    model: 'gemini-1.5-flash-latest',
    prompt: `You are a highly specialized Optical Character Recognition (OCR) engine. Your task is to extract all text from an image of an essay.

- Accurately transcribe all text from the image.
- Preserve original formatting like paragraph breaks and line breaks.
- Return this transcription as the 'extractedText'.
- Do not add any commentary or extra information. Return only the extracted text in the specified JSON format.

Image: {{media url=imageDataUri}}`
});


const scanEssayFlow = ai.defineFlow(
    {
        name: 'scanEssayFlow',
        inputSchema: ScanEssayInputSchema,
        outputSchema: ScanEssayOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(
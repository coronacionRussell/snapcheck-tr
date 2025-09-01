
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
  extractedText: z.string().describe('The text extracted from the essay image.'),
});
export type ScanEssayOutput = z.infer<typeof ScanEssayOutputSchema>;

export async function scanEssay(input: ScanEssayInput): Promise<ScanEssayOutput> {
    return scanEssayFlow(input);
}

const prompt = ai.definePrompt({
    name: 'scanEssayPrompt',
    input: {schema: ScanEssayInputSchema},
    output: {schema: ScanEssayOutputSchema},
    prompt: `You are an expert Optical Character Recognition (OCR) engine. Your primary task is to extract text from an image of an essay with the highest possible accuracy.

Analyze the following image carefully. It may contain typed or handwritten text.

- Be meticulous. Double-check for common OCR errors (e.g., confusing 'l' with '1', 'o' with '0').
- Preserve the original formatting as much as possible, including paragraph breaks and indentation.
- If the text is handwritten, pay close attention to the letter shapes and spacing to correctly transcribe the words.
- Return only the extracted text. Do not add any commentary or extra information.

Image: {{media url=imageDataUri}}`
});


const scanEssayFlow = ai.defineFlow(
    {
        name: 'scanEssayFlow',
        inputSchema: ScanEssayInputSchema,
        outputSchema: ScanEssayOutputSchema,
    },
    async (input) => {
        const {output} = await prompt(input);
        return output!;
    }
);

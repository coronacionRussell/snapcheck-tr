
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
    prompt: `You are a highly specialized Optical Character Recognition (OCR) engine with an exceptional ability to decipher handwritten text. Your primary task is to extract text from an image of an essay with the highest possible accuracy, paying special attention to the nuances of handwriting.

Analyze the following image carefully. It may contain typed or handwritten text.

- If the text is handwritten, engage your advanced handwriting analysis subroutines. Pay close attention to letter shapes, slant, spacing, and connections between letters to correctly transcribe the words. Decipher cursive and print with equal precision.
- Be meticulous. Double-check for common OCR errors (e.g., confusing 'l' with '1', 'o' with '0', 'u' with 'v', 'cl' with 'd').
- Preserve the original formatting as much as possible, including paragraph breaks, line breaks, and indentation.
- Return only the extracted text. Do not add any commentary, interpretation, or extra information about the scan quality. Your output should be pure text.

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


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
import { VISION_MODEL } from '../models';

const ScanEssayInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of an essay, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanEssayInput = z.infer<typeof ScanEssayInputSchema>;

const ScanEssayOutputSchema = z.object({
  studentName: z.string().optional().describe("The student's name, if found at the top of the essay."),
  className: z.string().optional().describe("The class name, if found at the top of the essay."),
  extractedText: z.string().describe('The full text extracted from the essay image. If no text can be found, this should explicitly say so.'),
});
export type ScanEssayOutput = z.infer<typeof ScanEssayOutputSchema>;

export async function scanEssay(input: ScanEssayInput): Promise<ScanEssayOutput> {
    return scanEssayFlow(input);
}

const prompt = ai.definePrompt({
    name: 'scanEssayPrompt',
    model: VISION_MODEL,
    input: {schema: ScanEssayInputSchema},
    output: {schema: ScanEssayOutputSchema},
    prompt: `You are a highly specialized Optical Character Recognition (OCR) engine. Your primary task is to extract all text from the provided image of an essay.

- Transcribe all text from the image with the highest possible accuracy.
- Preserve all original formatting, including paragraph breaks, line breaks, and indentation.
- Pay special attention to the top of the essay. Identify and extract the student's full name into the 'studentName' field and the class name into the 'className' field if they are present.
- If the image is blurry, contains no text, or is otherwise unreadable, you MUST return a response that explicitly states that no text could be extracted in the 'extractedText' field. Do not return an empty string for the text.
- Return only the transcribed text and identified names in the specified JSON format. Do not add any extra commentary or information.

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
        if (!output?.extractedText?.trim()) {
            return { extractedText: '[No text could be extracted from the image. Please try again with a clearer picture.]' };
        }
        return output;
    }
);

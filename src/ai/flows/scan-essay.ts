
'use server';

/**
 * @fileOverview Extracts text from an image of a handwritten or typed essay using OCR,
 * and identifies text within boxes as credentials.
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
  credentials: z.object({
      name: z.string().optional().describe("The student's name, if found within a box."),
      activity: z.string().optional().describe("The activity or assignment title, if found within a box.")
  }).describe("Credentials found inside visually distinct boxes in the image.")
});
export type ScanEssayOutput = z.infer<typeof ScanEssayOutputSchema>;

export async function scanEssay(input: ScanEssayInput): Promise<ScanEssayOutput> {
    return scanEssayFlow(input);
}

const prompt = ai.definePrompt({
    name: 'scanEssayPrompt',
    input: {schema: ScanEssayInputSchema},
    output: {schema: ScanEssayOutputSchema},
    prompt: `You are a highly specialized Optical Character Recognition (OCR) engine. Your primary task is to extract text from an image of an essay and identify key credentials.

Analyze the following image carefully. It may contain typed or handwritten text.

**Primary Task: Full Text Extraction**
- Accurately transcribe all text from the image.
- Preserve original formatting like paragraph breaks and line breaks.
- Return this as the 'extractedText'.

**Secondary Task: Credential Identification**
- Examine the image for any text that is visually enclosed within a box (e.g., a hand-drawn rectangle).
- If you find a box containing what appears to be a person's name, extract that name and place it in the 'credentials.name' field.
- If you find a box containing what appears to be an assignment or activity title, extract that title and place it in the 'credentials.activity' field.
- If no text is found inside boxes, leave the 'credentials' fields empty. Do not guess.

Return ONLY the extracted text and credentials in the specified JSON format.

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


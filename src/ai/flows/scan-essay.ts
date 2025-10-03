'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { VISION_MODEL } from '../models';

const ScanEssayInputSchema = z.object({
  imageDataUri: z.string().describe('The essay image as a data URI.'),
});
export type ScanEssayInput = z.infer<typeof ScanEssayInputSchema>;

const ScanEssayOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the image.'),
});
export type ScanEssayOutput = z.infer<typeof ScanEssayOutputSchema>;

export async function scanEssay(
  input: ScanEssayInput
): Promise<ScanEssayOutput> {
  try {
    const result = await ai.generate({
      model: VISION_MODEL,
      prompt: [
        {
          text: 'Extract all text from this essay image. Preserve paragraph and line breaks. If the image is unreadable, state that clearly.',
        },
        { media: { url: input.imageDataUri } },
      ],
    });

    const text = result.text.trim();
    if (!text) {
        return { extractedText: '[Scan complete, but no text was found. Please try a clearer image.]' };
    }

    return { extractedText: text };
  } catch (error: any) {
    console.error('scanEssay error:', error?.message ?? error);
    // Rethrow to be caught by the caller, which will display a toast.
    throw error;
  }
}

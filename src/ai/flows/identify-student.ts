'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TEXT_MODEL } from '../models';

const IdentifyStudentInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be identified.'),
  studentRoster: z.array(z.object({
    id: z.string().describe('The unique ID of the student.'),
    name: z.string().describe('The full name of the student.'),
  })).describe('A list of student IDs and names to choose from in the class roster.'), // Reverted description
});
export type IdentifyStudentInput = z.infer<typeof IdentifyStudentInputSchema>;

const IdentifyStudentOutputSchema = z.object({
  identifiedStudentId: z.string().nullable().describe('The ID of the student identified from the roster, or null if no confident match.'), // Reverted description
  identifiedStudentName: z.string().nullable().describe('The full name of the student identified, or null.'),
  confidenceReason: z.string().describe('An explanation of why this student was identified, or why no confident match was made.'),
  confidenceScore: z.number().describe('A score from 0 to 100 indicating the AI\'s confidence in the identification. 0 for no match, 100 for high confidence.'),
});
export type IdentifyStudentOutput = z.infer<typeof IdentifyStudentOutputSchema>;

export async function identifyStudent(
  input: IdentifyStudentInput
): Promise<IdentifyStudentOutput> {
  try {
    return await identifyStudentFlow(input);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during student identification.';
    console.error('Error in identifyStudent flow:', errorMessage);
    return {
      identifiedStudentId: null,
      identifiedStudentName: null,
      confidenceReason: `AI identification failed: ${errorMessage}`,
      confidenceScore: 0,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'identifyStudentPrompt',
  model: TEXT_MODEL,
  input: { schema: IdentifyStudentInputSchema },
  output: { schema: IdentifyStudentOutputSchema },
  prompt: `You are an AI assistant specialized in identifying authors from essay texts.\nYou will be provided with an essay and a list of student names and their IDs from a specific class roster.\nYour task is to analyze the essay text and determine which student from the provided roster is the most likely author.\n\nConsider the following rules for identification:\n1. Look for explicit mentions of names (first, last, or full) within the essay text.\n2. Consider unique phrases, writing style quirks, or specific information that might indirectly point to a student (if such data were available in the essay).\n3. If you find a strong match, provide the student\'s ID and name from the roster, a clear reason for your confidence, and a confidence score between 70-100.\n4. If you are NOT confident (e.g., no name mentioned, ambiguous clues, common phrases), you MUST return null for identifiedStudentId and identifiedStudentName, and set confidenceScore to 0, with a reason explaining the lack of a confident match. Do not guess if unsure.\n5. You MUST output your response in a valid JSON format according to the output schema.\n\nStudent Roster:\n{{{JSON.stringify(studentRoster, null, 2)}}}\n\nEssay Text:\n{{{essayText}}}\n`,
});

const identifyStudentFlow = ai.defineFlow(
  {
    name: 'identifyStudentFlow',
    inputSchema: IdentifyStudentInputSchema,
    outputSchema: IdentifyStudentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

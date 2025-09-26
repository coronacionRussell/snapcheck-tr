
'use server';

/**
 * @fileOverview Generates feedback for an essay based on a rubric.
 *
 * - generateEssayFeedback - A function that generates essay feedback.
 * - GenerateEssayFeedbackInput - The input type for the generateEssayFeedback function.
 * - GenerateEssayFeedbackOutput - The return type for the generatefeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEssayFeedbackInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to provide feedback on.'),
  rubric: z.string().describe('The rubric to use when providing feedback.'),
});
export type GenerateEssayFeedbackInput = z.infer<
  typeof GenerateEssayFeedbackInputSchema
>;

const GenerateEssayFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The generated feedback for the essay.'),
});
export type GenerateEssayFeedbackOutput = z.infer<
  typeof GenerateEssayFeedbackOutputSchema
>;

export async function generateEssayFeedback(
  input: GenerateEssayFeedbackInput
): Promise<GenerateEssayFeedbackOutput> {
  return generateEssayFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEssayFeedbackPrompt',
  input: {schema: GenerateEssayFeedbackInputSchema},
  output: {schema: GenerateEssayFeedbackOutputSchema},
  model: 'openai/gpt-4o',
  prompt: `You are an AI writing tutor. You will be provided with an essay and a rubric. Your goal is to provide constructive feedback to the student based on the rubric to help them improve their essay.

NEVER mention a score, grade, or any quantitative assessment. Your feedback should be purely qualitative and encouraging.

Essay:
{{essayText}}

Rubric:
{{rubric}}

Feedback:`,
});

const generateEssayFeedbackFlow = ai.defineFlow(
  {
    name: 'generateEssayFeedbackFlow',
    inputSchema: GenerateEssayFeedbackInputSchema,
    outputSchema: GenerateEssayFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

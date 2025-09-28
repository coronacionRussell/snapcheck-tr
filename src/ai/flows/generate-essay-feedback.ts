
'use server';

/**
 * @fileOverview Generates feedback for an essay based on a rubric.
 *
 * - generateEssayFeedback - A function that generates essay feedback.
 * - GenerateEssayFeedbackInput - The input type for the generateEssayfeedback function.
 * - GenerateEssayFeedbackOutput - The return type for the generateEssayFeedback function.
 */

import {ai} from '@/ai/genkit';
import { TEXT_MODEL } from '@/ai/models';
import {z} from 'genkit';

const GenerateEssayFeedbackInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be graded.'),
  rubric: z.string().describe('The rubric to use for grading the essay.'),
});
export type GenerateEssayFeedbackInput = z.infer<
  typeof GenerateEssayFeedbackInputSchema
>;

const GenerateEssayFeedbackOutputSchema = z.object({
  feedback: z
    .string()
    .describe(
      'Detailed, constructive feedback on the essay based on the rubric.'
    ),
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
  model: TEXT_MODEL,
  input: {schema: GenerateEssayFeedbackInputSchema},
  output: {schema: GenerateEssayFeedbackOutputSchema},
  prompt: `You are an AI teaching assistant. Your task is to provide constructive feedback on a student's essay based *only* on the provided rubric. Do not provide a score or grade.

Analyze the essay against each criterion in the rubric and provide specific feedback on how well the student met each one.

You MUST output your response in a valid JSON format.

Rubric:
{{{rubric}}}

Essay Text:
{{{essayText}}}
`,
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

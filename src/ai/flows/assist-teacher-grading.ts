
'use server';

/**
 * @fileOverview This file defines a Genkit flow for AI-assisted grading of essays based on a rubric.
 *
 * - assistTeacherGrading - A function that grades an essay based on a rubric and generates preliminary scores.
 * - AssistTeacherGradingInput - The input type for the assistTeacherGrading function.
 * - AssistTeacherGradingOutput - The return type for the assistTeacherGrading function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssistTeacherGradingInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be graded.'),
  rubricText: z.string().describe('The rubric to use for grading the essay.'),
});
export type AssistTeacherGradingInput = z.infer<typeof AssistTeacherGradingInputSchema>;

const AssistTeacherGradingOutputSchema = z.object({
  preliminaryScore: z.string().describe('A preliminary score out of 100 based on the rubric.'),
  feedback: z.string().describe('Detailed feedback on how the essay meets the rubric requirements.'),
});
export type AssistTeacherGradingOutput = z.infer<typeof AssistTeacherGradingOutputSchema>;

export async function assistTeacherGrading(input: AssistTeacherGradingInput): Promise<AssistTeacherGradingOutput> {
  return assistTeacherGradingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistTeacherGradingPrompt',
  input: {schema: AssistTeacherGradingInputSchema},
  output: {schema: AssistTeacherGradingOutputSchema},
  prompt: `You are an AI assistant for teachers. Your task is to provide feedback on an essay based on a provided rubric and suggest a preliminary score out of 100.

Carefully analyze the essay and the rubric. Generate constructive feedback that explains how the essay meets each criterion in the rubric. Provide a score out of 100.

You MUST output your response in a valid JSON format.

Essay Text:
{{essayText}}

Rubric:
{{rubricText}}
`,
});

const assistTeacherGradingFlow = ai.defineFlow(
  {
    name: 'assistTeacherGradingFlow',
    inputSchema: AssistTeacherGradingInputSchema,
    outputSchema: AssistTeacherGradingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

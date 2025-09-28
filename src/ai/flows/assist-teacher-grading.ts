
'use server';

/**
 * @fileOverview This file defines a Genkit flow for AI-assisted grading of essays based on a rubric.
 *
 * - assistTeacherGrading - A function that grades an essay based on a rubric and generates preliminary scores.
 * - AssistTeacherGradingInput - The input type for the assistTeacherGrading function.
 * - AssistTeacherGradingOutput - The return type for the assistTeacherGrading function.
 */

import {ai} from '@/ai/genkit';
import { TEXT_MODEL } from '@/ai/models';
import {z} from 'genkit';

const AssistTeacherGradingInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be graded.'),
  rubricText: z.string().describe('The rubric to use for grading the essay.'),
  activityDescription: z.string().describe('The description of the activity or assignment, which also serves as the essay question or prompt.'),
});
export type AssistTeacherGradingInput = z.infer<typeof AssistTeacherGradingInputSchema>;

const AssistTeacherGradingOutputSchema = z.object({
  preliminaryScore: z.string().describe('A preliminary score out of 100 based on the rubric and how well the essay answers the prompt.'),
  feedback: z.string().describe('Detailed feedback on how the essay answers the prompt and meets the rubric requirements.'),
});
export type AssistTeacherGradingOutput = z.infer<typeof AssistTeacherGradingOutputSchema>;

export async function assistTeacherGrading(input: AssistTeacherGradingInput): Promise<AssistTeacherGradingOutput> {
  return assistTeacherGradingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assistTeacherGradingPrompt',
  input: {schema: AssistTeacherGradingInputSchema},
  output: {schema: AssistTeacherGradingOutputSchema},
  prompt: `You are an AI assistant for teachers. Your task is to provide feedback on a student's essay and suggest a preliminary score out of 100.

The "Assignment Description" is the primary essay question or prompt. Your first priority is to evaluate how well the essay directly answers this prompt and fulfills its specific instructions.

Next, use the provided "Rubric" to evaluate the quality of the writing based on its criteria (e.g., thesis, evidence, organization).

Generate constructive feedback that explains how the essay performs against both the Assignment Description and the Rubric. Provide a score out of 100 that reflects this comprehensive evaluation.

You MUST output your response in a valid JSON format.

Assignment Description / Essay Question:
{{{activityDescription}}}

Rubric:
{{{rubricText}}}

Essay Text:
{{{essayText}}}
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

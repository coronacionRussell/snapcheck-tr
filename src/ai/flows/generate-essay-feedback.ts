'use server';

import {ai} from '@/ai/genkit';
import { TEXT_MODEL } from '../models';

export async function generateEssayFeedback(input: {essayText: string, rubric: string}) {
  const result = await ai.generate({
    model: TEXT_MODEL,
    prompt: `You are an AI teaching assistant. Your task is to provide constructive feedback on a student's essay based *only* on the provided rubric. Do not provide a score or grade.

Analyze the essay against each criterion in the rubric and provide specific feedback on how well the student met each one.

Rubric:
${input.rubric}

Essay Text:
${input.essayText}
`,
  });

  return result.text;
}


'use server';

/**
 * @fileOverview Analyzes an essay for grammatical errors and provides color-coded corrections.
 *
 * - analyzeEssayGrammar - A function that flags errors and suggests corrections.
 * - AnalyzeEssayGrammarInput - The input type for the analyzeEssayGrammar function.
 * - AnalyzeEssayGrammarOutput - The return type for the analyzeEssayGrammar function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeEssayGrammarInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be analyzed.'),
});
export type AnalyzeEssayGrammarInput = z.infer<
  typeof AnalyzeEssayGrammarInputSchema
>;

const AnalyzeEssayGrammarOutputSchema = z.object({
  correctedHtml: z
    .string()
    .describe(
      'The essay text formatted as an HTML string with errors wrapped in <span> tags. Spelling errors should have class "spelling-error" and grammar errors should have class "grammar-error". Each span should include a "data-suggestion" attribute with the correction.'
    ),
});
export type AnalyzeEssayGrammarOutput = z.infer<
  typeof AnalyzeEssayGrammarOutputSchema
>;

export async function analyzeEssayGrammar(
  input: AnalyzeEssayGrammarInput
): Promise<AnalyzeEssayGrammarOutput> {
  return analyzeEssayGrammarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEssayGrammarPrompt',
  input: {schema: AnalyzeEssayGrammarInputSchema},
  output: {schema: AnalyzeEssayGrammarOutputSchema},
  prompt: `You are an expert grammar and spelling checker. Analyze the following essay text.

Your task is to return an HTML string with corrections. Do not alter the original text content itself, but wrap any errors in <span> tags.

1.  For spelling errors, use '<span class="spelling-error" data-suggestion="correct-word">misspelled-word</span>'.
2.  For grammar errors, use '<span class="grammar-error" data-suggestion="suggested-phrase">phrase with error</span>'.
3.  Wrap words or phrases that are correct in a simple '<span>word</span>' tag without any class.
4.  Preserve all original line breaks and spacing.
5.  You MUST output your response in a valid JSON format.

Essay Text:
{{essayText}}
`,
});

const analyzeEssayGrammarFlow = ai.defineFlow(
  {
    name: 'analyzeEssayGrammarFlow',
    inputSchema: AnalyzeEssayGrammarInputSchema,
    outputSchema: AnalyzeEssayGrammarOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
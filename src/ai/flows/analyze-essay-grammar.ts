
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
export type AnalyzeEssayGrammarInput = z.infer<typeof AnalyzeEssayGrammarInputSchema>;

const AnalyzeEssayGrammarOutputSchema = z.object({
  correctedHtml: z.string().describe('An HTML string with errors and corrections flagged using specific class names and data attributes.'),
});
export type AnalyzeEssayGrammarOutput = z.infer<typeof AnalyzeEssayGrammarOutputSchema>;

export async function analyzeEssayGrammar(input: AnalyzeEssayGrammarInput): Promise<AnalyzeEssayGrammarOutput> {
  return analyzeEssayGrammarFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEssayGrammarPrompt',
  input: {schema: AnalyzeEssayGrammarInputSchema},
  output: {schema: AnalyzeEssayGrammarOutputSchema},
  model: 'gemini-1.5-flash-latest',
  prompt: `You are an expert English grammar and spelling correction tool. Your task is to analyze the provided essay text and return an HTML string that highlights any errors.

Follow these rules precisely:
1.  Analyze the essay for spelling mistakes and grammatical errors (including incorrect punctuation and awkward phrasing).
2.  When you find a **spelling mistake**, you must wrap the incorrect word in a \`<span class="spelling-error" data-suggestion="...">\` tag.
    - The content of the tag should be the original misspelled text.
    - The \`data-suggestion\` attribute should contain your suggested correction.
3.  When you find a **grammatical error** (anything that is not a spelling mistake), you must wrap the incorrect word or phrase in a \`<span class="grammar-error" data-suggestion="...">\` tag.
    - The content of the tag should be the original incorrect text.
    - The \`data-suggestion\` attribute should contain your suggested correction.
4.  For text that is correct, wrap it in a \`<span class="correct">\`.
5.  Preserve all original line breaks by converting them to \`<br />\` tags.
6.  Your entire output must be a single, valid HTML string that can be rendered in a browser. Do not include any text or explanation outside of the HTML structure.

Example:
Original Text: "I has two dog. They is freindly."
Your Output: "<span class="correct">I </span><span class="grammar-error" data-suggestion="have">has</span><span class="correct"> two </span><span class="grammar-error" data-suggestion="dogs">dog</span><span class="correct">. </span><br /><span class="correct">They </span><span class="grammar-error" data-suggestion="are">is</span><span class="correct"> </span><span class="spelling-error" data-suggestion="friendly">freindly</span><span class="correct">.</span>"

Essay Text to Analyze:
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
    return output!;
  }
);

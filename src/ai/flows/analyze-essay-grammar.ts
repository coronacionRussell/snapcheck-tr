'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TEXT_MODEL } from '../models';

const AnalyzeEssayGrammarInputSchema = z.object({
  essayText: z.string().describe('The text of the essay to be analyzed.'),
});
export type AnalyzeEssayGrammarInput = z.infer<typeof AnalyzeEssayGrammarInputSchema>;

const AnalyzeEssayGrammarOutputSchema = z.object({
  correctedHtml: z.string().describe(
    'The essay text formatted as an HTML string with errors wrapped in <span> tags. ' +
    'Spelling errors: <span class="spelling-error" data-suggestion="correct">wrong</span>. ' +
    'Grammar errors: <span class="grammar-error" data-suggestion="better phrase">bad phrase</span>. ' +
    'Leave correct text unchanged. Only wrap errors.'
  ),
});
export type AnalyzeEssayGrammarOutput = z.infer<typeof AnalyzeEssayGrammarOutputSchema>;

export async function analyzeEssayGrammar(
  input: AnalyzeEssayGrammarInput
): Promise<AnalyzeEssayGrammarOutput> {
  try {
    return await analyzeEssayGrammarFlow(input);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during grammar analysis.';
    console.error('Error in analyzeEssayGrammar flow:', errorMessage);

    // Safe fallback: return raw essay with error notice
    const safeText = input.essayText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      correctedHtml: `<span>[AI grammar analysis failed: ${errorMessage}]</span><br /><br />${safeText}`,
    };
  }
}

const prompt = ai.definePrompt({
  name: 'analyzeEssayGrammarPrompt',
  model: TEXT_MODEL,
  input: { schema: AnalyzeEssayGrammarInputSchema },
  output: { schema: AnalyzeEssayGrammarOutputSchema },
  config: { output: { format: 'json' } }, // 👈 Force JSON mode
  prompt: `You are an expert grammar and spelling checker.
Analyze the essay text and return an HTML string.

Rules:
1. For spelling errors: <span class="spelling-error" data-suggestion="correct">wrong</span>
2. For grammar errors: <span class="grammar-error" data-suggestion="better phrase">bad phrase</span>
3. Do NOT wrap correct words/phrases. Leave them as-is.
4. Preserve original line breaks and spacing.
5. Return ONLY a JSON object with the key "correctedHtml". No extra text.

Essay Text:
{{{essayText}}}
`,
});

const analyzeEssayGrammarFlow = ai.defineFlow(
  {
    name: 'analyzeEssayGrammarFlow',
    inputSchema: AnalyzeEssayGrammarInputSchema,
    outputSchema: AnalyzeEssayGrammarOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

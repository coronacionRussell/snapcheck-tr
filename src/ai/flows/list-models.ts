'use server';

/**
 * @fileOverview A flow to list all available AI models from the configured plugins.
 */

import { ai } from '@/ai/genkit';
import { listModels } from 'genkit';
import { z } from 'genkit';

const ModelInfoSchema = z.object({
  name: z.string().describe('The full name/path of the model.'),
  label: z.string().describe('A user-friendly label for the model.'),
  supports: z
    .object({
      generate: z.boolean(),
      multiturn: z.boolean(),
      tools: z.boolean(),
      media: z.boolean(),
    })
    .describe('Capabilities supported by the model.'),
});

const ListModelsOutputSchema = z.object({
  models: z.array(ModelInfoSchema),
});

export type ListModelsOutput = z.infer<typeof ListModelsOutputSchema>;

export async function listAvailableModels(): Promise<ListModelsOutput> {
  return listModelsFlow();
}

const listModelsFlow = ai.defineFlow(
  {
    name: 'listModelsFlow',
    inputSchema: z.void(),
    outputSchema: ListModelsOutputSchema,
  },
  async () => {
    const allModels = await listModels();
    
    const models = allModels.map(model => ({
      name: model.name,
      label: model.label,
      supports: {
        generate: model.supports.generate,
        multiturn: model.supports.multiturn,
        tools: model.supports.tools,
        media: model.supports.media,
      }
    }));

    return { models };
  }
);

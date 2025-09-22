
'use server';

/**
 * @fileOverview Generates a secure, unique token for authorizing file uploads.
 *
 * - generateUploadToken - A function that creates a unique token.
 * - GenerateUploadTokenInput - The input type for the generateUploadToken function.
 * - GenerateUploadTokenOutput - The return type for the generateUploadToken function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { v4 as uuidv4 } from 'uuid';

const GenerateUploadTokenInputSchema = z.object({
    userId: z.string().describe("The UID of the user requesting the upload."),
});
export type GenerateUploadTokenInput = z.infer<typeof GenerateUploadTokenInputSchema>;

const GenerateUploadTokenOutputSchema = z.object({
  token: z.string().describe("A unique, secure token for the upload."),
  uploadId: z.string().describe("A unique ID for this specific upload transaction."),
});
export type GenerateUploadTokenOutput = z.infer<typeof GenerateUploadTokenOutputSchema>;

// This flow doesn't need to call an LLM. It's a simple, secure backend utility.
// We define it as a flow to keep all backend logic organized within Genkit.
export const generateUploadToken = ai.defineFlow(
  {
    name: 'generateUploadToken',
    inputSchema: GenerateUploadTokenInputSchema,
    outputSchema: GenerateUploadTokenOutputSchema,
  },
  async ({ userId }) => {
    // In a real production app, you might do more here, like:
    // - Log the upload request to an audit trail.
    // - Check if the user has permission to upload (e.g., not banned).
    // - Use a more robust token generation system like JWTs.
    
    // For this app, a simple unique ID is sufficient and secure because
    // it's non-guessable and combined with the user's UID in the storage path.
    const token = uuidv4();
    const uploadId = uuidv4();
    
    return { token, uploadId };
  }
);


'use server';

/**
 * @fileOverview Deletes a user's data from Firestore.
 *
 * - deleteUser - A function that deletes a user's Firestore document.
 * - DeleteUserInput - The input type for the deleteUser function.
 * - DeleteUserOutput - The return type for the deleteUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as genkit from 'genkit';


const DeleteUserInputSchema = z.object({
  uid: z.string().describe("The UID of the user to delete."),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

const DeleteUserOutputSchema = z.object({
  success: z.boolean().describe("Whether the user's data was successfully deleted."),
  message: z.string().describe("A message indicating the result of the operation."),
});
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserOutput> {
  return deleteUserFlow(input);
}


const deleteUserData = ai.defineTool(
    {
        name: 'deleteUserData',
        description: "Deletes a user's document from the Firestore database. This does not delete the user from Firebase Authentication, only their data record in the 'users' collection.",
        inputSchema: z.object({
            uid: z.string().describe("The UID of the user to delete from Firestore.")
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string()
        })
    },
    async ({ uid }) => {
        try {
            const userDocRef = doc(db, 'users', uid);
            await deleteDoc(userDocRef);
            return {
                success: true,
                message: `Successfully deleted Firestore data for user ${uid}.`,
            };
        } catch (error: any) {
            console.error("Error deleting user data in tool: ", error);
            return {
                success: false,
                message: `Failed to delete Firestore data for UID ${uid}: ${error.message}`
            }
        }
    }
);


const prompt = ai.definePrompt({
    name: 'deleteUserPrompt',
    tools: [deleteUserData],
    prompt: "You are an administrative agent. Your task is to delete a user's data from the system. Use the provided 'deleteUserData' tool to delete the user with the given UID. Report back on the success or failure of the operation. UID to delete: {{uid}}",
    input: { schema: DeleteUserInputSchema },
});


const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async (input) => {
     const llmResponse = await prompt(input);
     const toolCall = llmResponse.toolCalls()?.[0];

     if (toolCall) {
        const toolResult = await deleteUserData(toolCall.input);
        return toolResult;
     }

     return { success: false, message: 'Flow failed to call the deletion tool.' };
  }
);

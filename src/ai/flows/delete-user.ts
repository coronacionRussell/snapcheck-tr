
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

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ uid }) => {
    try {
        // This flow only deletes the user's Firestore document.
        // A full implementation requires a backend function with admin privileges 
        // to delete the user from Firebase Authentication using the Admin SDK.
        const userDocRef = doc(db, 'users', uid);
        await deleteDoc(userDocRef);

        // In a full implementation, you would also delete associated data,
        // like storage files for verification IDs.

        return {
            success: true,
            message: `Successfully deleted Firestore data for user ${uid}.`,
        };
    } catch (error: any) {
        console.error("Error deleting user data: ", error);
        // Throwing an error will cause the flow to fail, which is appropriate here.
        throw new Error(`Failed to delete user data for UID ${uid}: ${error.message}`);
    }
  }
);

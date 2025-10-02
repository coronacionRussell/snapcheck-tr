/**
 * @fileOverview Centralized model definitions for the application.
 */
import { gemini15Flash, geminiPro } from '@genkit-ai/google-genai';


// For most text-based generation and analysis tasks.
export const TEXT_MODEL = gemini15Flash;

// For tasks involving image input (Optical Character Recognition).
export const VISION_MODEL = geminiPro;

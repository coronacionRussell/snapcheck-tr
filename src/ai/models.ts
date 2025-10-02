/**
 * @fileOverview Centralized model definitions for the application.
 */
import { geminiPro, geminiProVision } from '@genkit-ai/google-genai';


// For most text-based generation and analysis tasks.
export const TEXT_MODEL = geminiPro;

// For tasks involving image input (Optical Character Recognition).
export const VISION_MODEL = geminiProVision;

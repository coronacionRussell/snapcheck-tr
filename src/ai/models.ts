/**
 * @fileOverview Centralized model definitions for the application.
 */
import { googleAI } from '@genkit-ai/google-genai';

// For most text-based generation and analysis tasks.
export const TEXT_MODEL = googleAI.model('gemini-1.5-pro-latest');

// For tasks involving image input (Optical Character Recognition).
export const VISION_MODEL = googleAI.model('gemini-1.5-flash-latest');

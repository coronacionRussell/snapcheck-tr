/**
 * @fileOverview Centralized model definitions for the application.
 */
import { googleAI } from '@genkit-ai/google-genai';

// For essay feedback (image-to-text + analysis).
export const VISION_MODEL = googleAI.model('gemini-1.5-pro-vision');

// Alias for consistency (if you also need pure text analysis later).
export const TEXT_MODEL = googleAI.model('gemini-1.5-pro');

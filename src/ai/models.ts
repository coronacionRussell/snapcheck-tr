/**
 * @fileOverview Centralized model definitions for the application.
 */

import { googleAI } from '@genkit-ai/googleai';

// For most text-based generation and analysis tasks.
export const TEXT_MODEL = googleAI('gemini-2.5-flash');

// For tasks involving image input (Optical Character Recognition).
export const VISION_MODEL = googleAI('gemini-pro-vision');

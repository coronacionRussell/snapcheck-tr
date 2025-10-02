
import { config } from 'dotenv';
config();

import '@/ai/flows/assist-teacher-grading.ts';
import '@/ai/flows/generate-essay-feedback.ts';
import '@/ai/flows/scan-essay.ts';
import '@/ai/flows/delete-user.ts';
import '@/ai/flows/analyze-essay-grammar.ts';
import '@/ai/models.ts';

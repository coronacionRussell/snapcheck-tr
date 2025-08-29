
'use client';

import { generateEssayFeedback } from '@/ai/flows/generate-essay-feedback';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

const MOCK_ESSAY_TEXT =
  "To be or not to be, that is the question. This seminal line from Shakespeare's Hamlet encapsulates the central theme of existential dread and the internal conflict of the protagonist. Hamlet's contemplation of suicide is not merely a moment of weakness, but a profound philosophical inquiry into the nature of life, death, and the afterlife. The play explores the human condition, forcing the audience to confront their own mortality and the choices they make.";

const MOCK_RUBRIC_TEXT =
  '1. Thesis Statement (25pts): Is the thesis clear, concise, and arguable? \n2. Evidence & Analysis (40pts): Does the essay use relevant textual evidence?';

export function EssaySubmissionForm() {
  const [essayText, setEssayText] = useState('');
  const [rubric, setRubric] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would process the file with OCR here.
      // For this demo, we'll simulate it by setting mock text.
      toast({
        title: 'File Uploaded',
        description:
          'OCR simulation: Essay text has been populated automatically.',
      });
      setEssayText(MOCK_ESSAY_TEXT);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!essayText.trim() || !rubric.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both the essay text and the rubric.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setFeedback('');
    try {
      const result = await generateEssayFeedback({ essayText, rubric });
      setFeedback(result.feedback);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Feedback Generation Failed',
        description:
          'There was an error generating feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            1. Your Essay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="essay-photo">Upload Photo (optional)</Label>
            <div className="relative">
              <UploadCloud className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="essay-photo"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Our OCR will convert it to text.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="essay-text">Or Paste Essay Text</Label>
            <Textarea
              id="essay-text"
              placeholder="Paste your essay here..."
              rows={10}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              required
              className="font-code"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">2. Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="rubric-text">Paste Grading Rubric</Label>
            <Textarea
              id="rubric-text"
              placeholder="Paste the rubric provided by your teacher here..."
              rows={5}
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              onFocus={(e) => !e.target.value && setRubric(MOCK_RUBRIC_TEXT)}
              required
              className="font-code"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generating Feedback...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 size-4" />
            Get AI Feedback
          </>
        )}
      </Button>

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-lg">
              <Bot className="size-5" /> AI Generated Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground">
              {feedback}
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}

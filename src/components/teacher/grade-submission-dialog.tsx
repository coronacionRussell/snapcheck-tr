
'use client';
import { assistTeacherGrading } from '@/ai/flows/assist-teacher-grading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type Submission = {
  id: string;
  studentName: string;
  className: string;
  submittedAt: string;
  status: string;
};

const MOCK_ESSAY_TEXT =
  "To be or not to be, that is the question. This seminal line from Shakespeare's Hamlet encapsulates the central theme of existential dread and the internal conflict of the protagonist. Hamlet's contemplation of suicide is not merely a moment of weakness, but a profound philosophical inquiry into the nature of life, death, and the afterlife. The play explores the human condition, forcing the audience to confront their own mortality and the choices they make. Through Hamlet's journey, Shakespeare suggests that while life is fraught with suffering ('the slings and arrows of outrageous fortune'), the uncertainty of death ('the undiscovered country from whose bourn no traveller returns') makes us pause. This hesitation is a fundamental aspect of the human experience, a testament to our innate will to live despite adversity. Ultimately, the play does not offer easy answers, but instead, it presents a complex portrait of a mind in turmoil, a portrait that continues to resonate with audiences centuries later.";

const MOCK_RUBRIC_TEXT =
  '1. Thesis Statement (25pts): Is the thesis clear, concise, and arguable? \n2. Evidence & Analysis (40pts): Does the essay use relevant textual evidence? Is the analysis of this evidence insightful and well-developed? \n3. Structure & Organization (20pts): Is the essay logically structured with clear topic sentences and smooth transitions? \n4. Clarity & Style (15pts): Is the language clear, precise, and free of grammatical errors?';

export function GradeSubmissionDialog({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    preliminaryScore: number;
    feedback: string;
  } | null>(null);
  const { toast } = useToast();

  const handleRunAiGrading = async () => {
    setIsLoading(true);
    setAiResult(null);
    try {
      const result = await assistTeacherGrading({
        essayText: MOCK_ESSAY_TEXT,
        rubricText: MOCK_RUBRIC_TEXT,
      });
      setAiResult(result);
    } catch (error) {
      console.error(error);
      toast({
        title: 'AI Grading Failed',
        description:
          'There was an error while running the AI assistant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    // Do not reset state to allow viewing results after re-opening
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Grade</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Grade Submission: {submission.studentName}
          </DialogTitle>
          <DialogDescription>
            Class: {submission.className} | Submitted: {submission.submittedAt}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">
                  Submitted Essay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea readOnly rows={15} defaultValue={MOCK_ESSAY_TEXT} className="font-code text-sm" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Rubric</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  readOnly
                  rows={6}
                  defaultValue={MOCK_RUBRIC_TEXT}
                  className="font-code text-sm"
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={handleRunAiGrading}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Grading in Progress...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Run AI-Assisted Grading
                </>
              )}
            </Button>
            {aiResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-lg">
                    <Bot className="size-5" /> AI Preliminary Grade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ai-score">Preliminary Score (/100)</Label>
                    <Input
                      id="ai-score"
                      defaultValue={aiResult.preliminaryScore}
                    />
                  </div>
                  <div>
                    <Label>AI Feedback</Label>
                    <Textarea rows={10} defaultValue={aiResult.feedback} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button>Finalize & Submit Grade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

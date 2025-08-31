
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
import { Submission } from './class-submissions';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';


type GradeSubmissionDialogProps = {
    submission: Submission;
    className: string;
    rubric: string;
    classId: string;
}

export function GradeSubmissionDialog({ submission, className, rubric, classId }: GradeSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');
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
        essayText: submission.essayText,
        rubricText: rubric,
      });
      setAiResult(result);
      setFinalScore(result.preliminaryScore.toString());
      setFinalFeedback(result.feedback);
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
  
  const handleFinalizeGrade = async () => {
    if (!finalScore.trim()) {
        toast({
            title: 'Score is required',
            description: 'Please enter a final score.',
            variant: 'destructive'
        })
        return;
    }
    setIsSubmitting(true);
    try {
        const submissionRef = doc(db, 'classes', classId, 'submissions', submission.id);
        await updateDoc(submissionRef, {
            status: 'Graded',
            grade: finalScore,
            feedback: finalFeedback,
        });
        toast({
            title: 'Grade Submitted!',
            description: `The grade for ${submission.studentName} has been finalized.`,
        });
        handleClose();

    } catch (error) {
        console.error("Error finalizing grade: ", error);
        toast({
            title: 'Error',
            description: 'Could not submit the final grade.',
            variant: 'destructive'
        })
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    // Reset state on close
    setAiResult(null);
    setFinalScore('');
    setFinalFeedback('');
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleClose();
        } else {
            setOpen(true);
        }
    }}>
      <DialogTrigger asChild>
        <Button disabled={submission.status === 'Graded'}>
            {submission.status === 'Graded' ? 'Graded' : 'Grade'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline">
            Grade Submission: {submission.studentName}
          </DialogTitle>
          <DialogDescription>
            Assignment: {submission.assignmentName || 'Essay Submission'} | Class: {className} | Submitted: {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
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
                <Textarea readOnly rows={15} value={submission.essayText} className="font-code text-sm" />
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
                  value={rubric}
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
            <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-lg">
                    <Bot className="mr-2 size-5" /> Final Grade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading && (
                    <div className='flex items-center justify-center p-8'>
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {aiResult && !isLoading && (
                     <>
                        <div>
                            <Label htmlFor="final-score">Final Score (/100)</Label>
                            <Input
                            id="final-score"
                            value={finalScore}
                            onChange={(e) => setFinalScore(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Final Feedback</Label>
                            <Textarea 
                                rows={10} 
                                value={finalFeedback} 
                                onChange={(e) => setFinalFeedback(e.target.value)}
                            />
                        </div>
                     </>
                  )}
                   {!aiResult && !isLoading && (
                    <div className='text-center text-sm text-muted-foreground p-8'>
                        Run the AI assistant to get a preliminary grade and feedback.
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleFinalizeGrade} disabled={isSubmitting || !aiResult}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Finalize & Submit Grade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

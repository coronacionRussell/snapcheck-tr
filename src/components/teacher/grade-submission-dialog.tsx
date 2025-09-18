
'use client';
import { assistTeacherGrading } from '@/ai/flows/assist-teacher-grading';
import { analyzeEssayGrammar } from '@/ai/flows/analyze-essay-grammar';
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
import { Bot, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Submission } from './class-submissions';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import parse, { domToReact, Element } from 'html-react-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


type GradeSubmissionDialogProps = {
    submission: Submission;
    className: string;
    classId: string;
}

export function GradeSubmissionDialog({ submission, className, classId }: GradeSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRubricLoading, setIsRubricLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');
  const [rubric, setRubric] = useState('');
  const [aiResult, setAiResult] = useState<{
    feedback: string;
    preliminaryScore: string;
  } | null>(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const fetchRubric = async () => {
        if (!submission.activityId) {
            setRubric('This essay was submitted as a general submission and is not tied to a specific activity rubric.');
            setIsRubricLoading(false);
            return;
        }

        setIsRubricLoading(true);
        try {
            const activityDocRef = doc(db, 'classes', classId, 'activities', submission.activityId);
            const activityDoc = await getDoc(activityDocRef);

            if(activityDoc.exists()) {
                setRubric(activityDoc.data().rubric);
            } else {
                setRubric('No rubric found for this activity.');
                toast({
                    title: 'Rubric Not Found',
                    description: 'Could not find a rubric for the submitted activity.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error("Error fetching rubric: ", error);
            setRubric('Error loading rubric.');
             toast({
                title: 'Error',
                description: 'Could not load the rubric for this activity.',
                variant: 'destructive',
            })
        } finally {
            setIsRubricLoading(false);
        }
    }

    if (open) {
        fetchRubric();
    }
  }, [submission.activityId, classId, open, toast]);


  const handleRunAiGrading = async () => {
    setIsLoading(true);
    setAiResult(null);
    setGrammarAnalysis('');
    
    try {
      const [gradingResult, grammarResult] = await Promise.all([
        assistTeacherGrading({
          essayText: submission.essayText,
          rubricText: rubric,
        }),
        analyzeEssayGrammar({ essayText: submission.essayText })
      ]);

      setAiResult(gradingResult);
      setFinalFeedback(gradingResult.feedback);
      setFinalScore(gradingResult.preliminaryScore);
      setGrammarAnalysis(grammarResult.correctedHtml);

    } catch (error) {
      console.error(error);
      toast({
        title: 'AI Analysis Failed',
        description:
          'There was an error while running the AI assistants. Please try again.',
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
    setGrammarAnalysis('');
  }

  const parseOptions = {
    replace: (domNode: any) => {
      if (domNode instanceof Element && domNode.attribs && domNode.name === 'span') {
         if (domNode.attribs.class === 'spelling-error') {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="bg-blue-200/50 text-blue-800 rounded-md px-1 cursor-pointer">
                                {domToReact(domNode.children, parseOptions)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Correction: <strong className="text-primary">{domNode.attribs['data-suggestion']}</strong></p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        if (domNode.attribs.class === 'grammar-error') {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="bg-yellow-200/50 text-yellow-800 rounded-md px-1 cursor-pointer">
                                {domToReact(domNode.children, parseOptions)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Correction: <strong className="text-primary">{domNode.attribs['data-suggestion']}</strong></p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        if (domNode.attribs.class === 'correct') {
            return (
                <span>
                    {domToReact(domNode.children, parseOptions)}
                </span>
            );
        }
      }
    },
  };

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

            {grammarAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2 text-lg">
                            <CheckCircle className="size-5 text-primary" /> AI Grammar Analysis
                        </CardTitle>
                        <CardDescription>
                            Errors are highlighted. Hover over them to see the suggested correction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground whitespace-pre-wrap leading-relaxed">
                            {parse(grammarAnalysis, parseOptions)}
                        </div>
                    </CardContent>
                </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Rubric</CardTitle>
              </CardHeader>
              <CardContent>
                {isRubricLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                <Textarea
                  readOnly
                  rows={6}
                  value={rubric}
                  className="font-code text-sm"
                />}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">AI Tools</CardTitle>
                </CardHeader>
                <CardContent>
                     <Button
                        className="w-full"
                        onClick={handleRunAiGrading}
                        disabled={isLoading || isRubricLoading || !rubric}
                        >
                        {isLoading ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing...
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2" />
                            Run AI Grade & Grammar Assist
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-lg">
                    <Bot className="mr-2 size-5" /> Final Grade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="final-score">Final Score (/100)</Label>
                        <Input
                        id="final-score"
                        value={finalScore}
                        onChange={(e) => setFinalScore(e.target.value)}
                        placeholder='Enter a score (e.g., 85)'
                        />
                    </div>
                    <div>
                        <Label>Final Feedback</Label>
                        <Textarea 
                            rows={10} 
                            value={finalFeedback} 
                            onChange={(e) => setFinalFeedback(e.target.value)}
                            placeholder={isLoading ? 'Generating feedback...' : aiResult ? 'Edit the AI-generated feedback or write your own.' : 'Run the AI assistant to generate feedback, or write your own.'}
                        />
                    </div>
                </CardContent>
              </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleFinalizeGrade} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-8 w-8 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Finalize & Submit Grade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
import { Bot, CheckCircle, Eye, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Submission } from './class-submissions';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import parse, { domToReact, Element } from 'html-react-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Image from 'next/image';


type GradeSubmissionDialogProps = {
    submission: Submission;
    className: string;
    classId: string;
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
    runAiOnOpen?: boolean;
}

export function GradeSubmissionDialog({ submission: initialSubmission, className, classId, isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen, runAiOnOpen = false }: GradeSubmissionDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = setControlledIsOpen ?? setInternalIsOpen;

  const [submission, setSubmission] = useState<Submission>(initialSubmission);
  const [isLoading, setIsLoading] = useState(false);
  const [isRubricLoading, setIsRubricLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');
  const [rubric, setRubric] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [aiResult, setAiResult] = useState<{
    feedback: string;
    preliminaryScore: string;
  } | null>(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState('');

  const { toast } = useToast();

  const handleRunAiGrading = useCallback(async () => {
    if (!activityDescription) {
      toast({
        title: 'Cannot Run AI',
        description: 'AI grading requires an activity with a description.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setAiResult(null);
    setGrammarAnalysis('');
    
    try {
      const [gradingResult, grammarResult] = await Promise.all([
        assistTeacherGrading({
          essayText: submission.essayText,
          rubricText: rubric,
          activityDescription: activityDescription,
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
  }, [activityDescription, submission.essayText, rubric, toast]);

  useEffect(() => {
    if (isOpen) {
      const currentSubmission = {...initialSubmission};
      setSubmission(currentSubmission);
      setFinalScore(currentSubmission.grade || '');
      setFinalFeedback(currentSubmission.feedback || '');
      setAiResult(null);
      setGrammarAnalysis('');

      const submissionRef = doc(db, 'classes', classId, 'submissions', initialSubmission.id);
      const unsubscribe = onSnapshot(submissionRef, (doc) => {
        if (doc.exists()) {
          const updatedData = { id: doc.id, ...doc.data() } as Submission;
          setSubmission(updatedData);
          if (!finalScore) setFinalScore(updatedData.grade || '');
          if (!finalFeedback) setFinalFeedback(updatedData.feedback || '');
        }
      });
      return () => unsubscribe();
    }
  }, [isOpen, classId, initialSubmission.id, initialSubmission, finalScore, finalFeedback]);

  useEffect(() => {
    const fetchActivityDetails = async () => {
        if (!submission.activityId) {
            setRubric('This essay was submitted as a general submission and is not tied to a specific activity rubric.');
            setActivityDescription(''); // Set to empty string
            setIsRubricLoading(false);
            return;
        }

        setIsRubricLoading(true);
        try {
            const activityDocRef = doc(db, 'classes', classId, 'activities', submission.activityId);
            const activityDoc = await getDoc(activityDocRef);

            if(activityDoc.exists()) {
                const activityData = activityDoc.data();
                const desc = activityData.description || 'No description provided for this activity.';
                setRubric(activityData.rubric);
                setActivityDescription(desc);
                if (runAiOnOpen && desc) {
                  handleRunAiGrading();
                }
            } else {
                setRubric('No rubric found for this activity.');
                setActivityDescription('');
                toast({
                    title: 'Activity Not Found',
                    description: 'Could not find the details for the submitted activity.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error("Error fetching activity details: ", error);
            setRubric('Error loading rubric.');
            setActivityDescription('');
             toast({
                title: 'Error',
                description: 'Could not load the details for this activity.',
                variant: 'destructive',
            })
        } finally {
            setIsRubricLoading(false);
        }
    }

    if (isOpen) {
        fetchActivityDetails();
    }
  }, [submission.activityId, classId, isOpen, toast, runAiOnOpen, handleRunAiGrading]);
  
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
    setIsOpen(false);
    setAiResult(null);
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

  const isGraded = submission.status === 'Graded';

  const trigger = (
    <Button>
        {isGraded ? 'View Grade' : 'Grade'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
    }}>
       {controlledIsOpen === undefined && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {isGraded ? 'View Grade:' : 'Grade Submission:'} {submission.studentName}
          </DialogTitle>
          <DialogDescription>
            Assignment: {submission.assignmentName || 'Essay Submission'} | Class: {className} | Submitted: {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[75svh] grid-cols-1 gap-4 overflow-y-auto p-1 lg:grid-cols-3">
          
          <div className={`space-y-4 ${submission.essayImageUrl ? 'lg:col-span-1' : 'hidden'}`}>
             {submission.essayImageUrl && (
                <Card className="h-full">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">
                    Original Image
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative aspect-[8.5/11] w-full rounded-md border">
                        <Image
                            src={submission.essayImageUrl}
                            alt={`Original essay submission from ${submission.studentName}`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </CardContent>
                </Card>
            )}
          </div>
         
          <div className={`space-y-4 ${submission.essayImageUrl ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
             <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-lg">
                  Extracted Essay Text
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <Textarea readOnly rows={20} value={submission.essayText} className="font-code text-sm h-full" />
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
            
          </div>

          <div className="space-y-4 lg:col-span-1">
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
                  className="font-code text-sm bg-muted"
                />}
              </CardContent>
            </Card>
            
            {!isGraded && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">AI Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={handleRunAiGrading}
                            disabled={isLoading || isRubricLoading || !rubric || !activityDescription}
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
            )}

            <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-lg">
                    <Bot className="mr-2 size-5" /> {isGraded ? 'Final Grade' : 'Enter Final Grade'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="final-score">Final Score (/100)</Label>
                        <Input
                        id="final-score"
                        value={finalScore}
                        onChange={(e) => setFinalScore(e.target.value)}
                        placeholder={isGraded ? '-' : 'Enter a score (e.g., 85)'}
                        readOnly={isGraded}
                        />
                    </div>
                    <div>
                        <Label>Final Feedback</Label>
                        <Textarea 
                            rows={10} 
                            value={finalFeedback} 
                            onChange={(e) => setFinalFeedback(e.target.value)}
                            placeholder={isLoading ? 'Generating feedback...' : aiResult ? 'Edit the AI-generated feedback or write your own.' : isGraded ? 'No feedback was provided.' : 'Run the AI assistant to generate feedback, or write your own.'}
                            readOnly={isGraded}
                        />
                    </div>
                </CardContent>
              </Card>
          </div>
        </div>
        {!isGraded && (
            <DialogFooter>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button onClick={handleFinalizeGrade} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-8 w-8 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Finalize & Submit Grade'}
            </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

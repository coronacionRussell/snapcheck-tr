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
import { Textarea as CustomTextarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, CheckCircle, Eye, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input as CustomInput } from '../ui/input';
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
  const setIsOpen = controlledIsOpen ?? setInternalIsOpen;

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
    console.log("handleRunAiGrading called.");
    console.log("Inputs for AI grading: ", { essayText: submission.essayText, rubricText: rubric, activityDescription: activityDescription });

    if (!activityDescription || !rubric) {
      toast({
        title: 'Cannot Run AI',
        description: 'AI grading requires both an activity description and a rubric. Please ensure they are set for this activity.',
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

      console.log("AI Grading Result: ", gradingResult);
      console.log("AI Grammar Result: ", grammarResult);

      if (!gradingResult || !gradingResult.feedback || !gradingResult.preliminaryScore) {
        console.error("AI Grading Result is incomplete or malformed:", gradingResult);
        toast({
          title: 'AI Analysis Error',
          description: 'The AI returned an incomplete or malformed grading result.',
          variant: 'destructive',
        });
        setFinalFeedback('[Error: AI feedback incomplete]');
        setFinalScore('Error');
        return;
      }

      setAiResult(gradingResult);
      setFinalFeedback(gradingResult.feedback);
      setFinalScore(gradingResult.preliminaryScore);
      setGrammarAnalysis(grammarResult.correctedHtml);
      
      console.warn("State after AI update:", { aiResult: gradingResult, finalFeedback: gradingResult.feedback, finalScore: gradingResult.preliminaryScore });

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

  // This useEffect now primarily manages the dialog's open state and initial data loading.
  useEffect(() => {
    if (isOpen) {
      // Set submission to initial prop value
      setSubmission(initialSubmission);
      // Initialize finalScore/finalFeedback from initial submission prop
      setFinalScore(initialSubmission.grade || '');
      setFinalFeedback(initialSubmission.feedback || '');
      setAiResult(null);
      setGrammarAnalysis('');

      const submissionRef = doc(db, 'classes', classId, 'submissions', initialSubmission.id);
      const unsubscribe = onSnapshot(submissionRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedData = { id: docSnapshot.id, ...docSnapshot.data() } as Submission;
          setSubmission(updatedData);
          // *** IMPORTANT: Update finalScore and finalFeedback from updatedData here ***
          setFinalScore(updatedData.grade || '');
          setFinalFeedback(updatedData.feedback || '');
        }
      });
      return () => unsubscribe();
    } else {
      // When dialog closes, ensure all states are reset for the next time it opens
      setSubmission(initialSubmission); // Reset to original prop value
      setFinalScore('');
      setFinalFeedback('');
      setAiResult(null);
      setGrammarAnalysis('');
    }
  }, [isOpen, classId, initialSubmission]);

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
                console.log("Fetched Activity Description:", desc);
                console.log("Fetched Rubric:", activityData.rubric);
                setRubric(activityData.rubric);
                setActivityDescription(desc);
                // Only run AI if not already graded AND if explicitly requested (runAiOnOpen)
                // and if activity description and rubric are available.
                if (runAiOnOpen && !submission.grade && desc && activityData.rubric) {
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
  }, [submission.activityId, classId, isOpen, toast, runAiOnOpen, handleRunAiGrading, submission.grade]); // Added submission.grade to dependencies
  
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
        // The onSnapshot will now update the internal state, no need to manually update here
        setIsOpen(false);

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
    // Explicitly clear final score and feedback when closing the dialog
    setFinalScore('');
    setFinalFeedback('');
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

  console.log("Rendering GradeSubmissionDialog - finalScore:", finalScore, "finalFeedback:", finalFeedback);

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
         
          <div className={`space-y-4 flex flex-col ${submission.essayImageUrl ? 'lg:col-span-1' : 'lg:col-span-2'}`}> {/* Added flex flex-col here */}
             <Card className="flex-grow flex flex-col"> {/* Added flex-grow and flex flex-col */}
              <CardHeader>
                <CardTitle className="font-headline text-lg">
                  Extracted Essay Text
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CustomTextarea readOnly rows={20} value={String(submission.essayText)} className="font-code text-sm h-full text-foreground" />
              </CardContent>
            </Card>

            {grammarAnalysis && (
                <Card className="flex-grow flex flex-col"> {/* Added flex-grow and flex flex-col */}
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2 text-lg">
                            <CheckCircle className="size-5 text-primary" /> AI Grammar Analysis
                        </CardTitle>
                        <CardDescription>
                            Errors are highlighted. Hover over them to see the suggested correction.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="prose prose-sm max-w-none rounded-md border bg-secondary p-4 whitespace-pre-wrap leading-relaxed overflow-y-auto text-black"> {/* Removed fixed height */}
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
                <CustomTextarea
                  readOnly
                  rows={6}
                  value={String(rubric)}
                  className="font-code text-sm bg-muted text-foreground"
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
                        <input
                        id="final-score"
                        type="text"
                        value={String(finalScore)}
                        onChange={(e) => setFinalScore(e.target.value)}
                        readOnly={isGraded}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                        />
                    </div>
                    <div>
                        <Label>Final Feedback</Label>
                        <textarea 
                            rows={10} 
                            value={String(finalFeedback)}
                            onChange={(e) => setFinalFeedback(e.target.value)}
                            readOnly={isGraded}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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

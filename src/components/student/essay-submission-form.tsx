
'use client';

import { generateEssayFeedback } from '@/ai/flows/generate-essay-feedback';
import { scanEssay } from '@/ai/flows/scan-essay';
import { analyzeEssayGrammar } from '@/ai/flows/analyze-essay-grammar';
import { useToast } from '@/hooks/use-toast';
import { Bot, Camera, CheckCircle, Loader2, Sparkles, UploadCloud, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/use-auth';
import parse, { domToReact, Element } from 'html-react-parser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';


interface Activity {
    id: string;
    name: string;
    className: string;
    classId: string;
    rubric: string;
    description: string;
}

interface EssaySubmissionFormProps {
  preselectedActivityId?: string | null;
}

export function EssaySubmissionForm({ preselectedActivityId }: EssaySubmissionFormProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [essayText, setEssayText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [isActivityListLoading, setIsActivityListLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>(preselectedActivityId || undefined);
  
  const [rubric, setRubric] = useState('');
  
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [grammarAnalysis, setGrammarAnalysis] = useState('');
  const [isAnalyzingGrammar, setIsAnalyzingGrammar] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!user || !user.enrolledClassIds || user.enrolledClassIds.length === 0 || !db) {
      setAvailableActivities([]);
      setIsActivityListLoading(false);
      return;
    }

    setIsActivityListLoading(true);
    try {
      const activitiesData: Activity[] = [];
      const classIds = user.enrolledClassIds;

      for (const classId of classIds) {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
          const activitiesQuery = query(collection(db, 'classes', classId, 'activities'));
          const activitiesSnapshot = await getDocs(activitiesQuery);

          activitiesSnapshot.forEach(activityDoc => {
            const data = activityDoc.data();
            activitiesData.push({
                id: activityDoc.id,
                name: data.name,
                className: classDoc.data().name,
                classId: classId,
                rubric: data.rubric,
                description: data.description,
            });
          });
        }
      }
      
      setAvailableActivities(activitiesData);
      if (preselectedActivityId && activitiesData.some(a => a.id === preselectedActivityId)) {
        setSelectedActivity(preselectedActivityId);
      } else if (preselectedActivityId) {
        toast({
          title: 'Activity Not Found',
          description: "The pre-selected activity could not be found in your enrolled classes.",
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error("Error fetching activities: ", error);
      toast({
          title: 'Error',
          description: 'Could not fetch your available activities.',
          variant: 'destructive',
      })
    } finally {
      setIsActivityListLoading(false);
    }
  }, [toast, user, preselectedActivityId]);


  useEffect(() => {
    if (user && db) {
        fetchActivities();
    }
  }, [user, fetchActivities]);

  useEffect(() => {
    if (selectedActivity) {
      const activity = availableActivities.find(a => a.id === selectedActivity);
      setRubric(activity?.rubric || '');
    } else {
      setRubric('');
    }
  }, [selectedActivity, availableActivities]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        let stream;
        try {
           stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (err) {
            console.warn("Could not get environment camera, falling back to default");
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
        setIsCameraOpen(false);
      }
    };

    if (isCameraOpen) {
      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraOpen, toast]);

  const processImage = async (file: File) => {
    try {
        toast({ title: 'Compressing Image...', description: 'Preparing your image for a faster upload.' });
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // Store compressed file for upload, and create a preview URL from it
        setImageFile(compressedFile);
        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl); // Clean up previous preview
        }
        setImagePreviewUrl(URL.createObjectURL(compressedFile));

        setIsScanning(true);
        setEssayText('');
        
        const dataUri = await imageCompression.getDataUrlFromFile(compressedFile);

        toast({
            title: 'Scanning Essay...',
            description: 'The AI is extracting text from your image. This may take a moment.'
        });
        const result = await scanEssay({ imageDataUri: dataUri });
        setEssayText(result.extractedText);
        toast({
            title: 'Scan Complete!',
            description: 'The extracted text has been added to the text area.'
        });

    } catch (error) {
        console.error("Error processing image: ", error);
        toast({
            title: 'Image Processing Failed',
            description: 'There was an issue preparing or scanning your image. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsScanning(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'));
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                processImage(file);
            }
        }
        setIsCameraOpen(false);
    }
  };


  const handleGetFeedback = async () => {
     if (!selectedActivity) {
        toast({
            title: 'Missing Activity',
            description: 'Please select an activity before getting feedback.',
            variant: 'destructive',
          });
          return;
    }
    if (!essayText.trim() || !rubric.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide the essay text. The rubric should be loaded automatically.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingFeedback(true);
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
      setIsLoadingFeedback(false);
    }
  }

  const handleAnalyzeGrammar = async () => {
    if (!essayText.trim()) {
      toast({
        title: 'Missing Essay Text',
        description: 'Please provide some text to analyze.',
        variant: 'destructive',
      });
      return;
    }
    setIsAnalyzingGrammar(true);
    setGrammarAnalysis('');
    try {
      const result = await analyzeEssayGrammar({ essayText });
      setGrammarAnalysis(result.correctedHtml);
    } catch (error) {
      console.error('Error analyzing grammar:', error);
      toast({
        title: 'Analysis Failed',
        description: 'There was an error analyzing the grammar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingGrammar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
        toast({ title: "Not authenticated", variant: 'destructive'});
        return;
    }
    if (!selectedActivity) {
        toast({
            title: 'Missing Activity',
            description: 'Please select an activity before submitting.',
            variant: 'destructive',
          });
          return;
    }
    if (!essayText.trim()) {
      toast({
        title: 'Missing Essay Text',
        description: 'Please provide the essay text before submitting.',
        variant: 'destructive',
      });
      return;
    }

    const activity = availableActivities.find(a => a.id === selectedActivity);
    if (!activity) {
         toast({ title: "Selected activity not found.", variant: 'destructive'});
         return;
    }

    setIsSubmitting(true);
    
    try {
        let imageUrl = '';
        // If there's an image, upload it now and get the URL
        if (imageFile) {
            const uploadId = uuidv4();
            const filePath = `pending_uploads/${uploadId}/${imageFile.name}`;
            const storageRef = ref(storage, filePath);
            
            toast({
              title: 'Uploading Image...',
              description: 'Please wait while your essay image is uploaded.'
            });

            const uploadTask = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadTask.ref);
        }
      
        const studentId = user.uid; 
        const studentName = user.fullName;

        // Create submission document with the final image URL
        const submissionsCollection = collection(db, 'classes', activity.classId, 'submissions');
        await addDoc(submissionsCollection, {
            studentId,
            studentName,
            essayText,
            submittedAt: Timestamp.now(),
            status: 'Pending Review',
            assignmentName: activity.name,
            activityId: activity.id,
            essayImageUrl: imageUrl,
        });

        toast({
            title: 'Essay Submitted!',
            description: 'Your teacher has received your essay for grading.',
        });
        
        // Reset form
        setEssayText('');
        setFeedback('');
        setGrammarAnalysis('');
        setImageFile(null);
        setImagePreviewUrl(null);
        if (!preselectedActivityId) {
            setSelectedActivity(undefined);
        }

    } catch (error) {
        console.error(error);
        toast({
            title: 'Submission Failed',
            description: 'There was an error submitting your essay. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if(imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    const fileInput = document.getElementById('essay-photo') as HTMLInputElement;
    if(fileInput) {
        fileInput.value = '';
    }
  };

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
  
  const formDisabled = isAuthLoading || isLoadingFeedback || isScanning || isSubmitting || isAnalyzingGrammar;
  const currentActivity = availableActivities.find(a => a.id === selectedActivity);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       {preselectedActivityId && currentActivity ? (
           <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">1. Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 rounded-md border bg-muted p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Class</p>
                            <p className="font-semibold">{currentActivity.className}</p>
                        </div>
                        <div>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Activity</p>
                            <p className="font-semibold">{currentActivity.name}</p>
                        </div>
                        <div>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Description / Questions</p>
                            <p className="text-sm whitespace-pre-wrap">{currentActivity.description}</p>
                        </div>
                    </div>
                </CardContent>
           </Card>
        ) : (
            <Card>
                <CardHeader>
                <CardTitle className="font-headline text-lg">
                    1. Activity
                </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="activity-select">Activity</Label>
                        <Select onValueChange={setSelectedActivity} required disabled={formDisabled || availableActivities.length === 0} value={selectedActivity}>
                            <SelectTrigger id="activity-select">
                                <SelectValue placeholder={isAuthLoading || isActivityListLoading ? "Loading activities..." : "Select an activity..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableActivities.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.className}: {a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {availableActivities.length === 0 && !isActivityListLoading && (
                            <p className="text-xs text-muted-foreground">You are not enrolled in any classes with activities, or no activities have been created yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            2. Your Essay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="essay-photo">Upload Photo</Label>
              <div className="relative">
                <UploadCloud className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="essay-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="pl-10"
                  disabled={formDisabled}
                />
              </div>
               <p className="text-xs text-muted-foreground">
                Our AI will convert it to text.
              </p>
            </div>
             <div className="space-y-1.5">
               <Label>Or Use Camera</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsCameraOpen(true)}
                 disabled={formDisabled}
              >
                <Camera className="mr-2 size-4" /> Open Camera
              </Button>
               <p className="text-xs text-muted-foreground invisible">
                Placeholder
              </p>
            </div>
          </div>

           {isCameraOpen && (
            <div className="space-y-4 rounded-lg border bg-background/50 p-4">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                 <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access to use this feature. You may need to change permissions in your browser settings.
                    </AlertDescription>
                </Alert>
              )}
               <div className="flex justify-end gap-2">
                 <Button type="button" variant="ghost" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                  <Camera className="mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          )}

          {imagePreviewUrl && (
            <Card>
                <CardHeader className="flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Image Preview</CardTitle>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleRemoveImage} disabled={formDisabled}>
                      <Trash2 className="mr-2" />
                      Remove Image
                  </Button>
                </CardHeader>
                <CardContent>
                    <div className="relative aspect-video w-full max-w-md mx-auto">
                        <Image src={imagePreviewUrl} alt="Essay preview" fill className="object-contain rounded-md border" />
                    </div>
                </CardContent>
            </Card>
          )}

          <div className="space-y-2 pt-4">
            <Label htmlFor="essay-text">Essay Text</Label>
            <Textarea
              id="essay-text"
              placeholder={isScanning ? "Scanning... please wait." : "Your essay text will appear here after uploading or capturing a photo..."}
              rows={10}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              required
              className="font-code"
              disabled={isScanning || isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">3. Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="rubric-text">Grading Rubric (from your teacher)</Label>
            <Textarea
              id="rubric-text"
              placeholder={isActivityListLoading ? "Loading..." : "Select an activity to see its rubric..."}
              rows={5}
              value={rubric}
              readOnly
              className="font-code bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
         <Button type="button" size="lg" className="w-full" variant="outline" disabled={formDisabled} onClick={handleAnalyzeGrammar}>
            {isAnalyzingGrammar ? (
            <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Analyzing...
            </>
            ) : (
            <>
                <CheckCircle className="mr-2 size-4" />
                Analyze Grammar
            </>
            )}
        </Button>
         <Button type="button" size="lg" className="w-full" variant="outline" disabled={formDisabled || !selectedActivity} onClick={handleGetFeedback}>
            {isLoadingFeedback ? (
            <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Generating Feedback...
            </>
            ) : (
            <>
                <Sparkles className="mr-2 size-4" />
                Get Rubric Feedback
            </>
            )}
        </Button>
      </div>

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

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-lg">
              <Bot className="mr-2 size-5" /> AI Rubric Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground whitespace-pre-wrap">
              {feedback}
            </div>
          </CardContent>
        </Card>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={formDisabled || !selectedActivity}>
            {isSubmitting ? (
            <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Submitting for Grading...
            </>
            ) : (
            'Submit for Grading'
            )}
        </Button>
    </form>
  );
}


'use client';

import { generateEssayFeedback } from '@/ai/flows/generate-essay-feedback';
import { scanEssay } from '@/ai/flows/scan-essay';
import { useToast } from '@/hooks/use-toast';
import { Bot, Camera, Loader2, Sparkles, UploadCloud, Video } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

interface EnrolledClass {
    id: string;
    name: string;
}

export function EssaySubmissionForm() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [essayText, setEssayText] = useState('');
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [isClassListLoading, setIsClassListLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [rubric, setRubric] = useState('');
  const [isRubricLoading, setIsRubricLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const fetchEnrolledClasses = useCallback(async () => {
    if (!user) return;
    setIsClassListLoading(true);
    try {
      const studentId = user.uid;

      const classesCollection = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesCollection);
      
      const classesData: EnrolledClass[] = [];

      for (const classDoc of classesSnapshot.docs) {
          const studentDocRef = doc(db, `classes/${classDoc.id}/students`, studentId);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
              classesData.push({
                  id: classDoc.id,
                  name: classDoc.data().name,
              });
          }
      }
      setEnrolledClasses(classesData);

    } catch (error) {
      console.error("Error fetching enrolled classes: ", error);
      toast({
          title: 'Error',
          description: 'Could not fetch your classes.',
          variant: 'destructive',
      })
    } finally {
      setIsClassListLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
        fetchEnrolledClasses();
    }
  }, [user, fetchEnrolledClasses]);

  useEffect(() => {
    const fetchRubric = async () => {
        if (!selectedClass) {
            setRubric('');
            return;
        };

        setIsRubricLoading(true);
        try {
            const rubricDocRef = doc(db, 'rubrics', selectedClass);
            const rubricDoc = await getDoc(rubricDocRef);

            if(rubricDoc.exists()) {
                setRubric(rubricDoc.data().content);
            } else {
                setRubric('No rubric found for this class.');
                toast({
                    title: 'Rubric Not Found',
                    description: 'Your teacher has not set a rubric for this class yet.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error("Error fetching rubric: ", error);
            setRubric('Error loading rubric.');
             toast({
                title: 'Error',
                description: 'Could not load the rubric for this class.',
                variant: 'destructive',
            })
        } finally {
            setIsRubricLoading(false);
        }
    }
    fetchRubric();
  }, [selectedClass, toast]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const constraints = {
            video: {
                facingMode: 'environment'
            }
        };
        
        let stream;
        try {
           stream = await navigator.mediaDevices.getUserMedia(constraints);
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

  const processImage = async (imageDataUri: string) => {
    setIsScanning(true);
    setEssayText('');
    try {
        toast({
            title: 'Scanning Essay...',
            description: 'The AI is extracting text from your image. This may take a moment.'
        });
        const result = await scanEssay({ imageDataUri });
        setEssayText(result.extractedText);
        toast({
            title: 'Scan Complete!',
            description: 'The extracted text has been added to the text area.'
        });
    } catch (error) {
        console.error("Error scanning essay: ", error);
        toast({
            title: 'Scan Failed',
            description: 'Could not extract text from the image. Please try again with a clearer photo.',
            variant: 'destructive'
        });
    } finally {
        setIsScanning(false);
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string;
        if (dataUri) {
            processImage(dataUri);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        processImage(dataUri);
        setIsCameraOpen(false);
      }
    }
  };

  const handleGetFeedback = async () => {
     if (!selectedClass) {
        toast({
            title: 'Missing Class',
            description: 'Please select a class before getting feedback.',
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
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
        toast({ title: "Not authenticated", variant: 'destructive'});
        return;
    }
    if (!selectedClass) {
        toast({
            title: 'Missing Class',
            description: 'Please select a class before submitting.',
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

    setIsSubmitting(true);
    try {
      const studentId = user.uid; 
      const studentName = user.fullName;

      const submissionsCollection = collection(db, 'classes', selectedClass, 'submissions');
      await addDoc(submissionsCollection, {
        studentId,
        studentName,
        essayText,
        submittedAt: serverTimestamp(),
        status: 'Pending Review',
        assignmentName: 'Student Essay Submission'
      });
      
      toast({
        title: 'Essay Submitted!',
        description: 'Your teacher has received your essay for grading.',
      });
      
      setEssayText('');
      setFeedback('');
      setSelectedClass(null);

    } catch (error) {
      console.error(error);
      toast({
        title: 'Submission Failed',
        description:
          'There was an error submitting your essay. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formDisabled = isAuthLoading || isLoading || isScanning || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">
            1. Select Your Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="class-select">Class</Label>
            <Select onValueChange={setSelectedClass} required disabled={isAuthLoading || isClassListLoading || enrolledClasses.length === 0} value={selectedClass || ''}>
                <SelectTrigger id="class-select">
                    <SelectValue placeholder={isAuthLoading || isClassListLoading ? "Loading classes..." : "Enroll in a class to get started..."} />
                </SelectTrigger>
                <SelectContent>
                    {enrolledClasses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardContent>
       </Card>

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
                <Video className="mr-2 size-4" /> Open Camera
              </Button>
               <p className="text-xs text-muted-foreground invisible">
                Placeholder
              </p>
            </div>
          </div>

           {isCameraOpen && (
            <div className="space-y-4 rounded-lg border p-4">
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
                 <Button type="button" variant="secondary" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
                <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                  <Camera className="mr-2" />
                  Capture
                </Button>
              </div>
            </div>
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
              placeholder={isRubricLoading ? "Loading rubric..." : "Select a class to see the rubric..."}
              rows={5}
              value={rubric}
              readOnly
              className="font-code bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row">
         <Button type="button" size="lg" className="flex-1" disabled={formDisabled} onClick={handleGetFeedback}>
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
        <Button type="submit" size="lg" className="flex-1" disabled={formDisabled}>
            {isSubmitting ? (
            <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting for Grading...
            </>
            ) : (
            'Submit for Grading'
            )}
        </Button>
      </div>


      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-lg">
              <Bot className="size-5" /> AI Generated Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground whitespace-pre-wrap">
              {feedback}
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}

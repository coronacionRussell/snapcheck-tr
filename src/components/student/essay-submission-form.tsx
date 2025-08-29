'use client';

import { generateEssayFeedback } from '@/ai/flows/generate-essay-feedback';
import { useToast } from '@/hooks/use-toast';
import { Bot, Camera, Loader2, Sparkles, UploadCloud, Video } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const MOCK_ESSAY_TEXT =
  "To be or not to be, that is the question. This seminal line from Shakespeare's Hamlet encapsulates the central theme of existential dread and the internal conflict of the protagonist. Hamlet's contemplation of suicide is not merely a moment of weakness, but a profound philosophical inquiry into the nature of life, death, and the afterlife. The play explores the human condition, forcing the audience to confront their own mortality and the choices they make.";

const MOCK_RUBRICS: { [key: string]: string } = {
  ENG101: '1. Thesis Statement (25pts): Is the thesis clear, concise, and arguable? \n2. Evidence & Analysis (40pts): Does the essay use relevant textual evidence? Is the analysis of this evidence insightful and well-developed? \n3. Structure & Organization (20pts): Is the essay logically structured with clear topic sentences and smooth transitions? \n4. Clarity & Style (15pts): Is the language clear, precise, and free of grammatical errors?',
  WRI202: 'A. Argument (30%): Presents a strong, clear argument. \nB. Research (30%): Incorporates a wide range of credible sources. \nC. Counterarguments (20%): Addresses and refutes counterarguments effectively. \nD. APA Formatting (20%): Adheres to APA style guidelines.',
};

const enrolledClasses = [
  { id: 'ENG101', name: 'English Literature 101' },
  { id: 'WRI202', name: 'Advanced Composition' },
];

export function EssaySubmissionForm() {
  const [essayText, setEssayText] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [rubric, setRubric] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedClass && MOCK_RUBRICS[selectedClass]) {
      setRubric(MOCK_RUBRICS[selectedClass]);
    } else {
      setRubric('');
    }
  }, [selectedClass]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: 'File Uploaded',
        description:
          'OCR simulation: Essay text has been populated automatically.',
      });
      setEssayText(MOCK_ESSAY_TEXT);
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
        toast({
          title: 'Image Captured',
          description:
            'OCR simulation: Essay text has been populated automatically.',
        });
        setEssayText(MOCK_ESSAY_TEXT);
        setIsCameraOpen(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClass) {
        toast({
            title: 'Missing Class',
            description: 'Please select a class before submitting.',
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
  };

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
            <Select onValueChange={setSelectedClass} required>
                <SelectTrigger id="class-select">
                    <SelectValue placeholder="Select the class for this submission..." />
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
                />
              </div>
               <p className="text-xs text-muted-foreground">
                Our OCR will convert it to text.
              </p>
            </div>
             <div className="space-y-1.5">
               <Label>Or Use Camera</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsCameraOpen(true)}
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
                 <Button variant="secondary" onClick={() => setIsCameraOpen(false)}>Cancel</Button>
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
              placeholder="Your essay text will appear here after uploading or capturing a photo..."
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
          <CardTitle className="font-headline text-lg">3. Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="rubric-text">Grading Rubric (from your teacher)</Label>
            <Textarea
              id="rubric-text"
              placeholder="Select a class to see the rubric..."
              rows={5}
              value={rubric}
              readOnly
              className="font-code bg-muted"
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

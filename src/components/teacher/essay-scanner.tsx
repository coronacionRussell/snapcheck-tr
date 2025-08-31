
'use client';

import { scanEssay } from '@/ai/flows/scan-essay';
import { useToast } from '@/hooks/use-toast';
import { Camera, ClipboardCopy, Loader2, ScanLine, Trash2, UploadCloud, Video } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export function EssayScanner() {
  const [essayText, setEssayText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const constraints = { video: { facingMode: 'environment' } };
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
        description: 'The extracted text has been added below.'
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

  const handleCopyText = () => {
    if (!essayText) return;
    navigator.clipboard.writeText(essayText);
    toast({ title: 'Copied!', description: 'The essay text has been copied to your clipboard.' });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <ScanLine className="size-5"/>
            Essay Input
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
                  disabled={isScanning}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Or Use Camera</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsCameraOpen(true)}
                disabled={isScanning}
              >
                <Video className="mr-2 size-4" /> Open Camera
              </Button>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle className="font-headline text-lg">
                    Extracted Text
                </CardTitle>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyText} disabled={!essayText || isScanning}>
                    <ClipboardCopy className="mr-2" />
                    Copy
                </Button>
                 <Button variant="outline" size="sm" onClick={() => setEssayText('')} disabled={!essayText || isScanning}>
                    <Trash2 className="mr-2" />
                    Clear
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             {isScanning && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-60">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">AI is scanning the essay...</p>
                </div>
            )}
            {!isScanning && (
                <Textarea
                    id="essay-text"
                    placeholder="The text extracted from the essay image will appear here..."
                    rows={12}
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    className="font-code"
                />
            )}
        </CardContent>
      </Card>
    </div>
  );
}

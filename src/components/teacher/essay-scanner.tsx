
'use client';

import { scanEssay } from '@/ai/flows/scan-essay';
import { generateUploadToken } from '@/ai/flows/generate-upload-token';
import { useToast } from '@/hooks/use-toast';
import { Camera, ClipboardCopy, Loader2, ScanLine, Trash2, UploadCloud, Save } from 'lucide-react';
import { useState, useRef, useEffect, useContext } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ClassContext } from '@/contexts/class-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { collection, onSnapshot, query, addDoc, serverTimestamp, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/use-auth';
import type { Activity } from './class-activities';
import imageCompression from 'browser-image-compression';


interface Student {
    id: string;
    name: string;
}

export function EssayScanner() {
  const { user } = useAuth();
  const { classes, isLoading: areClassesLoading } = useContext(ClassContext);
  const [essayText, setEssayText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentListLoading, setIsStudentListLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivityListLoading, setIsActivityListLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

   useEffect(() => {
    if (!selectedClass) {
        setStudents([]);
        setSelectedStudent(null);
        setActivities([]);
        setSelectedActivity(null);
        return;
    };

    setIsStudentListLoading(true);
    const studentsCollection = collection(db, 'classes', selectedClass, 'students');
    const studentsQuery = query(studentsCollection);
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
        const studentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        setStudents(studentData);
        setIsStudentListLoading(false);
    }, (error) => {
        console.error("Error fetching students: ", error);
        toast({ title: 'Error', description: 'Could not fetch student list for this class.', variant: 'destructive'});
        setIsStudentListLoading(false);
    });

    setIsActivityListLoading(true);
    const activitiesCollection = collection(db, 'classes', selectedClass, 'activities');
    const activitiesQuery = query(activitiesCollection);
    const unsubscribeActivities = onSnapshot(activitiesQuery, (querySnapshot) => {
        const activityData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
        setActivities(activityData);
        setIsActivityListLoading(false);
    }, (error) => {
        console.error("Error fetching activities: ", error);
        toast({ title: 'Error', description: 'Could not fetch activity list for this class.', variant: 'destructive'});
        setIsActivityListLoading(false);
    });


    return () => {
      unsubscribeStudents();
      unsubscribeActivities();
    }
  }, [selectedClass, toast]);

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

  const processImage = async (file: File) => {
    try {
        toast({ title: 'Compressing Image...', description: 'Preparing your image for a faster upload.' });
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);

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
            description: 'The extracted text has been added below.'
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


  const handleCopyText = () => {
    if (!essayText) return;
    navigator.clipboard.writeText(essayText);
    toast({ title: 'Copied!', description: 'The essay text has been copied to your clipboard.' });
  }
  
  const handleSaveEssay = async () => {
    if (!selectedClass || !selectedStudent || !selectedActivity || !essayText.trim()) {
        toast({ title: 'Missing Information', description: 'Please select a class, student, activity and provide essay text.', variant: 'destructive'});
        return;
    }
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to save an essay.', variant: 'destructive' });
        return;
    }

    setIsSaving(true);
    let submissionRef;
    try {
        const studentName = students.find(s => s.id === selectedStudent)?.name || 'Unknown Student';
        const assignmentName = activities.find(a => a.id === selectedActivity)?.name || 'Unknown Activity';

        // 1. Create the Firestore document first
        const submissionsCollection = collection(db, 'classes', selectedClass, 'submissions');
        submissionRef = await addDoc(submissionsCollection, {
            studentId: selectedStudent,
            studentName,
            assignmentName,
            activityId: selectedActivity,
            essayText,
            submittedAt: new Date(),
            status: 'Pending Review',
            essayImageUrl: '', // Initially empty
        });

        let imageUrl = '';
        // 2. If an image exists, get a token, upload it, then update the doc
        if (imageFile) {
            // The uploader is the TEACHER, so we use their UID
            const { token, uploadId } = await generateUploadToken({ userId: user.uid });
            const filePath = `user_uploads/${user.uid}/${uploadId}/${imageFile.name}`;
            const storageRef = ref(storage, filePath);
            const metadata = { customMetadata: { authToken: token } };

            toast({
              title: 'Uploading Image...',
              description: 'The essay has been saved. Attaching the scanned image now.'
            });
            
            const uploadTask = await uploadBytes(storageRef, imageFile, metadata);
            imageUrl = await getDownloadURL(uploadTask.ref);

            // 3. Update the document with the final image URL
            await updateDoc(submissionRef, { essayImageUrl: imageUrl });
        }


        toast({
            title: 'Essay Saved!',
            description: `The essay for ${studentName} has been saved for activity "${assignmentName}".`
        });
        
        // Reset form immediately
        setEssayText('');
        setImageFile(null);
        setSelectedStudent(null);
        setSelectedActivity(null);
        const fileInput = document.getElementById('essay-photo') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

    } catch (error) {
        console.error("Error saving essay submission: ", error);
        toast({ title: 'Error', description: 'Could not save the essay submission.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <ScanLine className="size-5"/>
            Essay Input
          </CardTitle>
          <CardDescription>First, scan the essay by uploading a photo or using your camera.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="essay-photo">Upload Photo</Label>
              <div className="relative">
                <UploadCloud className="pointer-events-none absolute left-3 top-1.2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="essay-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="pl-10"
                  disabled={isScanning || isSaving}
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
                disabled={isScanning || isSaving}
              >
                <Camera className="mr-2 size-4" /> Open Camera
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
                    Extracted Text & Submission
                </CardTitle>
                 <CardDescription>Next, verify the text, choose a student and activity, and save it to your class.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyText} disabled={!essayText || isScanning || isSaving}>
                    <ClipboardCopy className="mr-2" />
                    Copy
                </Button>
                 <Button variant="outline" size="sm" onClick={() => {setEssayText(''); setImageFile(null);}} disabled={!essayText || isScanning || isSaving}>
                    <Trash2 className="mr-2" />
                    Clear
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
             {isScanning && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">AI is scanning the essay...</p>
                </div>
            )}
            {!isScanning && (
              <>
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="class-select">Class</Label>
                      <Select onValueChange={(value) => setSelectedClass(value)} value={selectedClass || ''} disabled={areClassesLoading || isSaving}>
                          <SelectTrigger id="class-select">
                              <SelectValue placeholder={areClassesLoading ? "Loading classes..." : "Select a class"} />
                          </SelectTrigger>
                          <SelectContent>
                              {classes.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="student-select">Student</Label>
                      <Select onValueChange={(value) => setSelectedStudent(value)} value={selectedStudent || ''} disabled={!selectedClass || isStudentListLoading || isSaving}>
                          <SelectTrigger id="student-select">
                              <SelectValue placeholder={!selectedClass ? "First select a class" : isStudentListLoading ? "Loading students..." : "Select a student"} />
                          </SelectTrigger>
                          <SelectContent>
                              {students.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-select">Activity</Label>
                      <Select onValueChange={(value) => setSelectedActivity(value)} value={selectedActivity || ''} disabled={!selectedClass || isActivityListLoading || isSaving}>
                          <SelectTrigger id="activity-select">
                              <SelectValue placeholder={!selectedClass ? "First select a class" : isActivityListLoading ? "Loading activities..." : "Select an activity"} />
                          </SelectTrigger>
                          <SelectContent>
                              {activities.map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>

                  <Textarea
                      id="essay-text"
                      placeholder="The text extracted from the essay image will appear here..."
                      rows={12}
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      className="font-code"
                      disabled={isSaving}
                  />
                   <div className="flex justify-end">
                      <Button onClick={handleSaveEssay} disabled={isSaving || isScanning || !essayText}>
                        {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {isSaving ? 'Saving...' : <><Save className="mr-2"/> Save Essay to Class</>}
                      </Button>
                  </div>
              </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

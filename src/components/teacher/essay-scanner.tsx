
'use client';

import { scanEssay } from '@/ai/flows/scan-essay';
import { useToast } from '@/hooks/use-toast';
import { Camera, ClipboardCopy, Loader2, ScanLine, Trash2, UploadCloud, Save, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ClassContext } from '@/contexts/class-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { collection, onSnapshot, query, addDoc, getDocs, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/use-auth';
import type { Activity } from './class-activities';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { GradeSubmissionDialog } from './grade-submission-dialog';
import { Submission } from './class-submissions';
import Image from 'next/image';

interface Student {
    id: string;
    name: string;
}

export function EssayScanner() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const preselectedActivityId = searchParams.get('activityId');
  const preselectedStudentId = searchParams.get('studentId');

  const { user } = useAuth();
  const { classes, isLoading: areClassesLoading } = useContext(ClassContext);
  const [essayText, setEssayText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const [prefilledData, setPrefilledData] = useState<{className: string, studentName: string, activityName: string} | null>(null);

  const [selectedClass, setSelectedClass] = useState<string | undefined>(preselectedClassId || undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentListLoading, setIsStudentListLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>(preselectedStudentId || undefined);
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivityListLoading, setIsActivityListLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>(preselectedActivityId || undefined);

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isGrading, setIsGrading] = useState(false);
  const [newlyCreatedSubmission, setNewlyCreatedSubmission] = useState<Submission | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);

  const isPrefilled = !!(preselectedClassId && preselectedActivityId && preselectedStudentId);
  const formDisabled = isScanning || isSaving || isGrading;
  const canSave = selectedClass && selectedStudent && selectedActivity && (essayText.trim() || imageFile);

  const fetchPrefilledData = useCallback(async () => {
    if (!isPrefilled || !db) return;

    try {
        const [classDoc, studentDoc, activityDoc] = await Promise.all([
            getDoc(doc(db, 'classes', preselectedClassId!)),
            getDoc(doc(db, 'classes', preselectedClassId!, 'students', preselectedStudentId!)),
            getDoc(doc(db, 'classes', preselectedClassId!, 'activities', preselectedActivityId!)),
        ]);
        
        setPrefilledData({
            className: classDoc.exists() ? classDoc.data().name : 'Unknown Class',
            studentName: studentDoc.exists() ? studentDoc.data().name : 'Unknown Student',
            activityName: activityDoc.exists() ? activityDoc.data().name : 'Unknown Activity'
        });
    } catch(error) {
        console.error("Error fetching prefilled data: ", error);
        toast({ title: 'Error', description: 'Could not load the details for this pre-selected submission.', variant: 'destructive'});
    }
  }, [isPrefilled, preselectedClassId, preselectedStudentId, preselectedActivityId, toast]);

  useEffect(() => {
    fetchPrefilledData();
  }, [fetchPrefilledData]);


   useEffect(() => {
    if (preselectedClassId) {
        setSelectedClass(preselectedClassId);
    }
    if (preselectedStudentId) {
        setSelectedStudent(preselectedStudentId);
    }
    if (preselectedActivityId) {
        setSelectedActivity(preselectedActivityId);
    }
  }, [preselectedClassId, preselectedStudentId, preselectedActivityId]);

  useEffect(() => {
    let unsubStudents: (() => void) | undefined;
    let unsubActivities: (() => void) | undefined;
  
    if (isPrefilled) {
      setStudents([]);
      setActivities([]);
      return;
    }
  
    if (selectedClass && db) {
      setIsStudentListLoading(true);
      const studentsQuery = query(collection(db, 'classes', selectedClass, 'students'));
      unsubStudents = onSnapshot(studentsQuery, 
        (snapshot) => {
          const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
          setStudents(studentData);
          setIsStudentListLoading(false);
        },
        (error) => {
          console.error("Error fetching students:", error);
          toast({ title: 'Error', description: 'Could not fetch students for this class.', variant: 'destructive' });
          setIsStudentListLoading(false);
        }
      );
  
      setIsActivityListLoading(true);
      const activitiesQuery = query(collection(db, 'classes', selectedClass, 'activities'));
      unsubActivities = onSnapshot(activitiesQuery,
        (snapshot) => {
          const activityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
          setActivities(activityData);
          setIsActivityListLoading(false);
        },
        (error) => {
          console.error("Error fetching activities:", error);
          toast({ title: 'Error', description: 'Could not fetch activities for this class.', variant: 'destructive' });
          setIsActivityListLoading(false);
        }
      );
    } else {
      setStudents([]);
      setActivities([]);
      setSelectedStudent(undefined);
      setSelectedActivity(undefined);
    }
  
    return () => {
      unsubStudents?.();
      unsubActivities?.();
    };
  }, [selectedClass, isPrefilled, toast]);


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

  const processImage = async (file: File): Promise<string | null> => {
    try {
        toast({ title: 'Compressing Image...', description: 'Preparing your image for a faster upload.' });
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);

        if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
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
        const fullText = result.extractedText;

        toast({
            title: 'Scan Complete!',
            description: 'The extracted text has been added below.'
        });

        if (!isPrefilled && students.length > 0 && activities.length > 0) {
            const lines = fullText.split('\n').map(line => line.trim());
            if (lines.length > 1) {
                const studentNameLine = lines[0];
                const activityNameLine = lines[1];

                const matchedStudent = students.find(s => s.name.toLowerCase().includes(studentNameLine.toLowerCase()));
                if (matchedStudent) {
                    setSelectedStudent(matchedStudent.id);
                    toast({
                        title: 'Student Matched!',
                        description: `Automatically selected "${matchedStudent.name}".`,
                    });
                }

                const matchedActivity = activities.find(a => a.name.toLowerCase().includes(activityNameLine.toLowerCase()));
                if (matchedActivity) {
                    setSelectedActivity(matchedActivity.id);
                    toast({
                        title: 'Activity Matched!',
                        description: `Automatically selected "${matchedActivity.name}".`,
                    });
                }
            }
        }
        setEssayText(fullText);

        setIsScanning(false);
        return fullText;
    } catch (error) {
        console.error("Error processing image: ", error);
        toast({
            title: 'Image Processing Failed',
            description: 'There was an issue preparing or scanning your image. Please try again.',
            variant: 'destructive'
        });
        setIsScanning(false);
        return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
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
                await processImage(file);
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

  const resetForm = () => {
    setEssayText('');
    setImageFile(null);
    handleRemoveImage();
    if(!isPrefilled) {
        setSelectedClass(undefined);
        setSelectedStudent(undefined);
        setSelectedActivity(undefined);
    }
    const fileInput = document.getElementById('essay-photo') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  }
  
  const handleSaveOrGrade = async (gradeAfterSave: boolean) => {
    if (!user) {
        toast({ title: 'Not Authenticated', variant: 'destructive' });
        return;
    }
    if (!canSave) {
        toast({ title: 'Missing Information', description: 'Please provide essay text/image and select a class, student, and activity.', variant: 'destructive'});
        return;
    }

    if (gradeAfterSave) setIsGrading(true);
    else setIsSaving(true);
    
    try {
        const studentDoc = await getDoc(doc(db, 'classes', selectedClass!, 'students', selectedStudent!));
        const activityDoc = await getDoc(doc(db, 'classes', selectedClass!, 'activities', selectedActivity!));

        if (!studentDoc.exists()) {
            toast({ title: 'Error', description: 'Could not find the selected student in the database.', variant: 'destructive' });
            setIsSaving(false); setIsGrading(false); return;
        }

        if (!activityDoc.exists()) {
            toast({ title: 'Error', description: 'Could not find the selected activity in the database.', variant: 'destructive' });
            setIsSaving(false); setIsGrading(false); return;
        }

        const student = { id: studentDoc.id, ...studentDoc.data() } as Student;
        const activity = { id: activityDoc.id, ...activityDoc.data() } as Activity;

        let imageUrl = '';
        if (imageFile) {
            const uploadId = uuidv4();
            const filePath = `submissions/${selectedClass}/${selectedStudent}/${uploadId}-${imageFile.name}`;
            const storageRef = ref(storage, filePath);
            toast({ title: 'Uploading Image...', description: 'Please wait while the image is uploaded.' });
            const uploadTask = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadTask.ref);
        }
        
        const submissionData = {
            studentId: student.id,
            studentName: student.name,
            assignmentName: activity.name,
            activityId: activity.id,
            essayText: essayText,
            submittedAt: Timestamp.now(),
            status: 'Pending Review' as 'Pending Review',
            essayImageUrl: imageUrl,
        };

        const submissionsCollection = collection(db, 'classes', selectedClass!, 'submissions');
        const docRef = await addDoc(submissionsCollection, submissionData);
        
        const finalSubmissionObject: Submission = {
            id: docRef.id,
            ...submissionData,
        };

        toast({ title: 'Essay Saved!', description: `The submission for ${student.name} was created.` });

        if (gradeAfterSave) {
             toast({ title: 'Running AI Assistant...', description: 'Preparing the grading dialog.' });
             setNewlyCreatedSubmission(finalSubmissionObject);
             setIsGradeDialogOpen(true);
        }
        
        resetForm();

    } catch (error) {
        console.error("Error saving submission: ", error);
        toast({ title: 'Error', description: 'Could not save the submission.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
        setIsGrading(false);
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
          <CardDescription>First, get the essay text by uploading a photo, using the camera, or pasting it directly.</CardDescription>
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
                    <div className="relative aspect-[8.5/11] w-full max-w-sm mx-auto">
                        <Image src={imagePreviewUrl} alt="Essay preview" fill className="object-contain rounded-md border" />
                    </div>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
                <CardTitle className="font-headline text-lg">
                    Submission Details
                </CardTitle>
                 <CardDescription>Next, verify the text, choose a student and activity, and save it to your class.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyText} disabled={!essayText || formDisabled}>
                    <ClipboardCopy className="mr-2" />
                    Copy
                </Button>
                 <Button variant="outline" size="sm" onClick={resetForm} disabled={(!essayText && !imageFile) || formDisabled}>
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
                 { isPrefilled && prefilledData ? (
                    <div className="space-y-4 rounded-md border bg-muted p-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Class</p>
                            <p className="font-semibold">{prefilledData.className}</p>
                        </div>
                        <div>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Student</p>
                            <p className="font-semibold">{prefilledData.studentName}</p>
                        </div>
                        <div>
                            <p className="mt-2 text-sm font-medium text-muted-foreground">Activity</p>
                            <p className="font-semibold">{prefilledData.activityName}</p>
                        </div>
                    </div>
                 ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                            <Label htmlFor="class-select">Class</Label>
                            <Select onValueChange={(value) => { setSelectedClass(value); setSelectedStudent(undefined); setSelectedActivity(undefined); }} value={selectedClass} disabled={areClassesLoading || formDisabled}>
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
                            <Select onValueChange={(value) => setSelectedStudent(value)} value={selectedStudent} disabled={!selectedClass || isStudentListLoading || formDisabled}>
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
                            <Select onValueChange={(value) => setSelectedActivity(value)} value={selectedActivity} disabled={!selectedClass || isActivityListLoading || formDisabled}>
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
                    </>
                 )}


                  <Textarea
                      id="essay-text"
                      placeholder="The text extracted from the essay image will appear here, or you can paste it directly."
                      rows={12}
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      className="font-code"
                      disabled={formDisabled}
                  />
                   <div className="flex justify-end gap-2">
                      <Button onClick={() => handleSaveOrGrade(false)} disabled={formDisabled || !canSave}>
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2"/>}
                        {isSaving ? 'Saving...' : 'Save to Class'}
                      </Button>
                      <Button onClick={() => handleSaveOrGrade(true)} disabled={formDisabled || !canSave}>
                        {isGrading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2"/>}
                        {isGrading ? 'Processing...' : 'Save & Grade'}
                      </Button>
                  </div>
              </>
            )}
        </CardContent>
      </Card>
      {newlyCreatedSubmission && selectedClass && (
        <GradeSubmissionDialog
            submission={newlyCreatedSubmission}
            className={classes.find(c => c.id === selectedClass)?.name ?? 'this class'}
            classId={selectedClass}
            isOpen={isGradeDialogOpen}
            setIsOpen={setIsGradeDialogOpen}
            runAiOnOpen={true}
        />
      )}
    </div>
  );
}

    
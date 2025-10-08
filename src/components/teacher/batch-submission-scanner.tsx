'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, UploadCloud, Loader2, Image as ImageIcon, CheckCircle, Sparkles, User, X, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton'; 
import { Badge } from '@/components/ui/badge'; 
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// AI Flows
import { scanEssay } from '@/ai/flows/scan-essay';
import { assistTeacherGrading } from '@/ai/flows/assist-teacher-grading';
import { identifyStudent } from '@/ai/flows/identify-student';

interface ClassOption {
  id: string;
  name: string;
}

interface ActivityOption {
  id: string;
  name: string;
  description: string;
  rubric: string;
}

interface StudentRosterEntry {
  id: string;
  name: string;
}

interface ProcessedEssay {
  tempId: string; // Unique ID for tracking in UI before Firestore ID
  file: File | null;
  imageUrl: string | null; // This will hold the object URL for display
  extractedText: string | null;
  aiScore: string | null;
  aiFeedback: string | null;
  aiIdentifiedStudentId: string | null;
  aiIdentifiedStudentName: string | null;
  aiConfidenceScore: number | null;
  aiConfidenceReason: string | null;
  // Editable fields by teacher
  finalStudentId: string | null;
  finalStudentName: string | null;
  finalScore: string | null;
  finalFeedback: string | null;
  status: 'processing' | 'review' | 'ready' | 'error';
  errorMessage: string | null;
}

export function BatchSubmissionScanner() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [availableActivities, setAvailableActivities] = useState<ActivityOption[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(undefined);
  const [studentRoster, setStudentRoster] = useState<StudentRosterEntry[]>([]);
  const [isSetupLoading, setIsSetupLoading] = useState(true);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedEssays, setProcessedEssays] = useState<ProcessedEssay[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  // Helper to determine if an essay has all necessary fields for submission
  const isEssayComplete = useCallback((essay: ProcessedEssay) => {
    return (
      essay.status !== 'processing' &&
      essay.status !== 'error' &&
      !!essay.finalStudentId &&
      !!essay.finalStudentName &&
      !!essay.finalScore &&
      !!essay.finalFeedback &&
      !!essay.file && // Ensure original file is present
      !!essay.extractedText // Ensure text was extracted successfully
    );
  }, []);

  // --- Fetch Classes and Activities on Load ---
  useEffect(() => {
    const fetchSetupData = async () => {
      if (!user) {
        setIsSetupLoading(false);
        return;
      }
      setIsSetupLoading(true);
      try {
        const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
        const classesSnapshot = await getDocs(classesQuery);
        const classesData: ClassOption[] = classesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setAvailableClasses(classesData);
      } catch (error) {
        console.error("Error fetching setup data: ", error);
        toast({ title: "Error", description: "Could not load classes and activities.", variant: "destructive" });
      } finally {
        setIsSetupLoading(false);
      }
    };
    fetchSetupData();
  }, [user, toast]);

  // --- Fetch Activities and Roster when Class Selected ---
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!selectedClassId) {
        setAvailableActivities([]);
        setStudentRoster([]);
        setSelectedActivityId(undefined);
        return;
      }

      try {
        // Fetch activities for the selected class
        const activitiesQuery = query(collection(db, 'classes', selectedClassId, 'activities'));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData: ActivityOption[] = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || '',
          rubric: doc.data().rubric || '',
        }));
        setAvailableActivities(activitiesData);

        // Fetch students for the selected class roster
        const studentsQuery = query(collection(db, 'classes', selectedClassId, 'students'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const rosterData: StudentRosterEntry[] = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setStudentRoster(rosterData);

      } catch (error) {
        console.error("Error fetching class details: ", error);
        toast({ title: "Error", description: "Could not load activities or student roster.", variant: "destructive" });
      }
    };
    fetchClassDetails();
  }, [selectedClassId, toast]);

  // --- Camera Logic ---
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!isCameraOpen) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
          if (videoRef.current) videoRef.current.srcObject = null;
        }
        setHasCameraPermission(null);
        return;
      }

      try {
        let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        mediaStreamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
        setIsCameraOpen(false);
      }
    };
    getCameraPermission();
  }, [isCameraOpen, toast]);

  // --- Image Processing & AI Calls ---
  const processAndAnalyzeEssay = useCallback(async (file: File): Promise<ProcessedEssay> => {
    const tempId = uuidv4();
    let processed: ProcessedEssay = {
      tempId,
      file,
      imageUrl: null,
      extractedText: null,
      aiScore: null,
      aiFeedback: null,
      aiIdentifiedStudentId: null,
      aiIdentifiedStudentName: null,
      aiConfidenceScore: null,
      aiConfidenceReason: null,
      finalStudentId: null,
      finalStudentName: null,
      finalScore: null,
      finalFeedback: null,
      status: 'processing',
      errorMessage: null,
    };

    // Immediately add a placeholder to processedEssays
    setProcessedEssays(prev => [...prev, processed]);

    const updateProcessedEssay = (update: Partial<ProcessedEssay>) => {
      setProcessedEssays(prev => prev.map(pe => pe.tempId === tempId ? { ...pe, ...update } : pe));
    };

    try {
      // 1. Compress Image & Generate Object URL for immediate display
      toast({ id: tempId, title: 'Compressing Image...', description: 'Preparing for OCR.', duration: 3000 });
      const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
      const objectUrl = URL.createObjectURL(compressedFile); // Generate object URL
      updateProcessedEssay({ imageUrl: objectUrl }); // Set imageUrl immediately for display

      // 2. Scan for Text (OCR)
      updateProcessedEssay({ status: 'processing', errorMessage: null });
      toast({ id: tempId, title: 'Scanning Essay...', description: 'Extracting text with AI.', duration: 3000 });
      const dataUri = await imageCompression.getDataUrlFromFile(compressedFile);
      const scanResult = await scanEssay({ imageDataUri: dataUri });
      updateProcessedEssay({ extractedText: scanResult.extractedText });

      const selectedActivity = availableActivities.find(a => a.id === selectedActivityId);
      if (!selectedActivity) {
        throw new Error("Activity not selected or not found.");
      }

      // 3. AI Grade & Feedback
      toast({ id: tempId, title: 'Grading Essay...', description: 'Generating score and feedback.', duration: 3000 });
      const gradingResult = await assistTeacherGrading({
        essayText: scanResult.extractedText,
        rubricText: selectedActivity.rubric,
        activityDescription: selectedActivity.description,
      });
      updateProcessedEssay({ aiScore: gradingResult.preliminaryScore, aiFeedback: gradingResult.feedback });

      // 4. AI Identify Student
      toast({ id: tempId, title: 'Identifying Student...', description: 'Matching essay to roster.', duration: 3000 });
      const studentIdentificationResult = await identifyStudent({
        essayText: scanResult.extractedText,
        studentRoster: studentRoster,
      });

      const identifiedStudent = studentRoster.find(s => s.id === studentIdentificationResult.identifiedStudentId);

      updateProcessedEssay({
        aiIdentifiedStudentId: studentIdentificationResult.identifiedStudentId,
        aiIdentifiedStudentName: studentIdentificationResult.identifiedStudentName,
        aiConfidenceScore: studentIdentificationResult.confidenceScore,
        aiConfidenceReason: studentIdentificationResult.confidenceReason,
        finalStudentId: studentIdentificationResult.identifiedStudentId, // Default to AI result
        finalStudentName: identifiedStudent ? identifiedStudent.name : null, // Use name from roster if found
        finalScore: gradingResult.preliminaryScore, // Default to AI result
        finalFeedback: gradingResult.feedback, // Default to AI result
        status: 'review',
      });

    } catch (error: any) {
      console.error("Error processing essay: ", error);
      updateProcessedEssay({
        status: 'error',
        errorMessage: error.message || 'An unknown error occurred during processing.',
      });
      toast({ id: tempId, title: 'Processing Failed', description: error.message || 'Check console for details.', variant: 'destructive' });
    } finally {
      toast({ id: tempId, title: 'Processing Complete', description: 'Ready for review.', variant: 'success', duration: 1500 });
    }
    return processed; // Note: this returned object might not reflect final state due to async updates
  }, [availableActivities, selectedActivityId, studentRoster, toast]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
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
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setUploadedFiles(prev => [...prev, file]);
        }
      }
    }
    setIsCameraOpen(false);
  };

  // --- Trigger processing when files are uploaded ---
  useEffect(() => {
    if (uploadedFiles.length > 0 && selectedActivityId && !isProcessingAll) {
      setIsProcessingAll(true);
      const processNextFile = async () => {
        const fileToProcess = uploadedFiles[0];
        await processAndAnalyzeEssay(fileToProcess);
        setUploadedFiles(prev => prev.slice(1)); // Remove processed file
        if (uploadedFiles.length > 1) {
          setTimeout(processNextFile, 500); // Process next after a short delay
        } else {
          setIsProcessingAll(false);
        }
      };
      processNextFile();
    }
  }, [uploadedFiles, selectedActivityId, isProcessingAll, processAndAnalyzeEssay]);

  const handleRemoveProcessedEssay = (tempId: string) => {
    setProcessedEssays(prev => {
      const essayToRemove = prev.find(essay => essay.tempId === tempId);
      if (essayToRemove && essayToRemove.imageUrl) {
        URL.revokeObjectURL(essayToRemove.imageUrl); // Revoke object URL
      }
      return prev.filter(essay => essay.tempId !== tempId);
    });
  };

  const handleUpdateProcessedEssay = useCallback((tempId: string, field: keyof ProcessedEssay, value: any) => {
    setProcessedEssays(prev => prev.map(essay => {
        if (essay.tempId === tempId) {
            const updatedEssay = { ...essay, [field]: value };

            // If student ID is updated, also update student name from roster
            if (field === 'finalStudentId' && value) {
                const student = studentRoster.find(s => s.id === value);
                updatedEssay.finalStudentName = student ? student.name : null;
            }
            return updatedEssay;
        }
        return essay;
    }));
  }, [studentRoster]);

  const handleSaveAllSubmissions = async () => {
    if (!selectedClassId || !selectedActivityId) {
      toast({ title: "Error", description: "Please select a class and activity.", variant: "destructive" });
      return;
    }

    const incompleteEssays = processedEssays.filter(essay => !isEssayComplete(essay));
    if (incompleteEssays.length > 0) {
        toast({
            title: "Incomplete Submissions",
            description: `Please complete all required fields for the ${incompleteEssays.length} essays marked for review.`,
            variant: "destructive",
        });
        return;
    }

    const readyToSubmit = processedEssays.filter(isEssayComplete);

    if (readyToSubmit.length === 0) {
      toast({ title: "No Submissions to Save", description: "There are no essays ready for submission.", variant: "destructive" });
      return;
    }

    setIsSubmittingAll(true);
    const batch = writeBatch(db);
    const submissionsCollection = collection(db, 'classes', selectedClassId, 'submissions');

    for (const essay of readyToSubmit) {
      // No need for redundant check here, as isEssayComplete already filters this
      // if (!essay.finalStudentId || !essay.finalStudentName || !essay.finalScore || !essay.finalFeedback || !essay.file) {
      //   ...
      // }

      let imageUrlToSave = ''; // Initialize to empty string

      // Always upload image to Firebase Storage if a file exists
      if (essay.file) {
        try {
          const uploadId = uuidv4();
          const uploadPath = `submissions/${selectedClassId}/${selectedActivityId}/${essay.finalStudentId}/${uploadId}_${essay.file.name}`;
          const imageRef = ref(storage, uploadPath);
          await uploadBytes(imageRef, essay.file);
          imageUrlToSave = await getDownloadURL(imageRef);
        } catch (uploadError: any) {
          console.error("Error uploading image for submission: ", uploadError);
          toast({ title: "Image Upload Failed", description: `Could not upload image for ${essay.finalStudentName}.`, variant: "destructive" });
          setIsSubmittingAll(false);
          return;
        }
      } else if (essay.imageUrl && !essay.imageUrl.startsWith('blob:')) {
        // If no new file, but there's an imageUrl that's not a temporary blob URL,
        // assume it's an existing Firebase Storage URL and reuse it.
        imageUrlToSave = essay.imageUrl;
      }

      const newSubmissionRef = doc(submissionsCollection);
      batch.set(newSubmissionRef, {
        studentId: essay.finalStudentId,
        studentName: essay.finalStudentName,
        assignmentName: availableActivities.find(a => a.id === selectedActivityId)?.name || 'Batch Submission',
        activityId: selectedActivityId,
        essayText: essay.extractedText || '',
        essayImageUrl: imageUrlToSave, // Use the permanently stored URL
        submittedAt: Timestamp.now(),
        status: 'Graded', // Submitting as graded since teacher reviewed
        grade: essay.finalScore,
        feedback: essay.finalFeedback,
        classId: selectedClassId, // Store classId directly
      });
    }

    try {
      await batch.commit();
      toast({ title: "Submissions Saved!", description: `Successfully saved ${readyToSubmit.length} essays.`, variant: "success" });
      // Revoke all object URLs after saving and clearing processed essays
      processedEssays.forEach(essay => {
        if (essay.imageUrl) URL.revokeObjectURL(essay.imageUrl);
      });
      setProcessedEssays([]); // Clear processed essays after saving
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error saving batch submissions: ", error);
      toast({ title: "Save Failed", description: "Could not save submissions. Check console.", variant: "destructive" });
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const selectedActivity = availableActivities.find(a => a.id === selectedActivityId);
  const numberOfCompleteEssays = processedEssays.filter(isEssayComplete).length;
  const isSaveButtonDisabled = isSubmittingAll || isProcessingAll || numberOfCompleteEssays === 0;

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">Batch Scan & AI Grade</h1>
          <CardDescription>Streamline grading of multiple handwritten essays using AI.</CardDescription>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">1. Select Class & Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSetupLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : availableClasses.length === 0 ? (
            <p className="text-muted-foreground">No classes found. Please create a class first.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-select">Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isProcessingAll || isSubmittingAll}>
                  <SelectTrigger id="class-select"><SelectValue placeholder="Select a class..." /></SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-select">Activity</Label>
                <Select value={selectedActivityId} onValueChange={setSelectedActivityId} disabled={!selectedClassId || availableActivities.length === 0 || isProcessingAll || isSubmittingAll}>
                  <SelectTrigger id="activity-select"><SelectValue placeholder="Select an activity..." /></SelectTrigger>
                  <SelectContent>
                    {availableActivities.length === 0 ? (
                        <SelectItem value="no-activity" disabled>No activities available</SelectItem>
                    ) : (
                        availableActivities.map(activity => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {selectedActivity && (
            <div className="rounded-md border bg-muted p-4 text-sm">
              <h3 className="font-semibold mb-1">Activity Description:</h3>
              <p className="whitespace-pre-wrap text-muted-foreground mb-2">{selectedActivity.description || 'No description provided.'}</p>
              <h3 className="font-semibold mb-1">Rubric Preview:</h3>
              <p className="whitespace-pre-wrap font-code text-muted-foreground">{selectedActivity.rubric || 'No rubric provided.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">2. Upload or Scan Essays</CardTitle>
          <CardDescription>Add essay images for processing. Make sure text is clear.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="essay-photos">Upload Photos</Label>
              <div className="relative">
                <UploadCloud className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="essay-photos"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  multiple
                  className="pl-10"
                  disabled={!selectedActivityId || isProcessingAll || isSubmittingAll}
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
                disabled={!selectedActivityId || isProcessingAll || isSubmittingAll}
              >
                <Camera className="mr-2 size-4" /> Open Camera
              </Button>
            </div>
          </div>
          {isCameraOpen && (
            <div className="space-y-4 rounded-lg border bg-background/50 p-4">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                 <Alert variant="destructive">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access to use this feature.
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
        </CardContent>
      </Card>
      
      {processedEssays.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">3. Review & Edit Submissions</CardTitle>
              <CardDescription>Confirm student identification, score, and feedback.</CardDescription>
            </div>
            <Button onClick={handleSaveAllSubmissions} disabled={isSaveButtonDisabled}>
              {isSubmittingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save {numberOfCompleteEssays > 0 ? numberOfCompleteEssays : ''} Submission{numberOfCompleteEssays !== 1 ? 's' : ''}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {processedEssays.map((essay) => (
              <Card key={essay.tempId} className="relative">
                {essay.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex items-center justify-center z-10 p-4 rounded-lg">
                    <div className="text-center text-destructive-foreground">
                      <X className="size-8 mx-auto mb-2" />
                      <h3 className="font-bold text-lg">Processing Error</h3>
                      <p className="text-sm">{essay.errorMessage || 'Unknown error.'}</p>
                      <Button variant="destructive" className="mt-4" onClick={() => handleRemoveProcessedEssay(essay.tempId)}>Remove</Button>
                    </div>
                  </div>
                )}
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-md">
                    Essay {processedEssays.findIndex(e => e.tempId === essay.tempId) + 1}
                    {essay.status === 'processing' && <Loader2 className="ml-2 h-4 w-4 animate-spin inline-block text-primary" />}
                    {essay.aiConfidenceScore !== null && essay.aiConfidenceScore < 70 && essay.status !== 'error' && ( // Low confidence badge
                        <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-400">Needs Review</Badge>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveProcessedEssay(essay.tempId)} disabled={isProcessingAll}>
                    <X className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <h3 className="font-semibold mb-2">Original Image</h3>
                    <div className="relative aspect-[8.5/11] w-full rounded-md border overflow-hidden bg-muted">
                      {essay.imageUrl ? (
                        <Image src={essay.imageUrl} alt="Essay" fill className="object-contain" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No image preview</div>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    {!isEssayComplete(essay) && essay.status !== 'processing' && essay.status !== 'error' && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Incomplete Submission</AlertTitle>
                        <AlertDescription>
                          This essay is missing required information (student, score, or feedback). Please complete all fields before saving.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div>
                      <h3 className="font-semibold mb-2">Extracted Text (OCR)</h3>
                      <Textarea readOnly value={essay.extractedText || 'Scanning...'} rows={8} className="font-code text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor={`student-${essay.tempId}`}>Student</Label>
                            <Select
                                value={essay.finalStudentId || ''}
                                onValueChange={(value) => handleUpdateProcessedEssay(essay.tempId, 'finalStudentId', value)}
                                disabled={essay.status === 'processing'}
                            >
                                <SelectTrigger id={`student-${essay.tempId}`}><SelectValue placeholder={essay.aiIdentifiedStudentName || "Select student..."} /></SelectTrigger>
                                <SelectContent>
                                    {studentRoster.length === 0 ? (
                                        <SelectItem value="no-students" disabled>No students in this class</SelectItem>
                                    ) : (
                                        studentRoster.map(student => (
                                            <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {essay.aiIdentifiedStudentId && essay.finalStudentId === essay.aiIdentifiedStudentId && essay.aiConfidenceScore !== null && ( // Show AI confidence only if AI identified and teacher hasn't overridden
                                <p className="text-xs text-muted-foreground">AI Confidence: {essay.aiConfidenceScore}% - {essay.aiConfidenceReason}</p>
                            )}
                             {!essay.finalStudentId && essay.status !== 'processing' && (
                                <p className="text-xs text-destructive">A student must be selected.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`score-${essay.tempId}`}>Score (/100)</Label>
                            <Input
                                id={`score-${essay.tempId}`}
                                type="number"
                                value={essay.finalScore || ''}
                                onChange={(e) => handleUpdateProcessedEssay(essay.tempId, 'finalScore', e.target.value)}
                                disabled={essay.status === 'processing'}
                            />
                        </div>
                    </div>
                    <div>
                      <Label htmlFor={`feedback-${essay.tempId}`}>Feedback</Label>
                      <Textarea
                        id={`feedback-${essay.tempId}`}
                        value={essay.finalFeedback || ''}
                        onChange={(e) => handleUpdateProcessedEssay(essay.tempId, 'finalFeedback', e.target.value)}
                        rows={6}
                        disabled={essay.status === 'processing'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

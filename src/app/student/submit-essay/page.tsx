'use client';

import { Suspense, useEffect, useState } from 'react';
import { EssaySubmissionForm } from '@/components/student/essay-submission-form';
import { FileQuestion, Lightbulb } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityDetails {
  name: string;
  description: string;
  rubric: string;
  className: string;
}

function SubmitEssayContent() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');
  const classId = searchParams.get('classId'); // Assuming classId is also passed if activityId is

  const [activityDetails, setActivityDetails] = useState<ActivityDetails | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [errorActivity, setErrorActivity] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!activityId || !classId) {
        setIsLoadingActivity(false);
        return;
      }

      setIsLoadingActivity(true);
      setErrorActivity(null);
      try {
        const activityDocRef = doc(db, 'classes', classId, 'activities', activityId);
        const activityDoc = await getDoc(activityDocRef);

        if (activityDoc.exists()) {
          const data = activityDoc.data();
          const classDoc = await getDoc(doc(db, 'classes', classId));
          const className = classDoc.exists() ? classDoc.data().name : 'Unknown Class';

          setActivityDetails({
            name: data.name,
            description: data.description || 'No description provided.',
            rubric: data.rubric || 'No rubric provided.',
            className: className,
          });
        } else {
          setErrorActivity('Activity not found.');
        }
      } catch (err) {
        console.error("Error fetching activity details: ", err);
        setErrorActivity('Failed to load activity details.');
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchActivityData();
  }, [activityId, classId]);

  return (
    <div className="mb-6">
      <h1 className="font-headline text-3xl font-bold">Submit an Essay</h1>
      <p className="text-muted-foreground">
        Upload or type your essay for submission.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2">
          {isLoadingActivity ? (
            <Card className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : errorActivity ? (
            <Card className="mb-6 border-destructive text-destructive">
              <CardHeader>
                <CardTitle>Error Loading Activity</CardTitle>
                <CardDescription>{errorActivity}</CardDescription>
              </CardHeader>
            </Card>
          ) : activityDetails && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-headline text-lg">Assignment: {activityDetails.name}</CardTitle>
                <CardDescription>Class: {activityDetails.className}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Description / Prompt:</h3>
                  <p className="text-sm whitespace-pre-wrap">{activityDetails.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Rubric:</h3>
                  <p className="text-sm whitespace-pre-wrap font-code">{activityDetails.rubric}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <EssaySubmissionForm preselectedActivityId={activityId} />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-lg">
                <Lightbulb className="size-5 text-primary" /> Quick Tips
              </CardTitle>
              <CardDescription>
                Get the best results for your essay submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <FileQuestion className="size-5 mt-1 text-muted-foreground" />
                <div>
                  <h4 className="font-semibold">Understand the Assignment</h4>
                  <p className="text-sm text-muted-foreground">Review the prompt and rubric carefully before writing and submitting.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="size-5 mt-1 text-muted-foreground">📸</span> {/* Camera emoji as icon */}
                <div>
                  <h4 className="font-semibold">High-Quality Photos for Scanning</h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Use bright, even lighting.</li>
                    <li>Place your essay on a flat, contrasting surface.</li>
                    <li>Ensure the entire document is in the frame and not blurry.</li>
                    <li>Rotate images to the correct orientation if necessary.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="size-5 mt-1 text-muted-foreground">✍️</span> {/* Writing hand emoji as icon */}
                <div>
                  <h4 className="font-semibold">Proofread Carefully</h4>
                  <p className="text-sm text-muted-foreground">Before submitting, carefully proofread your essay for any errors.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="size-5 mt-1 text-muted-foreground">✅</span> {/* Checkmark emoji as icon */}
                <div>
                  <h4 className="font-semibold">Final Review</h4>
                  <p className="text-sm text-muted-foreground">Double-check your essay text and ensure all parts of the assignment have been addressed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SubmitEssayPage() {
  return (
    <Suspense fallback={<div>Loading submission page...</div>}>
      <SubmitEssayContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { Textarea as CustomTextarea } from '@/components/ui/textarea'; // Import CustomTextarea

interface Submission {
    id: string;
    studentId: string;
    assignmentName?: string;
    essayText: string;
    essayImageUrl?: string;
    submittedAt: {
        seconds: number;
        nanoseconds: number;
    };
    status: 'Pending Review' | 'Graded';
    grade?: string;
    feedback?: string;
}

export function StudentSubmissionsOverview({ classId }: { classId: string }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !classId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const submissionsCollection = collection(db, 'classes', classId, 'submissions');
    const q = query(
      submissionsCollection,
      where('studentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentSubmissions: Submission[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
      setSubmissions(studentSubmissions);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching student submissions: ", err);
      setError("Failed to load your submissions.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, classId]);

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-destructive mt-8">{error}</p>;
  }

  if (submissions.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You haven't submitted any work for this class yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center justify-between">
              {submission.assignmentName || 'Essay Submission'}
              <Badge variant={submission.status === 'Graded' ? 'default' : 'secondary'}>
                {submission.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Submitted: {new Date(submission.submittedAt.seconds * 1000).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.essayImageUrl && (
              <div>
                <h3 className="font-semibold text-md mb-2">Original Image</h3>
                <div className="relative aspect-[8.5/11] w-full max-w-md rounded-md border overflow-hidden">
                  <Image
                    src={submission.essayImageUrl}
                    alt={`Submitted essay image for ${submission.assignmentName}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-md mb-2">Your Essay Text</h3>
              <CustomTextarea readOnly value={submission.essayText} rows={10} className="font-code text-sm text-foreground" />
            </div>
            {submission.status === 'Graded' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-md mb-2">Score</h3>
                  <p className="text-xl font-bold text-primary">{submission.grade || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-md mb-2">Teacher Feedback</h3>
                  <CustomTextarea readOnly value={submission.feedback || 'No feedback provided.'} rows={6} className="text-sm text-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface Submission {
  id: string;
  assignment: string;
  class: string;
  grade: string;
  status: 'Graded' | 'Pending Review';
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  }
}


export default function StudentHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      setIsDataLoading(true);
      try {
        const studentId = user.uid;
        const submissionsData: Submission[] = [];

        // This is inefficient. A better approach would be to have a 'submissions' collection per user
        // but for this project structure, we query through classes.
        const classesSnapshot = await getDocs(collection(db, 'classes'));

        for (const classDoc of classesSnapshot.docs) {
          const studentSubcollectionDoc = await getDoc(doc(db, `classes/${classDoc.id}/students`, studentId));

          if(studentSubcollectionDoc.exists()){
             const submissionsQuery = query(
              collection(db, 'classes', classDoc.id, 'submissions'),
              where('studentId', '==', studentId)
            );

            const submissionsSnapshot = await getDocs(submissionsQuery);
            submissionsSnapshot.forEach(submissionDoc => {
                const data = submissionDoc.data();
                submissionsData.push({
                    id: submissionDoc.id,
                    assignment: data.assignmentName || 'Essay Submission',
                    class: classDoc.data().name,
                    grade: data.grade || '-',
                    status: data.status,
                    submittedAt: data.submittedAt,
                });
            });
          }
        }
        
        // Sort manually since we can't use orderBy without an index
        submissionsData.sort((a, b) => {
            if (a.submittedAt && b.submittedAt) {
                return b.submittedAt.seconds - a.submittedAt.seconds;
            }
            return 0;
        });

        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Error fetching submissions: ", error);
        toast({
          title: 'Error',
          description: 'Could not fetch your submission history. You may need to create a Firestore index.',
          variant: 'destructive'
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    if (user) {
        fetchSubmissions();
    }
  }, [user, toast]);

  const isLoading = isAuthLoading || isDataLoading;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Graded':
            return 'default';
        case 'Pending Review':
            return 'secondary';
        default:
            return 'secondary';
    }
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Submission History</h1>
        <p className="text-muted-foreground">
          An overview of all your submitted and graded assignments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">All Submissions</CardTitle>
          <CardDescription>
            A detailed history of your submissions across all classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.assignment}
                    </TableCell>
                    <TableCell>{submission.class}</TableCell>
                     <TableCell>
                      {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(submission.status)}
                        className={
                          getStatusVariant(submission.status) === 'default' ? 'bg-primary/80' : ''
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{submission.grade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>You have not submitted any assignments yet.</p>
              <p className="text-sm">
                Use the "Submit Essay" page to make your first submission.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

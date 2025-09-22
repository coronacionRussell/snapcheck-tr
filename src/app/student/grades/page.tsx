
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';

interface Submission {
  id: string;
  assignment: string;
  class: string;
  grade: string;
  status: 'Graded' | 'Pending Review';
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  };
  feedback?: string;
}


export default function StudentHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
      if (!user) {
          setIsDataLoading(false);
          return;
      };
      setIsDataLoading(true);
      try {
        const studentId = user.uid;
        
        let allSubmissions: Submission[] = [];

        if (user.enrolledClassIds && user.enrolledClassIds.length > 0) {
            // Fetch all classes first to get their names
            const classesQuery = query(collection(db, 'classes'), where('__name__', 'in', user.enrolledClassIds));
            const classesSnapshot = await getDocs(classesQuery);
            const classNames = new Map(classesSnapshot.docs.map(doc => [doc.id, doc.data().name]));

            // Fetch submissions for each class
            for (const classId of user.enrolledClassIds) {
                const submissionsQuery = query(
                    collection(db, 'classes', classId, 'submissions'),
                    where('studentId', '==', studentId)
                );
                const submissionsSnapshot = await getDocs(submissionsQuery);
                const classSubmissions = submissionsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        assignment: data.assignmentName || 'Essay Submission',
                        class: classNames.get(classId) || 'Unknown Class',
                        grade: data.grade || '-',
                        status: data.status,
                        submittedAt: data.submittedAt,
                        feedback: data.feedback,
                    } as Submission;
                });
                allSubmissions = allSubmissions.concat(classSubmissions);
            }
        }
        
        // Sort all submissions by date client-side
        allSubmissions.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
        
        setSubmissions(allSubmissions);

      } catch (error) {
        console.error("Error fetching submissions: ", error);
        toast({
          title: 'Error Fetching History',
          description: 'Could not fetch submission history. Please try again later.',
          variant: 'destructive',
          duration: 9000,
        });
      } finally {
        setIsDataLoading(false);
      }
    }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchSubmissions();
    }
  }, [isAuthLoading, fetchSubmissions]);

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
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
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
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="font-semibold">{submission.grade}</TableCell>
                    <TableCell className="text-right">
                         {submission.feedback && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <MessageSquareText className="mr-2" />
                                        View Feedback
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Feedback for {submission.assignment}</DialogTitle>
                                        <DialogDescription>
                                            Class: {submission.class} | Grade: {submission.grade}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="prose prose-sm mt-4 max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground whitespace-pre-wrap">
                                        {submission.feedback}
                                    </div>
                                </DialogContent>
                            </Dialog>
                         )}
                      </TableCell>
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

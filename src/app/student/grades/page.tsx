
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
import { collectionGroup, getDocs, query, where, orderBy } from 'firebase/firestore';
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
  className?: string; // Add className property
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
    }
    setIsDataLoading(true);
    try {
      const submissionsQuery = query(
        collectionGroup(db, 'submissions'),
        where('studentId', '==', user.uid),
        orderBy('submittedAt', 'desc')
      );

      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissionsData = submissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Assuming parent collection (class) name can be inferred or is stored.
        // For simplicity, let's assume it might not be directly available here
        // without extra queries. We will adjust if needed.
        return {
          id: doc.id,
          assignment: data.assignmentName || 'Essay Submission',
          grade: data.grade || '-',
          status: data.status,
          submittedAt: data.submittedAt,
          feedback: data.feedback,
          // The class name isn't directly available in a collectionGroup query
          // without more complex logic, so we will display 'N/A' or enhance later.
          class: 'N/A', // Placeholder
        } as Submission;
      });

      // To get class names, we can do a secondary lookup, but it adds complexity.
      // For now, we will proceed without it for optimization.

      setSubmissions(submissionsData);
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
  };

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
                                            Class: {submission.className || 'N/A'} | Grade: {submission.grade}
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

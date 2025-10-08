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
import { collectionGroup, getDocs, query, where, orderBy, doc, getDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Submission {
  id: string;
  assignment: string;
  grade: string;
  status: 'Graded' | 'Pending Review';
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  };
  feedback?: string;
  className?: string; 
  classId?: string; // Add classId to submission interface
}

interface EnrolledClass {
  id: string;
  name: string;
}

export default function StudentHistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    if (!user) {
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);
    try {
      let submissionsQueryRef: any = query(
        collectionGroup(db, 'submissions'),
        where('studentId', '==', user.uid),
        orderBy('submittedAt', 'desc')
      );

      if (selectedStatusFilter !== 'all') {
        submissionsQueryRef = query(submissionsQueryRef, where('status', '==', selectedStatusFilter));
      }

      const submissionsSnapshot = await getDocs(submissionsQueryRef);
      
      const submissionsDataPromises = submissionsSnapshot.docs.map(async (submissionDoc) => {
        const data = submissionDoc.data();
        const classId = data.classId; // Get classId directly from the submission data
        let className = 'N/A';

        if (classId) {
            const classDocRef = doc(db, 'classes', classId);
            const classDoc = await getDoc(classDocRef);
            if (classDoc.exists()) {
                className = classDoc.data()?.name || 'Unknown Class';
            }
        }
        
        return {
          id: submissionDoc.id,
          assignment: data.assignmentName || 'Essay Submission',
          grade: data.grade || '-',
          status: data.status,
          submittedAt: data.submittedAt,
          feedback: data.feedback,
          className: className,
          classId: classId, // Include classId
        } as Submission;
      });

      let fetchedSubmissions = await Promise.all(submissionsDataPromises);

      if (selectedClassFilter !== 'all') {
        fetchedSubmissions = fetchedSubmissions.filter(sub => sub.classId === selectedClassFilter);
      }

      setSubmissions(fetchedSubmissions);

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
  }, [user, toast, selectedStatusFilter, selectedClassFilter]);

  const fetchEnrolledClasses = useCallback(async () => {
    if (!user?.enrolledClassIds || user.enrolledClassIds.length === 0) {
      setEnrolledClasses([]);
      return;
    }

    try {
      const classesPromises = user.enrolledClassIds.map(async (classId) => {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (classDoc.exists()) {
          return { id: classDoc.id, name: classDoc.data().name } as EnrolledClass;
        }
        return null;
      });
      const fetchedClasses = (await Promise.all(classesPromises)).filter(Boolean) as EnrolledClass[];
      setEnrolledClasses(fetchedClasses);
    } catch (error) {
      console.error("Error fetching enrolled classes: ", error);
      toast({
        title: 'Error',
        description: 'Could not fetch your enrolled classes.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchEnrolledClasses();
      fetchSubmissions();
    }
  }, [isAuthLoading, fetchEnrolledClasses, fetchSubmissions]);


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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {enrolledClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <TableCell>
                      {submission.className}
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
              <p>You have not submitted any assignments yet or no matching submissions found.</p>
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

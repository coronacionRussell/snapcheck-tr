
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { GradeSubmissionDialog } from './grade-submission-dialog';

export interface Submission {
    id: string;
    studentName: string;
    studentId: string;
    assignmentName?: string;
    essayText: string;
    submittedAt: {
        seconds: number;
        nanoseconds: number;
    };
    status: 'Pending Review' | 'Graded';
    grade?: string;
}

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

export function ClassSubmissions({ classId, className, rubric }: { classId: string, className: string, rubric: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    setIsLoading(true);
    const submissionsCollection = collection(db, 'classes', classId, 'submissions');
    const q = query(submissionsCollection, orderBy('submittedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const submissionData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
        setSubmissions(submissionData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching submissions: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Student Submissions</CardTitle>
        <CardDescription>
          An overview of student submissions for this class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6}>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.studentName}</TableCell>
                   <TableCell>{submission.assignmentName || 'Essay Submission'}</TableCell>
                  <TableCell>
                    {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(submission.status)}
                     className={getStatusVariant(submission.status) === 'default' ? 'bg-primary/80' : ''}>
                        {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {submission.grade || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <GradeSubmissionDialog submission={submission} className={className} rubric={rubric} classId={classId} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No students have submitted essays for this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

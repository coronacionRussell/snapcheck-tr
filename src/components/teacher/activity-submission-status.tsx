
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

interface Student {
    id: string;
    name: string;
}

interface Submission {
    studentId: string;
}

interface StudentStatus {
    id: string;
    name: string;
    status: 'Submitted' | 'Pending Submission';
}

export function ActivitySubmissionStatus({ classId, activityId }: { classId: string, activityId: string }) {
  const [studentStatuses, setStudentStatuses] = useState<StudentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId || !activityId) return;

    const fetchStatuses = async () => {
        setIsLoading(true);
        try {
            // Fetch all students in the class
            const studentsQuery = query(collection(db, 'classes', classId, 'students'));
            const studentsSnapshot = await getDocs(studentsQuery);
            const roster = studentsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as Student));

            // Fetch all submissions for the specific activity
            const submissionsQuery = query(
              collection(db, 'classes', classId, 'submissions'),
              where('activityId', '==', activityId)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissions = submissionsSnapshot.docs.map(doc => doc.data() as Submission);
            const submittedStudentIds = new Set(submissions.map(s => s.studentId));

            // Determine status for each student
            const statuses = roster.map(student => ({
                id: student.id,
                name: student.name,
                status: submittedStudentIds.has(student.id) ? 'Submitted' : 'Pending Submission',
            })).sort((a, b) => a.name.localeCompare(b.name));

            setStudentStatuses(statuses);
        } catch (error) {
            console.error("Error fetching submission statuses: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchStatuses();

    // We can also set up a listener for real-time updates if needed
    const submissionsCollection = collection(db, 'classes', classId, 'submissions');
    const unsubscribe = onSnapshot(submissionsCollection, () => {
        fetchStatuses(); // Refetch when submissions change
    });
    
    return () => unsubscribe();

  }, [classId, activityId]);

  return (
    <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={2}>
                        <div className="space-y-2 py-2">
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : studentStatuses.length > 0 ? (
                studentStatuses.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={s.status === 'Submitted' ? 'default' : 'secondary'} className={s.status === 'Submitted' ? 'bg-primary/80' : ''}>
                        {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center h-24">
                  No students are enrolled in this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  );
}

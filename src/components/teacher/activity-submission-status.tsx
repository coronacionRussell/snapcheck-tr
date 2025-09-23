
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
import { collection, onSnapshot, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScanLine } from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    name: string;
}

interface Submission {
    studentId: string;
    grade?: string;
}

interface StudentStatus {
    id: string;
    name: string;
    status: 'Submitted' | 'Pending Submission';
    grade: string;
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
            
            // Create a map of studentId to their submission
            const submissionsMap = new Map<string, Submission>();
            submissionsSnapshot.docs.forEach(doc => {
                const data = doc.data() as Submission;
                submissionsMap.set(data.studentId, data);
            });

            // Determine status and grade for each student
            const statuses = roster.map(student => {
                const submission = submissionsMap.get(student.id);
                return {
                    id: student.id,
                    name: student.name,
                    status: submission ? 'Submitted' : 'Pending Submission',
                    grade: submission?.grade || '-',
                };
            }).sort((a, b) => a.name.localeCompare(b.name));

            setStudentStatuses(statuses);
        } catch (error) {
            console.error("Error fetching submission statuses: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Set up a listener for real-time updates
    const submissionsCollection = collection(db, 'classes', classId, 'submissions');
    const q = query(submissionsCollection, where('activityId', '==', activityId));
    const unsubscribe = onSnapshot(q, () => {
        fetchStatuses(); // Refetch when submissions for this activity change
    });
    
    return () => unsubscribe();

  }, [classId, activityId]);

  return (
    <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={3}>
                        <div className="space-y-2 py-2">
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : studentStatuses.length > 0 ? (
                studentStatuses.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                   <TableCell>
                    <Badge variant={s.status === 'Submitted' ? 'default' : 'secondary'} className={s.status === 'Submitted' ? 'bg-primary/80' : ''}>
                        {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {s.status === 'Pending Submission' && (
                       <Button asChild variant="outline" size="sm">
                            <Link href={`/teacher/scan-essay?classId=${classId}&activityId=${activityId}&studentId=${s.id}`}>
                                <ScanLine className="mr-2" />
                                Scan Submission
                            </Link>
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No students are enrolled in this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
    </div>
  );
}

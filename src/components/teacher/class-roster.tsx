
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
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

interface Student {
    id: string;
    name: string;
    joinedAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export function ClassRoster({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    setIsLoading(true);
    const studentsCollection = collection(db, 'classes', classId, 'students');
    const q = query(studentsCollection, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const studentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        setStudents(studentData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching students: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Student Roster</CardTitle>
        <CardDescription>
          A list of all students enrolled in this class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Date Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={2}>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    {student.joinedAt ? new Date(student.joinedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No students have enrolled in this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

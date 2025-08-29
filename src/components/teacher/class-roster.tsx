
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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

// This will be expanded later
interface Student {
    id: string;
    name: string;
    // For now, we'll keep these statuses hardcoded
    status: 'Not Submitted' | 'Pending Review' | 'Graded';
    grade?: string;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Graded':
            return 'default';
        case 'Pending Review':
            return 'secondary';
        case 'Not Submitted':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function ClassRoster({ classId }: { classId: string }) {
  const [roster, setRoster] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
        setIsLoading(true);
        // In a real app, you would have a 'students' collection
        // and query for students where `classId` matches.
        // For now, we will simulate this by keeping an empty roster.
        // const studentsCollection = collection(db, 'students');
        // const q = query(studentsCollection, where("classId", "==", classId));
        // const querySnapshot = await getDocs(q);
        // const studentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        // setRoster(studentData);
        setRoster([]); // Keeping this empty until student enrollment is implemented
        setIsLoading(false);
    }

    fetchRoster();
  }, [classId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Student Roster</CardTitle>
        <CardDescription>
          An overview of student submissions and grades for this class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Submission Status</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={3}>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : roster.length > 0 ? (
              roster.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(student.status)}
                     className={getStatusVariant(student.status) === 'default' ? 'bg-primary/80' : ''}>
                        {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {student.grade || '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
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

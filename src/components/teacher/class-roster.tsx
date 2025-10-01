
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
import { collection, onSnapshot, query, orderBy, doc, writeBatch, increment, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Student {
    id: string;
    name: string;
    joinedAt: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

export function ClassRoster({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleRemoveStudent = async (student: Student) => {
    if (!student || !student.id || !student.name) {
      toast({ title: 'Error', description: 'Cannot remove student, data is missing.', variant: 'destructive'});
      return;
    }
    setIsDeleting(student.id);
    try {
        const batch = writeBatch(db);

        // Reference to the student document in the subcollection
        const studentRef = doc(db, 'classes', classId, 'students', student.id);
        batch.delete(studentRef);

        // Reference to the parent class document to decrement student count
        const classRef = doc(db, 'classes', classId);
        batch.update(classRef, { studentCount: increment(-1) });

        // Reference to the user document to remove the class from their enrolled list
        const userRef = doc(db, 'users', student.id);
        batch.update(userRef, { enrolledClassIds: arrayRemove(classId) });

        await batch.commit();

        toast({
            title: 'Student Removed',
            description: `${student.name} has been removed from the class.`
        });

    } catch (error) {
        console.error("Error removing student: ", error);
        toast({
            title: 'Error',
            description: 'Could not remove the student. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsDeleting(null);
    }
  }

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
              <TableHead className="text-right">Actions</TableHead>
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
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    {student.joinedAt ? new Date(student.joinedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" disabled={isDeleting === student.id}>
                           {isDeleting === student.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                            <span className="sr-only">Remove student</span>
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <strong>{student.name || 'this student'}</strong> from your class. They will lose access and this action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveStudent(student)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { PlusCircle, Loader2, MoreHorizontal, Pen, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EnrollStudentDialog } from './enroll-student-dialog'; // Import the new dialog

// Student interface (should match Firestore data)
export interface Student {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  enrolledClassIds: string[];
}

export function ClassRoster() {
  const params = useParams();
  const classId = params.classId as string;
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [className, setClassName] = useState('Loading class...');

  const fetchClassAndStudents = useCallback(() => { // Removed async keyword
    if (!classId) {
      console.log("ClassRoster: classId is not available.");
      setIsLoading(false);
      return () => {}; // Return a no-op cleanup function if classId is not available
    }

    // Ensure db is initialized before proceeding
    if (!db) {
      console.error("ClassRoster: Firebase DB is not initialized. Check .env and firebase.ts.");
      toast({
        title: 'Error',
        description: 'Firebase not initialized. Cannot load class roster.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return () => {}; // Return a no-op cleanup
    }

    console.log("ClassRoster: Fetching students for classId:", classId);
    setIsLoading(true);
    let classUnsubscribe = () => {};
    let studentsUnsubscribe = () => {};

    try {
      // Fetch class name
      const classDocRef = doc(db, 'classes', classId);
      classUnsubscribe = onSnapshot(classDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          setClassName(docSnapshot.data().name);
        } else {
          console.log("ClassRoster: Class document does not exist for classId:", classId);
        }
      });

      // Fetch students using real-time listener
      const studentsCollectionRef = collection(db, 'users');
      const studentsQuery = query(
        studentsCollectionRef,
        where('role', '==', 'student'),
        where('enrolledClassIds', 'array-contains', classId),
        orderBy('fullName')
      );

      studentsUnsubscribe = onSnapshot(studentsQuery, (querySnapshot) => {
        console.log("ClassRoster: Student query snapshot received.");
        if (querySnapshot.empty) {
          console.log("ClassRoster: Student query snapshot is empty. No students found.");
        } else {
          console.log(`ClassRoster: Found ${querySnapshot.size} student(s).`);
        }
        const fetchedStudents: Student[] = [];
        querySnapshot.forEach((doc) => {
          fetchedStudents.push({
            id: doc.id,
            uid: doc.id, // Assuming uid is same as doc.id for users
            fullName: doc.data().fullName,
            email: doc.data().email,
            enrolledClassIds: doc.data().enrolledClassIds || [],
          });
        });
        setStudents(fetchedStudents);
        setIsLoading(false);
        console.log("ClassRoster: Fetched students data:", fetchedStudents);
      }, (error) => {
        console.error("ClassRoster: Error fetching real-time student data: ", error);
        toast({
            title: "Error",
            description: "Failed to load class roster in real-time.",
            variant: "destructive",
        });
        setIsLoading(false);
      });

    } catch (error) {
      console.error("ClassRoster: Error setting up class roster listeners: ", error);
      toast({
        title: 'Error',
        description: 'Failed to set up class roster listeners.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }

    return () => { // Return the cleanup function regardless of errors during setup
      console.log("ClassRoster: Cleaning up Firestore listeners.");
      classUnsubscribe();
      studentsUnsubscribe();
    };
  }, [classId, toast]);

  useEffect(() => {
    const cleanup = fetchClassAndStudents();
    return () => { cleanup(); };
  }, [fetchClassAndStudents]);

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        const currentEnrollments = studentDoc.data().enrolledClassIds || [];
        const updatedEnrollments = currentEnrollments.filter((id: string) => id !== classId);

        await updateDoc(studentRef, {
          enrolledClassIds: updatedEnrollments,
        });
        toast({
          title: 'Student Removed',
          description: `${studentName} has been removed from ${className}.`,
        });
      } else {
        toast({
          title: 'Student Not Found',
          description: 'Could not find the student to remove.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error removing student: ", error);
      toast({
        title: 'Error',
        description: 'Failed to remove student.',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'fullName',
      header: 'Student Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${row.original.uid}`} alt={row.original.fullName} />
            <AvatarFallback>{row.original.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const student = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(student.email)}
              >
                Copy student email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent dropdown closing immediately */}
                    <Trash2 className="mr-2 h-4 w-4" /> Remove from Class
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will remove <span className="font-bold">{student.fullName}</span> from <span className="font-bold">{className}</span>. This means they will no longer have access to this class's activities or content.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemoveStudent(student.uid, student.fullName)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Remove Student
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="font-headline text-2xl">
            {className} Class Roster
          </CardTitle>
          <CardDescription>
            Manage students enrolled in this class. {students.length > 0 && `(${students.length} students)`}
          </CardDescription>
        </div>
        <EnrollStudentDialog classId={classId} className={className} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <Alert>
            <AlertTitle>No Students Enrolled</AlertTitle>
            <AlertDescription>
              There are no students currently enrolled in this class. Share the class code with your students to get them started!
            </AlertDescription>
          </Alert>
        ) : (
          <DataTable columns={columns} data={students} />
        )}
      </CardContent>
    </Card>
  );
}


'use client';

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface EnrollStudentDialogProps {
  classId: string;
  className: string;
}

export function EnrollStudentDialog({ classId, className }: EnrollStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { toast } = useToast();

  const handleEnrollStudent = async () => {
    if (!studentEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter the student\'s email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsEnrolling(true);
    try {
      // 1. Find the student by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', studentEmail.toLowerCase()), where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Student Not Found',
          description: 'No student found with that email address.',
          variant: 'destructive',
        });
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();
      const studentId = studentDoc.id;
      const studentName = studentData.fullName || studentEmail;

      // 2. Check if student is already enrolled
      if (studentData.enrolledClassIds && studentData.enrolledClassIds.includes(classId)) {
        toast({
          title: 'Already Enrolled',
          description: `${studentName} is already enrolled in ${className}.`,
          variant: 'default',
        });
        return;
      }

      // 3. Enroll the student
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        enrolledClassIds: arrayUnion(classId),
      });

      toast({
        title: 'Student Enrolled!',
        description: `${studentName} has been successfully enrolled in ${className}.`,
      });

      handleCloseAndReset();

    } catch (error) {
      console.error("Error enrolling student: ", error);
      toast({
        title: 'Error',
        description: 'Could not enroll the student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCloseAndReset = () => {
    setOpen(false);
    setStudentEmail('');
    setIsEnrolling(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleCloseAndReset();
        } else {
            setOpen(true);
        }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 size-4" />
          Enroll Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          if (isEnrolling) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="font-headline">
            Enroll a Student
          </DialogTitle>
          <DialogDescription>
            Enter the email address of the student you wish to enroll in this class.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="student-email">Student Email</Label>
                <Input
                    id="student-email"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@example.com"
                    disabled={isEnrolling}
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleCloseAndReset} disabled={isEnrolling}>
            Cancel
          </Button>
          <Button onClick={handleEnrollStudent} disabled={isEnrolling}>
            {isEnrolling && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isEnrolling ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

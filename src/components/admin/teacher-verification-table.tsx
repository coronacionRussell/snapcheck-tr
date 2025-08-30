
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
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { collection, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Teacher {
  uid: string;
  fullName: string;
  email: string;
  verified: boolean;
}

const getStatusVariant = (status: boolean) => {
  return status ? 'default' : 'secondary';
};
const getStatusText = (status: boolean) => {
  return status ? 'Verified' : 'Pending';
};

export function TeacherVerificationTable() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teachersData = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as Teacher[];
      setTeachers(teachersData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch the list of teachers.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const handleVerification = async (teacherId: string, newStatus: boolean) => {
    setIsUpdating((prev) => ({ ...prev, [teacherId]: true }));
    try {
      const teacherRef = doc(db, 'users', teacherId);
      await updateDoc(teacherRef, { verified: newStatus });
      
      // No need to setTeachers locally, onSnapshot will handle it.

      toast({
          title: 'Success',
          description: `Teacher status updated to ${newStatus ? 'Verified' : 'Pending'}.`
      })

    } catch (error) {
        console.error('Error updating verification status: ', error);
        toast({
            title: 'Update Failed',
            description: 'Could not update the teacher\'s verification status.',
            variant: 'destructive'
        })
    } finally {
      setIsUpdating((prev) => ({ ...prev, [teacherId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Teacher Accounts</CardTitle>
        <CardDescription>
          Approve or reject teacher accounts to grant them full access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : teachers.length > 0 ? (
              teachers.map((teacher) => (
                <TableRow key={teacher.uid}>
                  <TableCell className="font-medium">{teacher.fullName}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(teacher.verified)}
                      className={getStatusVariant(teacher.verified) === 'default' ? 'bg-primary/80' : ''}
                    >
                      {getStatusText(teacher.verified)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {isUpdating[teacher.uid] ? (
                       <Button variant="outline" size="sm" disabled>
                           <Loader2 className="animate-spin" />
                       </Button>
                    ) : teacher.verified ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVerification(teacher.uid, false)}
                      >
                        Reject
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleVerification(teacher.uid, true)}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No teachers have registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

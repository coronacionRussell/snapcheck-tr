
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
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';


export default function AdminDashboard() {
    const [teachers, setTeachers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'teacher'));
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const teachersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppUser[];
            setTeachers(teachersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching teachers: ", error);
            toast({ title: 'Error', description: 'Could not fetch teachers list.', variant: 'destructive'});
            setIsLoading(false);
        });
    
        return () => unsubscribe();
      }, []);

      const handleVerifyTeacher = async (teacherId: string, isVerified: boolean) => {
        setIsVerifying(teacherId);
        try {
            const userDocRef = doc(db, 'users', teacherId);
            await updateDoc(userDocRef, {
                isVerified: !isVerified
            });
            toast({
                title: 'Success',
                description: `Teacher has been ${!isVerified ? 'verified' : 'unverified'}.`
            })
        } catch (error) {
            console.error("Error verifying teacher: ", error);
            toast({ title: 'Error', description: 'Could not update teacher verification status.', variant: 'destructive'});
        } finally {
            setIsVerifying(null);
        }
      }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Verify and manage teacher accounts.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Teacher Accounts</CardTitle>
          <CardDescription>
            A list of all users with the 'teacher' role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}>
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher.uid}>
                    <TableCell className="font-medium">{teacher.fullName}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                        {teacher.isVerified ? (
                            <Badge>
                                <CheckCircle className="mr-2 size-4"/>
                                Verified
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Not Verified</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm"
                        onClick={() => handleVerifyTeacher(teacher.uid, !!teacher.isVerified)}
                        disabled={isVerifying === teacher.uid}
                        variant={teacher.isVerified ? 'secondary' : 'default'}
                      >
                         {isVerifying === teacher.uid && <Loader2 className="mr-2 size-4 animate-spin" />}
                         {teacher.isVerified ? 'Unverify' : 'Verify'}
                      </Button>
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
    </div>
  );
}


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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function AdminDashboard() {
    const [teachers, setTeachers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'teacher'));
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const teachersData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as AppUser[];
            setTeachers(teachersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching teachers: ", error);
            toast({ title: 'Error', description: 'Could not fetch teachers list.', variant: 'destructive'});
            setIsLoading(false);
        });
    
        return () => unsubscribe();
      }, []);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage teacher accounts.
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={2}>
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher.uid}>
                    <TableCell className="font-medium">{teacher.fullName}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
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

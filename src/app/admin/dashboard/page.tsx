
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
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { deleteUser } from '@/ai/flows/delete-user';

export default function AdminDashboard() {
    const [teachers, setTeachers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState<string | null>(null);
    const [isUnverifying, setIsUnverifying] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'teacher'));
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const teachersData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
            setTeachers(teachersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching teachers: ", error);
            toast({ title: 'Error', description: 'Could not fetch teachers list.', variant: 'destructive'});
            setIsLoading(false);
        });
    
        return () => unsubscribe();
      }, []);

    const handleVerifyTeacher = async (teacherId: string, teacherName: string) => {
        setIsVerifying(teacherId);
        try {
            const userDocRef = doc(db, 'users', teacherId);
            await updateDoc(userDocRef, { isVerified: true });
            toast({
                title: 'Teacher Verified!',
                description: `${teacherName}'s account has been successfully verified.`,
            });
        } catch (error) {
            console.error("Error verifying teacher: ", error);
            toast({ title: 'Error', description: 'Could not verify the teacher.', variant: 'destructive'});
        } finally {
            setIsVerifying(null);
        }
    }

    const handleUnverifyTeacher = async (teacherId: string, teacherName: string) => {
        setIsUnverifying(teacherId);
        try {
            const userDocRef = doc(db, 'users', teacherId);
            await updateDoc(userDocRef, { isVerified: false });
            toast({
                title: 'Teacher Unverified',
                description: `${teacherName}'s account status has been set to pending.`,
            });
        } catch (error) {
            console.error("Error un-verifying teacher: ", error);
            toast({ title: 'Error', description: 'Could not un-verify the teacher.', variant: 'destructive'});
        } finally {
            setIsUnverifying(null);
        }
    }

    const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
        setIsDeleting(teacherId);
        try {
          await deleteUser({ uid: teacherId });
          toast({
            title: 'Account Deleted',
            description: `The account for ${teacherName} has been deleted.`,
          });
          // The onSnapshot listener will update the UI automatically.
        } catch (error) {
          console.error('Error deleting teacher:', error);
          toast({
            title: 'Deletion Failed',
            description: 'Could not delete the teacher account. It may require manual deletion from the Firebase console.',
            variant: 'destructive',
            duration: 9000,
          });
        } finally {
          setIsDeleting(null);
        }
      };


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage teacher accounts and verify new registrations.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Teacher Accounts</CardTitle>
          <CardDescription>
            A list of all registered teachers. Please verify new accounts.
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
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <TableRow key={teacher.uid}>
                    <TableCell className="font-medium">{teacher.fullName}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                        <Badge variant={teacher.isVerified ? 'default' : 'secondary'} className={teacher.isVerified ? 'bg-primary/80' : ''}>
                            {teacher.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={!teacher.verificationIdUrl}>View ID</Button>
                            </DialogTrigger>
                            {teacher.verificationIdUrl && (
                                <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Verification ID: {teacher.fullName}</DialogTitle>
                                    </DialogHeader>
                                    <div className="relative mt-2 aspect-video w-full">
                                        <Image
                                            src={teacher.verificationIdUrl}
                                            alt={`Verification ID for ${teacher.fullName}`}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </DialogContent>
                            )}
                        </Dialog>
                        {!teacher.isVerified ? (
                           <Button 
                             size="sm" 
                             onClick={() => handleVerifyTeacher(teacher.uid, teacher.fullName)}
                             disabled={isVerifying === teacher.uid}
                            >
                               {isVerifying === teacher.uid && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                               Verify
                           </Button>
                        ) : (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={isUnverifying === teacher.uid}>
                                         {isUnverifying === teacher.uid && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                                        Unverify
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will revoke verification for <strong>{teacher.fullName}</strong>. They will lose access to teacher functionalities until they are verified again.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleUnverifyTeacher(teacher.uid, teacher.fullName)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Yes, Unverify
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isDeleting === teacher.uid}>
                                    {isDeleting === teacher.uid ? <Loader2 className="h-5 w-5 animate-spin"/> : <Trash2 className="size-4"/>}
                                    <span className="sr-only">Delete account</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete the account for <strong>{teacher.fullName}</strong> and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteTeacher(teacher.uid, teacher.fullName)}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Yes, Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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

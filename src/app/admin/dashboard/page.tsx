
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
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Users, School, BookCopy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { deleteUser } from '@/ai/flows/delete-user';

interface Stats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
}

export default function AdminDashboard() {
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState<string | null>(null);
    const [isUnverifying, setIsUnverifying] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatsAndUsers = () => {
            const usersCollection = collection(db, 'users');
            const classesCollection = collection(db, 'classes');
            
            // Listener for all users
            const usersQuery = query(usersCollection, orderBy('fullName'));
            const unsubscribeUsers = onSnapshot(usersQuery, async (usersSnapshot) => {
                const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
                setAllUsers(usersData);

                // Recalculate stats whenever users change
                const classesSnapshot = await getDocs(classesCollection);
                let totalTeachers = 0;
                let totalStudents = 0;
                usersData.forEach(user => {
                    if (user.role === 'teacher') totalTeachers++;
                    if (user.role === 'student') totalStudents++;
                });

                setStats({
                    totalUsers: usersData.length,
                    totalTeachers,
                    totalStudents,
                    totalClasses: classesSnapshot.size,
                });
                setIsLoading(false);

            }, (error) => {
                console.error("Error fetching users and stats:", error);
                toast({ title: 'Error', description: 'Could not fetch platform data.', variant: 'destructive' });
                setIsLoading(false);
            });

            // Listener for classes to update stats if a class is added/deleted
            const unsubscribeClasses = onSnapshot(classesCollection, (classesSnapshot) => {
                setStats(prevStats => prevStats ? { ...prevStats, totalClasses: classesSnapshot.size } : null);
            });

            return () => {
                unsubscribeUsers();
                unsubscribeClasses();
            };
        };

        const unsubscribe = fetchStatsAndUsers();
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

    const handleDeleteAccount = async (userId: string, userName: string) => {
        setIsDeleting(userId);
        try {
          const result = await deleteUser({ uid: userId });
          if (!result.success) {
            throw new Error(result.message);
          }
          toast({
            title: 'Account Deleted',
            description: `The account for ${userName} has been deleted.`,
          });
          // The onSnapshot listener will update the UI automatically.
        } catch (error) {
          console.error('Error deleting user:', error);
          toast({
            title: 'Deletion Failed',
            description: 'Could not delete the user account. It may require manual deletion from the Firebase console.',
            variant: 'destructive',
            duration: 9000,
          });
        } finally {
          setIsDeleting(null);
        }
      };


  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users and view platform statistics.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats ? <div className="text-2xl font-bold">{stats.totalUsers}</div> : <Skeleton className="h-8 w-12" />}
                    <p className="text-xs text-muted-foreground">All registered users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats ? <div className="text-2xl font-bold">{stats.totalTeachers}</div> : <Skeleton className="h-8 w-12" />}
                    <p className="text-xs text-muted-foreground">Verified & pending teachers</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats ? <div className="text-2xl font-bold">{stats.totalStudents}</div> : <Skeleton className="h-8 w-12" />}
                    <p className="text-xs text-muted-foreground">All registered students</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                    <BookCopy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {stats ? <div className="text-2xl font-bold">{stats.totalClasses}</div> : <Skeleton className="h-8 w-12" />}
                    <p className="text-xs text-muted-foreground">Classes created by teachers</p>
                </CardContent>
            </Card>
        </div>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline">All Users</CardTitle>
          <CardDescription>
            A list of all registered students and teachers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                ))
              ) : allUsers.length > 0 ? (
                allUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                        {user.role === 'teacher' ? (
                            <Badge variant={user.isVerified ? 'default' : 'secondary'} className={user.isVerified ? 'bg-primary/80' : ''}>
                                {user.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                        ) : (
                            <Badge variant="default" className="bg-green-600/80">Active</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {user.role === 'teacher' && (
                             <>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={!user.verificationIdUrl}>View ID</Button>
                                    </DialogTrigger>
                                    {user.verificationIdUrl && (
                                        <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
                                            <DialogHeader>
                                                <DialogTitle>Verification ID: {user.fullName}</DialogTitle>
                                            </DialogHeader>
                                            <div className="relative mt-2 aspect-video w-full">
                                                <Image
                                                    src={user.verificationIdUrl}
                                                    alt={`Verification ID for ${user.fullName}`}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </DialogContent>
                                    )}
                                </Dialog>
                                {!user.isVerified ? (
                                <Button 
                                    size="sm" 
                                    onClick={() => handleVerifyTeacher(user.uid, user.fullName)}
                                    disabled={isVerifying === user.uid}
                                    >
                                    {isVerifying === user.uid && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                                    Verify
                                </Button>
                                ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={isUnverifying === user.uid}>
                                                {isUnverifying === user.uid && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                                                Unverify
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This will revoke verification for <strong>{user.fullName}</strong>. They will lose access to teacher functionalities until they are verified again.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleUnverifyTeacher(user.uid, user.fullName)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Yes, Unverify
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                             </>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isDeleting === user.uid}>
                                    {isDeleting === user.uid ? <Loader2 className="h-5 w-5 animate-spin"/> : <Trash2 className="size-4"/>}
                                    <span className="sr-only">Delete account</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete the account for <strong>{user.fullName}</strong> and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteAccount(user.uid, user.fullName)}
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
                  <TableCell colSpan={5} className="text-center h-24">
                    No users have registered yet.
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

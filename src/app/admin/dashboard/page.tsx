
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
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Users, School, BookCopy, UserCheck, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { deleteUser } from '@/ai/flows/delete-user';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';

interface Stats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
}

function AdminDashboardContent() {
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState<string | null>(null);
    const [isUnverifying, setIsUnverifying] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'), orderBy('fullName'));
        const unsubscribeUsers = onSnapshot(usersQuery, (usersSnapshot) => {
            const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
            setAllUsers(usersData);

            let totalTeachers = 0;
            let totalStudents = 0;
            usersData.forEach(user => {
                if (user.role === 'teacher') totalTeachers++;
                if (user.role === 'student') totalStudents++;
            });

            setStats(prevStats => ({
                ...(prevStats || { totalClasses: 0 }),
                totalUsers: usersData.length,
                totalTeachers,
                totalStudents,
            }));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
            setIsLoading(false);
        });

        const classesQuery = query(collection(db, 'classes'));
        const unsubscribeClasses = onSnapshot(classesQuery, (classesSnapshot) => {
            setStats(prevStats => ({
                ...(prevStats || { totalUsers: 0, totalTeachers: 0, totalStudents: 0 }),
                totalClasses: classesSnapshot.size,
            }));
        }, (error) => {
            console.error("Error fetching classes:", error);
            toast({ title: 'Error', description: 'Could not fetch class data.', variant: 'destructive' });
        });

        return () => {
            unsubscribeUsers();
            unsubscribeClasses();
        };
    }, []);

    const filteredTeachers = useMemo(() => {
        let teachers = allUsers.filter(user => user.role === 'teacher');
        
        // Sort to show unverified ones at the top
        teachers.sort((a, b) => (a.isVerified === b.isVerified) ? 0 : a.isVerified ? 1 : -1);

        if (!teacherSearch) {
            return teachers;
        }
        return teachers.filter(teacher => 
            teacher.fullName?.toLowerCase().includes(teacherSearch.toLowerCase())
        );
    }, [allUsers, teacherSearch]);

    const filteredStudents = useMemo(() => {
        let students = allUsers.filter(user => user.role === 'student');

        if (!studentSearch) {
            return students;
        }
        return students.filter(student => 
            student.fullName?.toLowerCase().includes(studentSearch.toLowerCase())
        );
    }, [allUsers, studentSearch]);

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
        } catch (error: any) {
          console.error('Error deleting user:', error);
          toast({
            title: 'Deletion Failed',
            description: error.message || 'Could not delete the user account. It may require manual deletion from the Firebase console.',
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <School />
                        Teachers
                    </CardTitle>
                    <CardDescription>
                        Manage all teachers. Unverified teachers appear at the top.
                    </CardDescription>
                </div>
                <div className="relative sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search teachers..." className="pl-10" value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} />
                </div>
            </div>
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
                        <TableCell className="text-right space-x-2">
                            <Skeleton className="h-8 w-20 inline-block" />
                            <Skeleton className="h-8 w-24 inline-block" />
                        </TableCell>
                    </TableRow>
                ))
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'secondary'} className={user.isVerified ? 'bg-primary/80' : ''}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {!user.isVerified && (
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
                                <Button 
                                    size="sm" 
                                    onClick={() => handleVerifyTeacher(user.uid, user.fullName)}
                                    disabled={isVerifying === user.uid}
                                    >
                                    {isVerifying === user.uid && <Loader2 className="mr-2 h-5 w-5 animate-spin"/>}
                                    Verify
                                </Button>
                            </>
                        )}
                        {user.isVerified && (
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
                                    This will revoke verification for <strong>{user.fullName}</strong>. They will be moved to pending and will lose access to teacher functionalities.
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
                  <TableCell colSpan={4} className="text-center h-24">
                    {teacherSearch ? `No teachers found matching "${teacherSearch}".` : "No teachers have registered yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Users />
                        Students
                    </CardTitle>
                    <CardDescription>
                        A list of all registered students.
                    </CardDescription>
                </div>
                <div className="relative sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search students..." className="pl-10" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-10" /></TableCell>
                    </TableRow>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right space-x-2">
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
                  <TableCell colSpan={3} className="text-center h-24">
                    {studentSearch ? `No students found matching "${studentSearch}".` : "No students have registered yet."}
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

const AdminDashboardDynamic = dynamic(() => Promise.resolve(AdminDashboardContent), {
  ssr: false,
  loading: () => (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  ),
});

export default function AdminDashboard() {
    return <AdminDashboardDynamic />;
}

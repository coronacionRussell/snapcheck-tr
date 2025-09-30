
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BookOpen, DoorOpen, Loader2, LogOut, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, increment, query, where, arrayRemove, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, AppUser } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

const JoinClassCard = dynamic(
  () => import('@/components/student/join-class-card').then((mod) => mod.JoinClassCard),
  { ssr: false }
);

interface EnrolledClass {
    id: string;
    name: string;
    teacherName: string;
}

function StudentClassesPageContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isLeavingClass, setIsLeavingClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !user.enrolledClassIds || user.enrolledClassIds.length === 0) {
      setEnrolledClasses([]);
      setIsClassesLoading(false);
      return;
    }

    setIsClassesLoading(true);
    const classesQuery = query(collection(db, 'classes'), where('__name__', 'in', user.enrolledClassIds));
    
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        teacherName: doc.data().teacherName,
      })) as EnrolledClass[];
      
      setEnrolledClasses(classesData);
      setIsClassesLoading(false);
    }, (error) => {
      console.error("Error fetching student classes in real-time: ", error);
      toast({
          title: 'Error',
          description: 'Could not fetch your classes.',
          variant: 'destructive',
      });
      setIsClassesLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const filteredClasses = useMemo(() => {
    if (!searchQuery) {
      return enrolledClasses;
    }
    return enrolledClasses.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enrolledClasses, searchQuery]);

  const handleLeaveClass = async (classId: string, className: string) => {
    if (!user) {
        toast({ title: 'Not authenticated', variant: 'destructive'});
        return;
    }
    setIsLeavingClass(classId);
    try {
        const batch = writeBatch(db);

        // Remove student from class subcollection
        const studentDocRef = doc(db, 'classes', classId, 'students', user.uid);
        batch.delete(studentDocRef);
        
        // Decrement student count on class
        const classDocRef = doc(db, 'classes', classId);
        batch.update(classDocRef, { studentCount: increment(-1) });

        // Remove classId from user's enrolledClassIds array
        const userDocRef = doc(db, 'users', user.uid);
        batch.update(userDocRef, { enrolledClassIds: arrayRemove(classId) });

        await batch.commit();

        toast({
            title: 'Successfully Unenrolled',
            description: `You have left the class "${className}".`
        });
        
        // The real-time listener will automatically update the UI
    } catch(error) {
        console.error("Error leaving class: ", error);
        toast({
            title: 'Error',
            description: 'Could not leave the class. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsLeavingClass(null);
    }
  }

  const handleClassJoined = () => {
    // The real-time listener handles UI updates, so this can be empty or used for other side-effects.
    // For now, we don't need to do anything here.
  }

  const isLoading = isAuthLoading || isClassesLoading;

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
       <div>
        <h1 className="font-headline text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground">
          Join new classes or enter a class to view details.
        </p>
      </div>

       <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="font-headline">Enrolled Classes</CardTitle>
                    </div>
                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search classes..." 
                            className="pl-10" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                 <Skeleton className="size-10 rounded-lg" />
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                           <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                 </div>
              ) : filteredClasses.length > 0 ? (
                <div className="space-y-4">
                  {filteredClasses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-xl">{c.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.teacherName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="secondary" size="sm">
                            <Link href={`/student/classes/${c.id}`}>
                                <DoorOpen className="mr-2 size-4" />
                                Enter
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={isLeavingClass === c.id}>
                                  {isLeavingClass === c.id ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <LogOut className="mr-2 size-4"/>}
                                  Leave
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You will be unenrolled from <strong>{c.name}</strong>. You will need a new class code from your teacher to join again.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleLeaveClass(c.id, c.name)} className="bg-destructive hover:bg-destructive/90">
                                  Yes, Leave Class
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                    {searchQuery ? (
                        <p>No classes found matching "{searchQuery}".</p>
                    ) : (
                        <>
                            <p>You are not enrolled in any classes yet.</p>
                            <p className="text-sm">Use the "Join a New Class" card to get started.</p>
                        </>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <JoinClassCard onClassJoined={handleClassJoined} />
        </div>
      </div>
    </div>
  );
}

const StudentClassesPageDynamic = dynamic(() => Promise.resolve(StudentClassesPageContent), {
  ssr: false,
  loading: () => (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-64" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
});

export default function StudentClassesPage() {
  return <StudentClassesPageDynamic />;
}

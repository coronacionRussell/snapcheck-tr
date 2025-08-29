
'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const JoinClassCard = dynamic(
  () => import('@/components/student/join-class-card').then(mod => mod.JoinClassCard),
  { ssr: false }
);

interface EnrolledClass {
    id: string;
    name: string;
    teacher: string; // We'll add this later
}


const recentGrades: any[] = [];

export default function StudentDashboard() {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      setIsLoading(true);
      try {
        // In a real app, studentId would come from auth state.
        const studentId = 'student-alex-doe'; 

        // This is not the most efficient query, but it works for this prototype.
        // A better structure would be a user document with a list of class IDs.
        const classesCollection = collection(db, 'classes');
        const classesSnapshot = await getDocs(classesCollection);
        
        const classesData: EnrolledClass[] = [];

        for (const classDoc of classesSnapshot.docs) {
            const studentDocRef = doc(db, `classes/${classDoc.id}/students`, studentId);
            const studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
                // In a real app, teacher name would be stored on the class document
                classesData.push({
                    id: classDoc.id,
                    name: classDoc.data().name,
                    teacher: 'Teacher Name', 
                });
            }
        }
        setEnrolledClasses(classesData);

      } catch (error) {
        console.error("Error fetching enrolled classes: ", error);
        toast({
            title: 'Error',
            description: 'Could not fetch your classes.',
            variant: 'destructive',
        })
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledClasses();
  }, [toast]);


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, here is your academic summary.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Classes</CardTitle>
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
                           <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                 </div>
              ) : enrolledClasses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledClasses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.teacher}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Enrolled</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>You are not enrolled in any classes yet.</p>
                  <p className="text-sm">Use the "Join a New Class" card to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <JoinClassCard onClassJoined={() => {
            // This is a temporary solution to refresh the class list.
            // A more robust solution would use a state management library.
            window.location.reload();
          }} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Grades</CardTitle>
          <CardDescription>
            A summary of your recently graded assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {recentGrades.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.assignment}
                      </TableCell>
                      <TableCell>{grade.class}</TableCell>
                      <TableCell className="font-semibold">{grade.grade}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            grade.status === 'Graded' ? 'default' : 'secondary'
                          }
                          className={grade.status === 'Graded' ? 'bg-primary/80' : ''}
                        >
                          {grade.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    <p>You do not have any grades yet.</p>
                    <p className="text-sm">When your assignments are graded, they will appear here.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

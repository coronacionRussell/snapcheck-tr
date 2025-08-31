
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
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

const JoinClassCard = dynamic(
  () => import('@/components/student/join-class-card').then((mod) => mod.JoinClassCard),
  { ssr: false }
);

interface EnrolledClass {
    id: string;
    name: string;
    teacherName: string;
}

interface RecentGrade {
    id: string;
    assignment: string;
    class: string;
    grade: string;
    status: 'Graded' | 'Pending Review';
}


export default function StudentDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isGradesLoading, setIsGradesLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudentData = useCallback(async () => {
    if (!user) return;

    setIsClassesLoading(true);
    setIsGradesLoading(true);
    try {
      const studentId = user.uid;

      // Fetch all classes
      const classesCollection = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesCollection);
      const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string, name: string, teacherName: string }));
      
      const classesData: EnrolledClass[] = [];
      const gradesData: RecentGrade[] = [];

      // Find which classes the student is in and fetch their submissions
      for (const classInfo of allClasses) {
          const studentDocRef = doc(db, `classes/${classInfo.id}/students`, studentId);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
              classesData.push({
                  id: classInfo.id,
                  name: classInfo.name,
                  teacherName: classInfo.teacherName,
              });
              
              // Fetch recent graded submissions for this class
              const submissionsQuery = query(
                collection(db, 'classes', classInfo.id, 'submissions'),
                where('studentId', '==', studentId),
                where('status', '==', 'Graded'),
                limit(5) 
              );
              const submissionsSnapshot = await getDocs(submissionsQuery);
              submissionsSnapshot.forEach(submissionDoc => {
                const data = submissionDoc.data();
                gradesData.push({
                    id: submissionDoc.id,
                    assignment: data.assignmentName || 'Essay Submission',
                    class: classInfo.name,
                    grade: data.grade,
                    status: data.status,
                });
              });
          }
      }

      setEnrolledClasses(classesData);
      setRecentGrades(gradesData);

    } catch (error) {
      console.error("Error fetching student data: ", error);
      toast({
          title: 'Error',
          description: 'Could not fetch your classes or grades.',
          variant: 'destructive',
      })
    } finally {
      setIsClassesLoading(false);
      setIsGradesLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
        fetchStudentData();
    }
  }, [fetchStudentData, user]);

  const isLoading = isAuthLoading || isClassesLoading || isGradesLoading;

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.fullName || 'student'}. Here is your academic summary.
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
                            {c.teacherName}
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
          <JoinClassCard onClassJoined={fetchStudentData} />
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
           {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recentGrades.length > 0 ? (
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

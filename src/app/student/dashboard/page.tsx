
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen, FilePenLine, History, MessageSquareText } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    feedback?: string;
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

      const classesCollection = collection(db, 'classes');
      const classesSnapshot = await getDocs(classesCollection);
      const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string, name: string, teacherName: string }));
      
      const classesData: EnrolledClass[] = [];
      const gradesData: RecentGrade[] = [];

      for (const classInfo of allClasses) {
          const studentDocRef = doc(db, `classes/${classInfo.id}/students`, studentId);
          const studentDoc = await getDoc(studentDocRef);

          if (studentDoc.exists()) {
              classesData.push({
                  id: classInfo.id,
                  name: classInfo.name,
                  teacherName: classInfo.teacherName,
              });
              
              const submissionsQuery = query(
                collection(db, 'classes', classInfo.id, 'submissions'),
                where('studentId', '==', studentId),
                where('status', '==', 'Graded'),
                limit(3) 
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
                    feedback: data.feedback,
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

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrolled Classes</CardTitle>
              <BookOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{enrolledClasses.length}</div> }
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/student/classes">View all classes</Link>
              </Button>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submit a New Essay</CardTitle>
              <FilePenLine className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">&nbsp;</div>
              <Button variant="link" asChild className="p-0 h-auto">
                <Link href="/student/submit-essay">Go to Submission Page</Link>
              </Button>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View Submission History</CardTitle>
              <History className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">&nbsp;</div>
                <Button variant="link" asChild className="p-0 h-auto">
                    <Link href="/student/grades">See All Grades</Link>
                </Button>
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Grades</CardTitle>
          <CardDescription>
            A summary of your most recently graded assignments.
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
                    <TableHead className="text-right">Actions</TableHead>
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
                       <TableCell className="text-right">
                         {grade.feedback && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <MessageSquareText className="mr-2" />
                                        View Feedback
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Feedback for {grade.assignment}</DialogTitle>
                                        <DialogDescription>
                                            Class: {grade.class} | Grade: {grade.grade}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="prose prose-sm mt-4 max-w-none rounded-md border bg-secondary p-4 text-secondary-foreground whitespace-pre-wrap">
                                        {grade.feedback}
                                    </div>
                                </DialogContent>
                            </Dialog>
                         )}
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

'use client';

import Link from 'next/link';
import { BookOpen, BookUser, CheckSquare, ScanText, Hourglass, Users, ScanLine } from 'lucide-react';
import { useContext, useEffect, useState, useCallback } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreateClassDialog } from '@/components/teacher/create-class-dialog';
import { ClassContext } from '@/contexts/class-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function TeacherDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { classes, isLoading: areClassesLoading } = useContext(ClassContext);

  const [totalClassesCount, setTotalClassesCount] = useState(0);
  const [totalPendingSubmissionsCount, setTotalPendingSubmissionsCount] = useState(0);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user || areClassesLoading) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    let classesCount = 0;
    let pendingSubmissions = 0;
    let studentsCount = 0;

    try {
      const teacherClassesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
      const teacherClassesSnapshot = await getDocs(teacherClassesQuery);

      classesCount = teacherClassesSnapshot.size;
      setTotalClassesCount(classesCount);

      const studentIds = new Set<string>();

      for (const classDoc of teacherClassesSnapshot.docs) {
        const classId = classDoc.id;

        // Count pending submissions for this class
        const submissionsQuery = query(
          collection(db, 'classes', classId, 'submissions'),
          where('status', '==', 'Pending Review')
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        pendingSubmissions += submissionsSnapshot.size;

        // Count students for this class
        const studentsQuery = query(collection(db, 'classes', classId, 'students'));
        const studentsSnapshot = await getDocs(studentsQuery);
        studentsSnapshot.forEach(studentDoc => studentIds.add(studentDoc.id));
      }

      setTotalPendingSubmissionsCount(pendingSubmissions);
      setTotalStudentsCount(studentIds.size);

    } catch (error) {
      console.error("Error fetching teacher dashboard data: ", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, areClassesLoading]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const isLoading = isAuthLoading || areClassesLoading || isDataLoading;

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">
            {user ? `Professor ${user?.fullName}'s Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, here's your teaching overview.
          </p>
        </div>
        <CreateClassDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClassesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Classes created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-sm font-medium">Pending Submissions</CardTitle>
                <Hourglass className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPendingSubmissionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Submissions needing grading
                </p>
                {totalPendingSubmissionsCount > 0 && (
                    <Link href="/teacher/classes" className="text-xs text-primary hover:underline">
                        View All Classes to Grade
                    </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-sm font-medium">Total Students</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudentsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Students across all classes
                </p>
              </CardContent>
            </Card>

            {/* New card for Batch Scan & AI Grade */}
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-headline text-sm font-medium">Batch Scan & AI Grade</CardTitle>
                    <ScanLine className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">Automate Grading</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        Scan multiple handwritten essays, identify students, and get AI-generated scores and feedback.
                    </p>
                    <Button asChild>
                        <Link href="/teacher/scan-batch-submissions">
                            <ScanLine className="mr-2 h-4 w-4" /> Start Batch Scan
                        </Link>
                    </Button>
                </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {!isLoading && totalClassesCount === 0 && (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="font-headline">Welcome to SnapCheck!</CardTitle>
                <CardDescription>It looks like you're new here. Let's get you started.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                    <h3 className="font-semibold text-lg">You haven't created any classes yet.</h3>
                    <p className="text-muted-foreground mt-2">Click the "Create New Class" button to set up your first class and start receiving essay submissions from your students.</p>
                </div>
            </CardContent>
        </Card>
      )}

      {/* Getting Started Guide - always display below summary cards if classes exist or are loading */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Getting Started Guide</CardTitle>
          <CardDescription>
            Follow these steps to get the most out of SnapCheck.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">1. Create a Class</h3>
                    <p className="text-sm text-muted-foreground">Use the "Create New Class" button to set up a class. Share the generated code with your students so they can enroll.</p>
                  </div>
              </div>
               <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookUser className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">2. Create Activities</h3>
                    <p className="text-sm text-muted-foreground">Enter a class and create activities. Each activity has its own grading rubric which you can customize.</p>
                  </div>
              </div>
               <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckSquare className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">3. Grade Submissions</h3>
                    <p className="text-sm text-muted-foreground">When students submit essays, they'll appear in your class. Use the AI Assistant to get preliminary feedback and scores based on your rubric.</p>
                  </div>
              </div>
                <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ScanText className="size-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">4. Scan Handwritten Essays</h3>
                        <p className="text-sm text-muted-foreground">Use the "Scan Essay" page to digitize handwritten work. You can then save it as a submission for any student in your class.</p>
                    </div>
                </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import Link from 'next/link';
import { BookOpen, BookUser, CheckSquare, ScanText } from 'lucide-react';
import { useContext } from 'react';

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


export default function TeacherDashboard() {
  const { user } = useAuth();
  const { classes, isLoading } = useContext(ClassContext);

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
        {isLoading &&
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
          ))}
        {!isLoading && classes.length > 0 &&
          classes.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-sm font-medium">
                  <Link href={`/teacher/classes/${c.id}`} className="hover:underline">{c.name}</Link>
                </CardTitle>
                <BookOpen className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.studentCount} Students</div>
                <p className="text-xs text-muted-foreground">
                  {c.pendingSubmissions} submissions need grading
                </p>
              </CardContent>
            </Card>
          ))}
      </div>
      
      {!isLoading && classes.length === 0 && (
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

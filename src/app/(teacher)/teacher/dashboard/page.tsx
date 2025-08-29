
'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
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

export default function TeacherDashboard() {
  const { classes, isLoading } = useContext(ClassContext);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
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
        {!isLoading &&
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

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Submissions</CardTitle>
          <CardDescription>
            Essays from your students that are ready for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="py-8 text-center text-muted-foreground">
              <p>No student submissions yet.</p>
              <p className="text-sm">When students submit essays, they will appear here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

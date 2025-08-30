
'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { Users, FileText, Trash2, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClassContext } from '@/contexts/class-context';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassesPage() {
  const { classes, onClassDeleted, isLoading } = useContext(ClassContext);

  if (isLoading) {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
             <div>
                <h1 className="font-headline text-3xl font-bold">My Classes</h1>
                <p className="text-muted-foreground">
                Manage your classes, students, and rubrics.
                </p>
            </div>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="mt-1 h-4 w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Skeleton className="h-4 w-1/2" />
                             <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground">
          Manage your classes, students, and rubrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 && !isLoading && (
            <div className="col-span-full text-center text-muted-foreground">
                <p>You haven't created any classes yet.</p>
            </div>
        )}
        {classes.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="font-headline pr-2">
                    <Link
                      href={`/app/teacher/classes/${c.id}`}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>Class Code: {c.id}</CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 shrink-0">
                      <Trash2 className="size-4 text-destructive" />
                      <span className="sr-only">Delete class</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the class "{c.name}" and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onClassDeleted(c.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>{c.studentCount} Students</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                <span>{c.pendingSubmissions} Submissions Pending</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

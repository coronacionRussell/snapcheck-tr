
'use client';

import Link from 'next/link';
import { useContext, useState, useMemo } from 'react';
import { Users, FileText, Trash2, DoorOpen, Copy, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
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
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function ClassesPage() {
  const { classes, onClassDeleted, isLoading } = useContext(ClassContext);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'The class code has been copied to your clipboard.',
    });
  };

  const filteredClasses = useMemo(() => {
    if (!searchQuery) {
      return classes;
    }
    return classes.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classes, searchQuery]);

  if (isLoading) {
    return (
      <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
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
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground">
          Manage your classes, students, and rubrics.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10">
            {searchQuery ? (
              <p>No classes found matching "{searchQuery}".</p>
            ) : (
              <p>You haven't created any classes yet.</p>
            )}
          </div>
        ) : (
          filteredClasses.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-headline text-xl pr-2">
                      {c.name}
                    </CardTitle>
                    <CardDescription>Class Code: {c.id}</CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                      >
                        <Trash2 className="size-4 text-destructive" />
                        <span className="sr-only">Delete class</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the class "{c.name}" and all
                          associated data. This action cannot be undone.
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
              <CardContent className="grid gap-4 flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{c.studentCount} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  <span>{c.pendingSubmissions} Submissions Pending</span>
                </div>
              </CardContent>
              <CardFooter className="flex items-center gap-2">
                <Button asChild className="flex-1">
                  <Link href={`/teacher/classes/${c.id}`}>
                    <DoorOpen className="mr-2 size-4" />
                    Enter Class
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyCode(c.id)}
                  aria-label="Copy class code"
                >
                  <Copy className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

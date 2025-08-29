'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { Users, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClassContext } from '@/contexts/class-context';

export default function ClassesPage() {
  const { classes } = useContext(ClassContext);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground">
          Manage your classes, students, and rubrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="font-headline">
                <Link href={`/teacher/classes/${c.id}`} className="hover:underline">{c.name}</Link>
              </CardTitle>
              <CardDescription>Class Code: {c.id}</CardDescription>
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

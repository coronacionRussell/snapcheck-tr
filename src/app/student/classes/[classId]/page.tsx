
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentClassActivities } from '@/components/student/student-class-activities';

interface ClassInfo {
  name: string;
  teacherName: string;
}

export default function StudentClassDetailsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;

      try {
        setIsLoading(true);
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);

        if (!classDoc.exists()) {
          throw new Error('Class not found.');
        }
        setClassInfo(classDoc.data() as ClassInfo);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (isLoading) {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-96" />
        </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
          <p className="text-destructive font-bold text-lg">{error}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/student/classes">
              <ArrowLeft className="mr-2" />
              Back to Classes
            </Link>
          </Button>
      </div>
    )
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" asChild>
            <Link href="/student/classes">
              <ArrowLeft className="mr-2" />
              Back to My Classes
            </Link>
          </Button>
          <h1 className="font-headline mt-4 text-3xl font-bold">
            {classInfo?.name || 'Loading class...'}
          </h1>
          <p className="text-xl text-muted-foreground">
            Taught by: {classInfo?.teacherName || '...'}
          </p>
          <p className="text-muted-foreground mt-2">
            View activities and submissions for this class.
          </p>
        </div>
      </div>

       <StudentClassActivities classId={classId} />
    </div>
  );
}

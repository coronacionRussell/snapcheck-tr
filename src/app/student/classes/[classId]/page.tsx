
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentClassActivities } from '@/components/student/student-class-activities';
import { useParams } from 'next/navigation';

interface ClassInfo {
  name: string;
  teacherName: string;
}

function ClassDetailsLoading() {
    return (
        <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
            <Skeleton className="h-10 w-48" />
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-96" />
            </div>
             <div className="mt-4">
                <Skeleton className="h-72 w-full" />
            </div>
        </div>
    )
}

export default function StudentClassDetailsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;

      if (!db) {
        setError("Database connection is not available. Please try again later.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);

        if (!classDoc.exists()) {
          setError('Class not found.');
        } else {
          setClassInfo(classDoc.data() as ClassInfo);
        }

      } catch (err: any) {
        console.error(err);
        setError('Failed to load class data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  if (isLoading) {
    return <ClassDetailsLoading />
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
  
  if (!classInfo) {
    return <ClassDetailsLoading />;
  }

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" asChild>
            <Link href="/student/classes">
              <ArrowLeft className="mr-2" />
              Back to My Classes
            </Link>
          </Button>
          <h1 className="font-headline mt-4 text-3xl font-bold">
            {classInfo.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            Taught by: {classInfo.teacherName}
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

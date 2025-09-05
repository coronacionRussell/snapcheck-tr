
'use client';

import Link from 'next/link';
import { RubricEditor } from '@/components/teacher/rubric-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ClassSubmissions } from '@/components/teacher/class-submissions';
import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassRoster } from '@/components/teacher/class-roster';
import { ClassActivities } from '@/components/teacher/class-activities';

interface ClassInfo {
  name: string;
}

export default function ClassDetailsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [initialRubric, setInitialRubric] = useState<string>('');
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

        const rubricDocRef = doc(db, 'rubrics', classId);
        const rubricDoc = await getDoc(rubricDocRef);
        if (rubricDoc.exists()) {
            setInitialRubric(rubricDoc.data().content);
        } else {
            setInitialRubric('No rubric found for this class. Create one below.');
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

  const handleRubricSaved = (newRubric: string) => {
    setInitialRubric(newRubric);
  }

  if (isLoading) {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-96" />
            <div className="mt-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="mt-4 h-64 w-full" />
            </div>
        </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
          <p className="text-destructive font-bold text-lg">{error}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/teacher/classes">
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
            <Link href="/teacher/classes">
              <ArrowLeft className="mr-2" />
              Back to Classes
            </Link>
          </Button>
          <h1 className="font-headline mt-4 text-3xl font-bold">
            {classInfo?.name || 'Loading class...'}
          </h1>
          <p className="text-muted-foreground">
            Manage your class rubric, view student roster, and track
            submissions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="rubric">Grading Rubric</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="mt-4">
          <ClassSubmissions classId={classId} className={classInfo?.name || ''} rubric={initialRubric} />
        </TabsContent>
        <TabsContent value="activities" className="mt-4">
          <ClassActivities classId={classId} />
        </TabsContent>
         <TabsContent value="roster" className="mt-4">
          <ClassRoster classId={classId} />
        </TabsContent>
        <TabsContent value="rubric" className="mt-4">
          <RubricEditor classId={classId} initialRubric={initialRubric} onRubricSaved={handleRubricSaved} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

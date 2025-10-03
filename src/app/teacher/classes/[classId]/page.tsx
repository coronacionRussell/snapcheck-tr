'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import { ClassRoster } from '@/components/teacher/class-roster';
import { ClassActivities } from '@/components/teacher/class-activities';
import { ClassSubmissions } from '@/components/teacher/class-submissions';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'; // Import Badge component

interface ClassInfo {
  name: string;
}

function ClassDetailsLoading() {
  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-72 w-full" />
      </div>
    </div>
  );
}

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);

  useEffect(() => {
    if (!classId) return;

    const fetchClassData = async () => {
      if (!db) {
        console.error("Firestore db object is not available.");
        setError("Could not connect to the database. Please check your Firebase configuration.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const classDocRef = doc(db, 'classes', classId);
        const classDoc = await getDoc(classDocRef);

        if (!classDoc.exists()) {
          setError('Class not found.');
        } else {
          setClassInfo(classDoc.data() as ClassInfo);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load class data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    const setupPendingSubmissionsListener = () => {
      if (!db) return;

      const submissionsCollection = collection(db, 'classes', classId, 'submissions');
      const q = query(submissionsCollection, where('status', '==', 'Pending Review'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        setPendingSubmissionsCount(querySnapshot.size);
      }, (err) => {
        console.error("Error fetching pending submissions count: ", err);
      });

      return unsubscribe;
    };

    fetchClassData();
    const unsubscribeFromPendingSubmissions = setupPendingSubmissionsListener();

    return () => {
      unsubscribeFromPendingSubmissions && unsubscribeFromPendingSubmissions();
    };
  }, [classId]);

  if (isLoading) {
    return <ClassDetailsLoading />;
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
    );
  }

  if (!classInfo) {
    return <ClassDetailsLoading />;
  }

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" asChild>
            <Link href="/teacher/classes">
              <ArrowLeft className="mr-2" />
              Back to Classes
            </Link>
          </Button>
          <h1 className="font-headline mt-4 text-3xl font-bold">
            {classInfo?.name || 'Loading Class...'}
          </h1>
          <p className="text-muted-foreground">
            Manage your class rubric, view student roster, and track
            submissions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="submissions">
            All Submissions
            {pendingSubmissionsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingSubmissionsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="mt-4">
          <ClassActivities classId={classId} />
        </TabsContent>
         <TabsContent value="submissions" className="mt-4">
           {classInfo && <ClassSubmissions classId={classId} className={classInfo.name} />}
        </TabsContent>
         <TabsContent value="roster" className="mt-4">
          <ClassRoster classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

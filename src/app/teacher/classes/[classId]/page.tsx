
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { ClassRoster } from '@/components/teacher/class-roster';
import { ClassActivities } from '@/components/teacher/class-activities';
import { ClassSubmissions } from '@/components/teacher/class-submissions';

interface ClassInfo {
  name: string;
}

// This is now an async Server Component
export default async function ClassDetailsPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  let classInfo: ClassInfo | null = null;
  let error: string | null = null;

  try {
    const classDocRef = doc(db, 'classes', classId);
    const classDoc = await getDoc(classDocRef);

    if (!classDoc.exists()) {
      // Use Next.js notFound() for 404 pages
      notFound();
    }
    classInfo = classDoc.data() as ClassInfo;

  } catch (err: any) {
    console.error(err);
    // In case of a server error during fetch
    error = "Failed to load class data. Please try again later.";
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
            {classInfo?.name || 'Loading class...'}
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
          <TabsTrigger value="submissions">All Submissions</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="mt-4">
          <ClassActivities classId={classId} />
        </TabsContent>
         <TabsContent value="submissions" className="mt-4">
           <ClassSubmissions classId={classId} className={classInfo?.name || ''} />
        </TabsContent>
         <TabsContent value="roster" className="mt-4">
          <ClassRoster classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { FilePenLine } from 'lucide-react';

export interface Activity {
    id: string;
    name: string;
    description: string;
    rubric: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    submissionStatus: 'Submitted' | 'Not Submitted';
}

export function StudentClassActivities({ classId }: { classId: string }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId || !user) return;

    setIsLoading(true);
    const activitiesCollection = collection(db, 'classes', classId, 'activities');
    const q = query(activitiesCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const studentSubmissionsQuery = query(
            collection(db, 'classes', classId, 'submissions'),
            where('studentId', '==', user.uid)
        );
        const studentSubmissionsSnapshot = await getDocs(studentSubmissionsQuery);
        const submittedActivityIds = new Set(studentSubmissionsSnapshot.docs.map(doc => doc.data().activityId));

        const activityData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                submissionStatus: submittedActivityIds.has(doc.id) ? 'Submitted' : 'Not Submitted',
            }
        }) as Activity[];
        setActivities(activityData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching activities: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [classId, user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Class Activities</CardTitle>
        <CardDescription>
          A list of all activities and assignments for this class. Click to expand and see details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
             </div>
        ) : activities.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
                {activities.map((activity) => (
                    <AccordionItem value={activity.id} key={activity.id}>
                        <div className="flex w-full items-center justify-between rounded-md pr-4 hover:bg-muted/50">
                           <AccordionTrigger className="flex-1 p-4 text-left hover:no-underline">
                               <div>
                                   <p className="font-semibold">{activity.name}</p>
                                   <p className="text-sm text-muted-foreground">
                                        Created on: {activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </p>
                               </div>
                           </AccordionTrigger>
                            <div className="pl-4">
                                <Badge variant={activity.submissionStatus === 'Submitted' ? 'default' : 'secondary'} className={activity.submissionStatus === 'Submitted' ? 'bg-primary/80' : ''}>
                                    {activity.submissionStatus}
                                </Badge>
                           </div>
                       </div>
                        <AccordionContent>
                           <div className="space-y-4 border-t p-4">
                                <div>
                                    <h4 className="mb-1 text-base font-semibold">Description</h4>
                                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{activity.description}</p>
                                </div>
                                <div>
                                    <h4 className="mb-1 text-base font-semibold">Grading Rubric</h4>
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border bg-secondary p-4 text-secondary-foreground">
                                        {activity.rubric}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button asChild>
                                        <Link href={`/student/submit-essay?activityId=${activity.id}`}>
                                            <FilePenLine className="mr-2" />
                                            Start Submission
                                        </Link>
                                    </Button>
                                </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        ) : (
            <div className="py-8 text-center">
                <p className="text-muted-foreground">No activities have been posted for this class yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

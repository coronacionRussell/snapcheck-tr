
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
import { collection, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { CreateActivityDialog } from './create-activity-dialog';
import { ManageActivityDialog } from './manage-activity-dialog';
import { ActivitySubmissionStatus } from './activity-submission-status';

export interface SubmissionForActivity {
    studentId: string;
    studentName: string;
    status: 'Pending Review' | 'Graded';
}

export interface Activity {
    id: string;
    name: string;
    description: string;
    rubric: string;
    submissions: SubmissionForActivity[];
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export function ClassActivities({ classId }: { classId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    setIsLoading(true);
    const activitiesCollection = collection(db, 'classes', classId, 'activities');
    const q = query(activitiesCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        
        const activityPromises = querySnapshot.docs.map(async (doc) => {
            const activityData = doc.data();
            
            const submissionsQuery = query(collection(db, 'classes', classId, 'submissions'), where('activityId', '==', doc.id));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissions = submissionsSnapshot.docs.map(subDoc => subDoc.data() as SubmissionForActivity);

            return { 
                id: doc.id, 
                ...activityData,
                submissions,
            } as Activity;
        });

        const activityData = await Promise.all(activityPromises);
        setActivities(activityData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching activities: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="font-headline">Class Activities & Rubrics</CardTitle>
            <CardDescription>
            Create and manage assignments. Click an activity to see submission status.
            </CardDescription>
        </div>
        <CreateActivityDialog classId={classId} />
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
                        <div className="flex w-full items-center justify-between pr-4 hover:bg-muted/50 rounded-md">
                           <AccordionTrigger className="flex-1 text-left p-4 hover:no-underline">
                               <div>
                                   <p className="font-semibold">{activity.name}</p>
                                   <p className="text-sm text-muted-foreground">
                                     Created on: {activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                   </p>
                               </div>
                           </AccordionTrigger>
                            <div className="flex items-center gap-4 pl-4">
                                <p className="text-sm font-medium text-muted-foreground shrink-0">{activity.submissions.length} Submissions</p>
                                <ManageActivityDialog classId={classId} activity={activity} />
                           </div>
                       </div>
                        <AccordionContent>
                            <div className="border-t p-4 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-base mb-1">Description / Questions</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
                                </div>
                                <ActivitySubmissionStatus classId={classId} activityId={activity.id} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        ) : (
            <div className="py-8 text-center">
                <p className="text-muted-foreground">No activities have been created for this class yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

    
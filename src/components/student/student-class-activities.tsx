
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export interface Activity {
    id: string;
    name: string;
    description: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    submissionStatus: 'Submitted' | 'Not Submitted';
}

interface Submission {
    activityId: string;
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
          A list of all activities and assignments for this class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4}>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>
                    {activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                      <Badge variant={activity.submissionStatus === 'Submitted' ? 'default' : 'secondary'} className={activity.submissionStatus === 'Submitted' ? 'bg-primary/80' : ''}>
                          {activity.submissionStatus}
                      </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No activities have been posted for this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

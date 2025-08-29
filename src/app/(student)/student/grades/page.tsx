
'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Grade {
  id: string;
  assignment: string;
  class: string;
  grade: string;
  status: 'Graded' | 'Pending Review';
}


export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const studentId = 'student-alex-doe';

        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const gradesData: Grade[] = [];

        for (const classDoc of classesSnapshot.docs) {
          const studentSubcollectionDoc = await getDoc(doc(db, `classes/${classDoc.id}/students`, studentId));

          if(studentSubcollectionDoc.exists()){
             const submissionsQuery = query(
              collection(db, 'classes', classDoc.id, 'submissions'),
              where('studentId', '==', studentId)
            );

            const submissionsSnapshot = await getDocs(submissionsQuery);
            submissionsSnapshot.forEach(submissionDoc => {
                const data = submissionDoc.data();
                gradesData.push({
                    id: submissionDoc.id,
                    assignment: 'Essay Submission',
                    class: classDoc.data().name,
                    grade: data.grade || '-',
                    status: data.status,
                });
            });
          }
        }
        setGrades(gradesData);
      } catch (error) {
        console.error("Error fetching grades: ", error);
        toast({
          title: 'Error',
          description: 'Could not fetch your grades.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [toast]);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">My Grades</h1>
        <p className="text-muted-foreground">
          An overview of all your submitted and graded assignments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">All Grades</CardTitle>
          <CardDescription>
            A summary of all your grades across all classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : grades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">
                      {grade.assignment}
                    </TableCell>
                    <TableCell>{grade.class}</TableCell>
                    <TableCell className="font-semibold">{grade.grade}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          grade.status === 'Graded' ? 'default' : 'secondary'
                        }
                        className={
                          grade.status === 'Graded' ? 'bg-primary/80' : ''
                        }
                      >
                        {grade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>You do not have any grades yet.</p>
              <p className="text-sm">
                When your assignments are graded, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

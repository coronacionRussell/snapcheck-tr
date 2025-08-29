
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, Plus } from 'lucide-react';
import { JoinClassCard } from '@/components/student/join-class-card';

const enrolledClasses: any[] = [
  // {
  //   id: 'ENG101',
  //   name: 'English Literature 101',
  //   teacher: 'Mr. Harrison',
  // },
  // {
  //   id: 'WRI202',
  //   name: 'Advanced Composition',
  //   teacher: 'Ms. Davis',
  // },
];

const recentGrades = [
  {
    id: 'GRD001',
    assignment: 'Hamlet Analysis Essay',
    class: 'English Literature 101',
    grade: '88/100',
    status: 'Graded',
  },
  {
    id: 'GRD002',
    assignment: 'Rhetorical Strategies Paper',
    class: 'Advanced Composition',
    grade: '-',
    status: 'Pending',
  },
];

export default function StudentDashboard() {
  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, here is your academic summary.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledClasses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledClasses.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.teacher}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Enrolled</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>You are not enrolled in any classes yet.</p>
                  <p className="text-sm">Use the "Join a New Class" card to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <JoinClassCard />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Grades</CardTitle>
          <CardDescription>
            A summary of your recently graded assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {recentGrades.map((grade) => (
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
                      className={grade.status === 'Graded' ? 'bg-primary/80' : ''}
                    >
                      {grade.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

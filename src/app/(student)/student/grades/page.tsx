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

const grades: any[] = [
  // {
  //   id: 'GRD001',
  //   assignment: 'Hamlet Analysis Essay',
  //   class: 'English Literature 101',
  //   grade: '88/100',
  //   status: 'Graded',
  // },
  // {
  //   id: 'GRD002',
  //   assignment: 'Rhetorical Strategies Paper',
  //   class: 'Advanced Composition',
  //   grade: '-',
  //   status: 'Pending',
  // },
  // {
  //   id: 'GRD003',
  //   assignment: 'The Great Gatsby: Symbolism Essay',
  //   class: 'English Literature 101',
  //   grade: '92/100',
  //   status: 'Graded',
  // },
  // {
  //   id: 'GRD004',
  //   assignment: 'Research Proposal',
  //   class: 'Advanced Composition',
  //   grade: 'A-',
  //   status: 'Graded',
  // },
];

export default function StudentGradesPage() {
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
          {grades.length > 0 ? (
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

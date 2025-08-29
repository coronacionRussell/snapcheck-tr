
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
import { Badge } from '../ui/badge';

const MOCK_ROSTER: { [key: string]: any[] } = {
  ENG101: [
    { id: 'STU001', name: 'Alice Johnson', status: 'Graded', grade: '88/100' },
    { id: 'STU002', name: 'Charlie Brown', status: 'Pending Review' },
    { id: 'STU003', name: 'Diana Miller', status: 'Pending Review' },
    { id: 'STU004', name: 'Ethan Hunt', status: 'Not Submitted' },
    { id: 'STU005', name: 'Fiona Glenanne', status: 'Graded', grade: '95/100' },
  ],
  WRI202: [
    { id: 'STU006', name: 'Bob Williams', status: 'Pending Review' },
    { id: 'STU007', name: 'Grace Turner', status: 'Not Submitted' },
    { id: 'STU008', name: 'Henry White', status: 'Graded', grade: 'A-' },
  ],
  HIS301: [
    { id: 'STU009', name: 'Ivy Green', status: 'Not Submitted' },
    { id: 'STU010', name: 'Jack Black', status: 'Not Submitted' },
  ],
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Graded':
            return 'default';
        case 'Pending Review':
            return 'secondary';
        case 'Not Submitted':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function ClassRoster({ classId }: { classId: string }) {
  const roster = MOCK_ROSTER[classId] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Student Roster</CardTitle>
        <CardDescription>
          An overview of student submissions and grades for this class.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Submission Status</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.length > 0 ? (
              roster.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(student.status)}
                     className={getStatusVariant(student.status) === 'default' ? 'bg-primary/80' : ''}>
                        {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {student.grade || '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No students have enrolled in this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

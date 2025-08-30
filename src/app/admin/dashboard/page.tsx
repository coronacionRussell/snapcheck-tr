
import { TeacherVerificationTable } from '@/components/admin/teacher-verification-table';

export default function AdminDashboardPage() {

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage teacher accounts and verify their authenticity.
        </p>
      </div>
      <TeacherVerificationTable />
    </div>
  );
}

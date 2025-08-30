
'use client';

import { useAuth } from '@/hooks/use-auth';
import StudentLayout from './student/layout';
import TeacherLayout from './teacher/layout';
import AdminLayout from './admin/layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full">
          <Skeleton className="hidden md:block md:w-56" />
          <div className="flex-1 p-4">
              <Skeleton className="h-full w-full" />
          </div>
      </div>
    );
  }

  if (!user) {
    return null; // Or a redirect, but useAuth hook should handle it
  }

  if (user.role === 'student') {
    return <StudentLayout>{children}</StudentLayout>;
  }
  if (user.role === 'teacher') {
    return <TeacherLayout>{children}</TeacherLayout>;
  }
  if (user.role === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return null;
}

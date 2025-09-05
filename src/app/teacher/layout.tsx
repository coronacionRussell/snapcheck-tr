
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import TeacherSidebar from '@/components/teacher/teacher-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { TeacherProvider } from './teacher-provider';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationUploader } from '@/components/teacher/verification-uploader';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  return (
    <TeacherProvider>
      <SidebarProvider>
        <Sidebar>
          <TeacherSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-svh flex-col">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-4 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : user && user.role === 'teacher' && !user.isVerified ? (
                <VerificationUploader />
              ) : (
                children
              )}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherProvider>
  );
}

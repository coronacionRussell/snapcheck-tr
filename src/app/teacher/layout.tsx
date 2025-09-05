
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import TeacherSidebar from '@/components/teacher/teacher-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { TeacherProvider } from './teacher-provider';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherProvider>
  );
}

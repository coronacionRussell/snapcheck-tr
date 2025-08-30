
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import StudentSidebar from '@/components/student/student-sidebar';
import DashboardHeader from '@/components/dashboard-header';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <StudentSidebar />
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
  );
}

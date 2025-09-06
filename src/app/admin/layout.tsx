
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh">
       <Image
        src="https://i.imgur.com/lmWAjyU.png"
        alt="Abstract background"
        fill
        className="object-cover"
        data-ai-hint="abstract background"
      />
      <div className="absolute inset-0 bg-background/80 z-10" />
      <div className="relative z-20">
        <SidebarProvider>
          <Sidebar>
            <AdminSidebar />
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
      </div>
    </div>
  );
}

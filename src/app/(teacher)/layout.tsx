'use client';

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import TeacherSidebar from '@/components/teacher/teacher-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { ClassContext, initialClasses } from '@/contexts/class-context';
import { Class } from '@/components/teacher/create-class-dialog';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [classes, setClasses] = useState<Class[]>(initialClasses);

  const handleClassCreated = (newClass: Class) => {
    setClasses((prevClasses) => [...prevClasses, newClass]);
  };

  return (
    <ClassContext.Provider value={{ classes, onClassCreated: handleClassCreated }}>
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
    </ClassContext.Provider>
  );
}

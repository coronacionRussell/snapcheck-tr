
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import TeacherSidebar from '@/components/teacher/teacher-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { TeacherProvider } from './teacher-provider';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function VerificationGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
  
    if (isLoading) {
      return (
        <div className="flex-1 overflow-y-auto p-4 pt-0 md:p-6 md:pt-0 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      );
    }
  
    if (user && !user.isVerified) {
      return (
        <main className="flex-1 overflow-y-auto p-4 pt-0 md:p-6 md:pt-0">
             <div className="flex flex-col items-center justify-center h-full">
                <Alert className="max-w-lg">
                    <Lock className="size-4"/>
                    <AlertTitle className="font-headline">Account Verification Pending</AlertTitle>
                    <AlertDescription>
                        Your account is currently awaiting verification from an administrator. You will not be able to access teacher features until your account has been approved. If you have any questions, please contact support.
                    </AlertDescription>
                </Alert>
             </div>
        </main>
      );
    }
  
    return (
        <main className="flex-1 overflow-y-auto p-4 pt-0 md:p-6 md:pt-0">
            {children}
        </main>
    );
}


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
             <VerificationGate>
                {children}
            </VerificationGate>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherProvider>
  );
}

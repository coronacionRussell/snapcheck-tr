
'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import TeacherSidebar from '@/components/teacher/teacher-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { TeacherProvider } from './teacher-provider';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VerificationGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    
    if (isLoading) {
        return (
            <div className="p-4 md:p-6">
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-64 mb-6" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    // If user is verified, or they are on the settings page, allow access
    if (user?.isVerified || pathname === '/teacher/settings') {
        return <>{children}</>;
    }

    // If user is not verified and not on the settings page, block access
    return (
        <div className="flex items-center justify-center h-full p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="size-12 text-primary" />
                    </div>
                    <CardTitle className="text-center font-headline">Verification Required</CardTitle>
                    <CardDescription className="text-center">
                        You must verify your account to access this page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Please go to the settings page to upload your verification documents. An administrator will review your submission shortly.
                    </p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/teacher/settings">Go to Settings</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
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
            <main className="flex-1 overflow-y-auto p-4 pt-0 md:p-6 md:pt-0">
              <VerificationGate>
                {children}
              </VerificationGate>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TeacherProvider>
  );
}

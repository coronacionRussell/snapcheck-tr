
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from './ui/skeleton';

export function UserNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    (async () => {
        try {
          await signOut(auth);
          router.push('/login');
          toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
          });
        } catch (error) {
          toast({
            title: 'Logout Failed',
            description: 'An error occurred while logging out.',
            variant: 'destructive',
          });
        }
    })();
  };

  if (isLoading) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">Login</Link>
      </Button>
    );
  }

  let settingsPath = '/';
  if (user.role === 'teacher') {
    settingsPath = '/teacher/settings';
  } else if (user.role === 'student') {
    settingsPath = '/student/settings';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarImage
              src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.fullName}`}
              alt="User avatar"
            />
            <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           {user.role === 'admin' ? (
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">
                <Shield className="mr-2 size-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
           ) : (
             <DropdownMenuItem asChild>
              <Link href={settingsPath}>
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
           )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

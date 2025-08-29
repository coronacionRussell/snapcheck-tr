
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full max-w-sm">
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="grid w-full grid-cols-2 gap-4">
          <Button asChild>
            <Link href="/student/dashboard">Login as Student</Link>
          </Button>
          <Button asChild>
            <Link href="/teacher/dashboard">Login as Teacher</Link>
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="underline hover:text-primary">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

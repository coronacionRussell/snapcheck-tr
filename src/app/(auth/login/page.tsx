
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.role === 'teacher' && !userData.isVerified) {
             toast({
                title: 'Verification Pending',
                description: "Your teacher account has not been approved by an administrator yet. You cannot log in until your account is verified.",
                variant: 'destructive',
                duration: 9000,
            });
             await signOut(auth);
             setIsLoading(false);
             return;
        }
        
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${userData.fullName}.`,
        });

        if (userData.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else if (userData.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      } else {
        // This case should ideally not happen if registration is done correctly
        throw new Error("User document not found in Firestore.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An unknown error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `An unexpected error occurred: ${error.message}`;
          break;
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full max-w-4xl">
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  return (
     <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-lg border bg-card shadow-lg md:grid-cols-2">
        <div className="relative aspect-square items-center justify-center flex">
             <Image
                src="https://i.imgur.com/BBYIJ4P.png"
                fill
                alt="Abstract branding image"
                className="object-cover"
                data-ai-hint="abstract logo"
                />
        </div>
        <Card className="border-0 shadow-none">
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
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 animate-spin" />}
               {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="underline hover:text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
     </div>
  );
}

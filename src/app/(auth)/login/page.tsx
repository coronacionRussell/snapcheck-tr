
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
        // This case can happen if Firestore doc creation failed during registration
        await signOut(auth);
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
          if (error.message === "User document not found in Firestore.") {
             errorMessage = "Your account record is incomplete. Please try registering again.";
          } else {
             errorMessage = `An unexpected error occurred: ${error.message}`;
          }
          break;
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-lg border bg-card shadow-lg md:grid-cols-2">
        <div className="relative hidden aspect-square items-center justify-center md:flex">
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
              <Logo className="[&>svg]:size-12 [&>span]:text-4xl" />
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
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
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

const LoginPageContentDynamic = dynamic(() => Promise.resolve(LoginPageContent), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2">
      <Skeleton className="hidden md:block h-[500px] w-full rounded-l-lg" />
      <div className="space-y-6 rounded-lg md:rounded-l-none border bg-card p-8 shadow-lg">
          <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-12 w-48" />
              <Skeleton className="mx-auto h-6 w-32" />
              <Skeleton className="mx-auto h-4 w-48" />
          </div>
          <div className="space-y-4">
              <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
              </div>
          </div>
          <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="mx-auto h-4 w-40" />
          </div>
      </div>
    </div>
  ),
});


export default function LoginPage() {
  return <LoginPageContentDynamic />;
}

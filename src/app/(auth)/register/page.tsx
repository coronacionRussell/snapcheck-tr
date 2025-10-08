
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function RegisterPageContent() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState(''); // New state for first name
  const [lastName, setLastName] = useState('');   // New state for last name
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();


  const handleCreateAccount = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const fullUserName = `${firstName} ${lastName}`; // Combine for full name

      const userData: any = {
        uid: user.uid,
        firstName, // Store first name separately
        lastName,  // Store last name separately
        fullName: fullUserName, // Store full name
        email,
        role,
      };

      if (role === 'student') {
        userData.isVerified = true;
        userData.enrolledClassIds = [];
      } else {
        userData.isVerified = false;
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      toast({
        title: 'Account Created!',
        description: "You've been successfully registered.",
      });

      if (role === 'teacher') {
          router.push('/teacher/dashboard');
      } else {
          router.push('/student/dashboard');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (userCredential) {
        try {
          await deleteUser(userCredential.user);
          console.log("Cleaned up orphaned auth user.");
        } catch (cleanupError) {
          console.error("Failed to clean up orphaned auth user:", cleanupError);
        }
      }

      let errorMessage = 'An unknown error occurred. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error: Could not connect to Firebase. Please check your internet connection and ensure your app\'s domain is added to the "Authorized domains" list in the Firebase console (Authentication > Settings > Authorized domains).';
            break;
        case 'auth/operation-not-allowed':
             errorMessage = 'Email/password sign-in is not enabled. Please enable it in the Firebase console (Authentication > Sign-in method).';
             break;
        default:
           const message = error instanceof Error ? error.message : String(error);
           errorMessage = `An unexpected error occurred: ${message}`;
           break;
      }
       toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-lg border border-green-700/50 bg-zinc-900 shadow-xl shadow-green-500/20 md:grid-cols-2">
        <div className="relative hidden aspect-square items-center justify-center md:flex">
           <Image
              src="https://i.imgur.com/BBYIJ4P.png"
              fill
              alt="Abstract branding image"
              className="object-cover opacity-30"
              data-ai-hint="abstract logo"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              />
        </div>
         <Card className="border-0 shadow-none bg-transparent text-gray-100">
            <>
              <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                  <Logo className="[&>svg]:size-12 [&>span]:text-4xl text-white" />
                </div>
                <CardTitle className="font-headline text-2xl text-white">Create an Account</CardTitle>
                <CardDescription className="text-gray-300">
                  Join SnapCheck to revolutionize your writing and grading.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first-name" className="text-gray-300">First Name</Label>
                        <Input 
                          id="first-name" 
                          placeholder="John" 
                          required 
                          value={firstName} 
                          onChange={(e) => setFirstName(e.target.value)} 
                          disabled={isLoading} 
                          className="bg-zinc-800 border-green-700/50 text-white focus:ring-green-500 focus:ring-2"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last-name" className="text-gray-300">Last Name</Label>
                        <Input 
                          id="last-name" 
                          placeholder="Doe" 
                          required 
                          value={lastName} 
                          onChange={(e) => setLastName(e.target.value)} 
                          disabled={isLoading} 
                          className="bg-zinc-800 border-green-700/50 text-white focus:ring-green-500 focus:ring-2"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={isLoading} 
                    className="bg-zinc-800 border-green-700/50 text-white focus:ring-green-500 focus:ring-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={isLoading} 
                        className="bg-zinc-800 border-green-700/50 text-white focus:ring-green-500 focus:ring-2"
                      />
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:bg-zinc-700 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                      >
                          {showPassword ? <EyeOff /> : <Eye />}
                          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                      </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-gray-300">I am a</Label>
                  <Select value={role} onValueChange={setRole} disabled={isLoading}>
                    <SelectTrigger id="role" className="bg-zinc-800 border-green-700/50 text-white focus:ring-green-500 focus:ring-2">
                      <SelectValue placeholder="Select your role" className="text-gray-300" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-green-700/50 text-white">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 animate-pulse-light"
                  onClick={handleCreateAccount} 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <div className="text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="underline text-green-400 hover:text-green-300">
                    Login
                  </Link>
                </div>
              </CardFooter>
            </>
        </Card>
      </div>
    </div>
  );
}


export default function RegisterPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-lg border border-green-700/50 bg-zinc-900 shadow-xl shadow-green-500/20">
          <Skeleton className="hidden md:block h-[620px] w-full rounded-l-lg bg-gray-800" />
          <div className="space-y-6 rounded-lg md:rounded-l-none bg-zinc-900 p-8">
              <div className="space-y-2 text-center">
                  <Skeleton className="mx-auto h-12 w-32 bg-gray-700" />
                  <Skeleton className="mx-auto h-6 w-48 bg-gray-700" />
                  <Skeleton className="mx-auto h-4 w-64 bg-gray-800" />
              </div>
              <div className="space-y-4">
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16 bg-gray-700" />
                      <Skeleton className="h-10 w-full bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-12 bg-gray-700" />
                      <Skeleton className="h-10 w-full bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-16 bg-gray-700" />
                      <Skeleton className="h-10 w-full bg-gray-800" />
                  </div>
                   <div className="space-y-2">
                      <Skeleton className="h-4 w-12 bg-gray-700" />
                      <Skeleton className="h-10 w-full bg-gray-800" />
                  </div>
              </div>
              <div className="space-y-4">
                  <Skeleton className="h-10 w-full bg-green-600" />
                  <Skeleton className="mx-auto h-4 w-44 bg-gray-800" />
              </div>
          </div>
        </div>
      </div>
    )
  }

  return <RegisterPageContent />;
}

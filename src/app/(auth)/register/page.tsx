
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
import { Loader2, UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegisterPage() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationId, setVerificationId] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCreateAccount = async () => {
    if (!fullName || !email || !password || (role === 'teacher' && !verificationId)) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let verificationIdUrl = '';
      if (role === 'teacher' && verificationId) {
        const storageRef = ref(storage, `teacher_verification/${user.uid}/${verificationId.name}`);
        const uploadResult = await uploadBytes(storageRef, verificationId);
        verificationIdUrl = await getDownloadURL(uploadResult.ref);
      }

      const userData = {
        uid: user.uid,
        fullName,
        email,
        role,
        isVerified: role === 'student', // Students are auto-verified
        ...(role === 'teacher' && { verificationIdUrl }),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      toast({
        title: 'Account Created!',
        description: "You've been successfully registered.",
      });
       if (role === 'teacher') {
         toast({
            title: 'Verification Pending',
            description: "Your account is pending verification from an administrator. You will be notified once it's approved.",
            duration: 7000,
        });
        await auth.signOut();
        router.push('/login');
      } else {
        router.push('/student/dashboard');
      }

    } catch (error: any) {
      console.error('Registration error:', error);
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
           errorMessage = `An unexpected error occurred: ${error.message}`;
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

  if (!isMounted) {
    return (
       <div className="w-full max-w-4xl">
        <Skeleton className="h-[620px] w-full" />
      </div>
    )
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
        <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join SnapCheck to revolutionize your writing and grading.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full-name">Full Name</Label>
          <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">I am a</Label>
          <Select value={role} onValueChange={setRole} disabled={isLoading}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {role === 'teacher' && (
            <div className="grid gap-2">
                <Label htmlFor="verification-id">Verification ID</Label>
                 <div className="relative">
                    <UploadCloud className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="verification-id" type="file" accept="image/*" className="pl-10" onChange={(e) => setVerificationId(e.target.files?.[0] || null)} required disabled={isLoading} />
                </div>
                <p className="text-xs text-muted-foreground">Please upload an image of your teaching ID for verification.</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button className="w-full" onClick={handleCreateAccount} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 animate-spin" />}
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline hover:text-primary">
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
    </div>
  );
}

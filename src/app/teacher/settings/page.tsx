
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VerificationUploader } from '@/components/teacher/verification-uploader';
import { ShieldCheck, ShieldX } from 'lucide-react';


function TeacherSettingsLoading() {
    return (
      <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="mt-1 h-4 w-52" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-1 h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-1 h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                </div>
            </CardContent>
          </Card>
           <div className="flex justify-end">
             <Skeleton className="h-10 w-32" />
           </div>
        </div>
      </div>
    );
}


export default function TeacherSettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.fullName);
      setEmail(user.email);
      // Mocked preferences for now
      setEmailNotifications(true);
      setWeeklySummary(false);
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if (!user) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
        toast({ title: "Name cannot be empty", variant: 'destructive' });
        return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: name,
      });
      console.log('Saving settings:', { name, email, emailNotifications, weeklySummary });
      toast({
        title: 'Settings Saved',
        description: 'Your profile and notification preferences have been updated.',
      });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({ title: "Error", description: "Could not save your settings.", variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading) {
    return <TeacherSettingsLoading />
  }

  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and notification preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Account Status</CardTitle>
            <CardDescription>
                Your current account verification status.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {user && !user.isVerified && !user.verificationIdUrl && (
                <VerificationUploader />
             )}
             {user && !user.isVerified && user.verificationIdUrl && (
                <div className="flex items-center gap-4 rounded-lg border border-amber-500/50 bg-amber-50/50 p-4 text-amber-800">
                    <ShieldX className="size-8" />
                    <div>
                        <p className="font-semibold">Verification Pending</p>
                        <p className="text-sm">Your submitted ID is currently under review by an administrator.</p>
                    </div>
                </div>
             )}
             {user && user.isVerified && (
                 <div className="flex items-center gap-4 rounded-lg border border-primary/50 bg-primary/10 p-4 text-primary">
                    <ShieldCheck className="size-8" />
                    <div>
                        <p className="font-semibold">Account Verified</p>
                        <p className="text-sm">You have full access to all teacher features.</p>
                    </div>
                </div>
             )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Profile</CardTitle>
            <CardDescription>
              This is how your name will be displayed in the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled readOnly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Notifications</CardTitle>
            <CardDescription>
              Choose how you want to be notified about student submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive an email when a student submits a new essay.
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={isSaving} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Get a weekly email summarizing class activity.
                </p>
              </div>
              <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} disabled={isSaving}/>
            </div>
          </CardContent>
        </Card>

         <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </div>
    </div>
  );
}

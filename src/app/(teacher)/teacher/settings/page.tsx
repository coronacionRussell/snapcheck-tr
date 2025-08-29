
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function TeacherSettingsPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);

  // Set initial values on client-side to avoid hydration mismatch
  useEffect(() => {
    setName('Ms. Davis');
    setEmail('teacher.davis@example.com');
    setEmailNotifications(true);
    setWeeklySummary(false);
  }, []);

  const handleSaveChanges = () => {
    // In a real app, you'd save these settings to Firestore or a backend.
    console.log('Saving settings:', { name, email, emailNotifications, weeklySummary });
    toast({
      title: 'Settings Saved',
      description: 'Your profile and notification preferences have been updated.',
    });
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and notification preferences.
        </p>
      </div>

      <div className="grid gap-6">
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
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Get a weekly email summarizing class activity.
                </p>
              </div>
              <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
            </div>
          </CardContent>
        </Card>

         <div className="flex justify-end">
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2" />
                Save Changes
            </Button>
        </div>
      </div>
    </div>
  );
}

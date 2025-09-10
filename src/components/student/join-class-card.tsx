
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

interface JoinClassCardProps {
  onClassJoined: () => void;
}

export function JoinClassCard({ onClassJoined }: JoinClassCardProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [classCode, setClassCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleJoinClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "Not authenticated", variant: 'destructive' });
        return;
    }
    if (!classCode.trim()) {
      toast({
        title: 'Class Code Required',
        description: 'Please enter a class code to join.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const classRef = doc(db, 'classes', classCode.trim());
      const classDoc = await getDoc(classRef);

      if (!classDoc.exists()) {
        toast({
          title: 'Invalid Class Code',
          description:
            'The class code you entered does not exist. Please check with your teacher.',
          variant: 'destructive',
        });
        return;
      }

      const studentId = user.uid; 
      const studentName = user.fullName;

      const studentRef = doc(db, `classes/${classCode.trim()}/students`, studentId);
      const studentDoc = await getDoc(studentRef);

      if (studentDoc.exists()) {
        toast({
            title: 'Already Enrolled',
            description: 'You are already enrolled in this class.',
        });
        return;
      }

      const batch = writeBatch(db);
      
      // Add student to the students subcollection
      batch.set(studentRef, {
        name: studentName,
        joinedAt: serverTimestamp(),
      });

      // Increment the studentCount on the class document
      batch.update(classRef, {
        studentCount: increment(1),
      });

      await batch.commit();

      toast({
        title: 'Success!',
        description: `You have successfully joined the class "${classDoc.data().name}".`,
      });

      setClassCode('');
      onClassJoined();

    } catch (error) {
      console.error('Error joining class:', error);
      toast({
        title: 'Error',
        description: 'Could not join the class. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isDisabled = isLoading || isAuthLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Join a New Class</CardTitle>
        <CardDescription>
          Enter the code provided by your teacher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoinClass}>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Class Code"
              className="font-code tracking-wider"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              disabled={isDisabled}
            />
            <Button type="submit" disabled={isDisabled}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Join
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

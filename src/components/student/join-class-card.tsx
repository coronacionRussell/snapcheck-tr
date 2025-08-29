'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function JoinClassCard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Join a New Class</CardTitle>
        <CardDescription>
          Enter the code provided by your teacher.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Class Code"
              className="font-code tracking-wider"
            />
            <Button type="submit">
              <Plus className="mr-2 size-4" /> Join
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

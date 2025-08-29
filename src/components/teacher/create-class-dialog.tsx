
'use client';

import { useState } from 'react';
import { PlusCircle, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Class } from '@/contexts/class-context';

type CreateClassDialogProps = {
  onClassCreated: (
    newClass: Omit<Class, 'id' | 'studentCount' | 'pendingSubmissions'>
  ) => Promise<Class | null>;
};

export function CreateClassDialog({ onClassCreated }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [createdClass, setCreatedClass] = useState<Class | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateClass = async () => {
    if (!className.trim()) {
      toast({
        title: 'Error',
        description: 'Class name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    setIsCreating(true);
    try {
      const result = await onClassCreated({ name: className });
      if (result) {
        setCreatedClass(result);
      }
    } catch (error) {
        // Error is already toasted in the layout
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (createdClass?.id) {
      navigator.clipboard.writeText(createdClass.id);
      toast({
        title: 'Copied!',
        description: 'Class code copied to clipboard.',
      });
    }
  };

  const handleCloseAndReset = () => {
    setOpen(false);
    // Reset state after a short delay to allow dialog to close gracefully
    setTimeout(() => {
      setClassName('');
      setCreatedClass(null);
      setIsCreating(false);
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCloseAndReset();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 size-4" />
          Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if (isCreating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-headline">
            {createdClass ? 'Class Created!' : 'Create a new class'}
          </DialogTitle>
          <DialogDescription>
            {createdClass
              ? 'Share the unique code below with your students to let them join.'
              : 'Enter a name for your class. A unique code will be generated for your students to join.'}
          </DialogDescription>
        </DialogHeader>
        {createdClass ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 rounded-lg border bg-secondary p-4">
              <p className="flex-1 font-mono text-2xl tracking-widest">
                {createdClass.id}
              </p>
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                <Copy className="size-4" />
                <span className="sr-only">Copy code</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class-name" className="text-right">
                Class Name
              </Label>
              <Input
                id="class-name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., English 101"
                className="col-span-3"
                disabled={isCreating}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {createdClass ? (
            <Button onClick={handleCloseAndReset}>Done</Button>
          ) : (
            <Button onClick={handleCreateClass} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Class'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

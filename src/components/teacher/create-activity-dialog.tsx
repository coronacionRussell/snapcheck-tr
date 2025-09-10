
'use client';

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';

interface CreateActivityDialogProps {
  classId: string;
}

const defaultRubric = `Thesis Statement (25pts)
- Clear, concise, and arguable.

Supporting Evidence (50pts)
- Relevant, well-explained, and properly cited.

Conclusion (25pts)
- Summarizes main points and provides a final thought.`;

export function CreateActivityDialog({ classId }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateActivity = async () => {
    if (!activityName.trim() || !description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both an activity name and a description.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreating(true);
    try {
        const activitiesCollection = collection(db, 'classes', classId, 'activities');
        await addDoc(activitiesCollection, {
            name: activityName,
            description: description,
            createdAt: serverTimestamp(),
            rubric: defaultRubric,
        });
        
        toast({
            title: 'Activity Created!',
            description: `The activity "${activityName}" has been successfully created with a default rubric.`,
        });

        handleCloseAndReset();

    } catch (error) {
        console.error("Error creating activity: ", error);
        toast({
            title: "Error",
            description: "Could not create the activity.",
            variant: "destructive",
        });
    } finally {
        setIsCreating(false);
    }
  };

  const handleCloseAndReset = () => {
    setOpen(false);
    setActivityName('');
    setDescription('');
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            handleCloseAndReset();
        } else {
            setOpen(true);
        }
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 size-4" />
          New Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          if (isCreating) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="font-headline">
            Create a New Activity
          </DialogTitle>
          <DialogDescription>
            Enter the details for your new activity or assignment. A default rubric will be created for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="activity-name">Activity Name</Label>
                <Input
                    id="activity-name"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="e.g., The Great Gatsby Essay"
                    disabled={isCreating}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="activity-description">Description</Label>
                <Textarea
                    id="activity-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Write a 5-paragraph essay analyzing the main themes..."
                    disabled={isCreating}
                    rows={4}
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleCloseAndReset} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateActivity} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isCreating ? 'Creating...' : 'Create Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

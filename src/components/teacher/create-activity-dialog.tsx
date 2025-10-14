
'use client';

import { useState } from 'react';
import { PlusCircle, Loader2, CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateActivityDialogProps {
  classId: string;
}

const defaultRubric = `## Part 1: Standard Writing Criteria

### Thesis & Argument (30 points)
- **Clarity & Focus (15pts):** The thesis is clear, specific, and presents a strong, arguable claim.
- **Consistency (15pts):** The essay consistently supports the thesis throughout the body paragraphs.

### Evidence & Analysis (40 points)
- **Use of Evidence (20pts):** Evidence is relevant, credible, and effectively integrated.
- **Depth of Analysis (20pts):** The analysis explains how the evidence supports the thesis and doesn't just summarize.

### Structure & Organization (20 points)
- **Logical Flow (10pts):</b The paragraphs are logically sequenced, and transitions are smooth.
- **Conclusion (10pts):** The conclusion effectively summarizes the argument and offers a final insight.

### Grammar & Style (10 points)
- **Clarity & Mechanics (10pts):** The writing is free of major grammatical errors, spelling mistakes, and typos.

---

## Part 2: Essay-Specific Questions
*(Replace this section with your specific assignment questions or criteria)*

- **Question 1 (e.g., 10 points):** Does the essay adequately address the historical context of the event?
- **Question 2 (e.g., 10 points):** How well does the author analyze the protagonist's motivations?
`;

export function CreateActivityDialog({ classId }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [totalPoints, setTotalPoints] = useState<number>(100); // New state for total points
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
            deadline: deadline || null,
            totalPoints: totalPoints, // Include totalPoints
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
    setDeadline(undefined);
    setTotalPoints(100); // Reset total points
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
                <Label htmlFor="activity-description">Description / Questions</Label>
                <Textarea
                    id="activity-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Write a 5-paragraph essay analyzing the main themes..."
                    disabled={isCreating}
                    rows={4}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total-points">Total Points</Label>
              <Input
                id="total-points"
                type="number"
                value={totalPoints}
                onChange={(e) => setTotalPoints(Number(e.target.value))}
                placeholder="e.g., 100"
                disabled={isCreating}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                    disabled={isCreating}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : <span className="text-gray-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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


'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Activity } from './class-activities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface ManageActivityDialogProps {
  classId: string;
  activity: Activity;
}

export function ManageActivityDialog({ classId, activity }: ManageActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityName, setActivityName] = useState(activity.name);
  const [description, setDescription] = useState(activity.description);
  const [rubric, setRubric] = useState(activity.rubric);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    if (!activityName.trim() || !description.trim()) {
      toast({ title: 'Missing Information', description: 'Name and description are required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const activityRef = doc(db, 'classes', classId, 'activities', activity.id);
      await updateDoc(activityRef, {
        name: activityName,
        description: description,
        rubric: rubric,
      });
      toast({ title: 'Activity Updated', description: 'Your changes have been saved successfully.' });
      setOpen(false);
    } catch (error) {
      console.error('Error updating activity: ', error);
      toast({ title: 'Error', description: 'Could not update the activity.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    setIsDeleting(true);
    try {
        const activityRef = doc(db, 'classes', classId, 'activities', activity.id);
        await deleteDoc(activityRef);
        toast({ title: 'Activity Deleted', description: `"${activity.name}" has been deleted.` });
        setOpen(false);
    } catch (error) {
        console.error("Error deleting activity: ", error);
        toast({ title: "Error", description: 'Could not delete the activity.', variant: 'destructive'});
    } finally {
        setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>Manage</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Manage Activity</DialogTitle>
          <DialogDescription>
            Edit the details and rubric for this activity.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[70vh] gap-6 overflow-y-auto p-1">
            <div className="space-y-2">
                <Label htmlFor="activity-name">Activity Name</Label>
                <Input
                    id="activity-name"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    disabled={isSaving}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="activity-description">Description</Label>
                <Textarea
                    id="activity-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    rows={3}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="activity-rubric">Grading Rubric</Label>
                <Textarea
                    id="activity-rubric"
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    disabled={isSaving}
                    rows={10}
                    className="font-code"
                />
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSaving || isDeleting} onClick={(e) => e.stopPropagation()}>
                        {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2"/>}
                        Delete Activity
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the activity "{activity.name}" and its rubric. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteActivity()} className="bg-destructive hover:bg-destructive/90">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          <Button onClick={handleSaveChanges} disabled={isSaving || isDeleting}>
            {isSaving && <Loader2 className="mr-2 animate-spin" />}
            <Save className="mr-2"/>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

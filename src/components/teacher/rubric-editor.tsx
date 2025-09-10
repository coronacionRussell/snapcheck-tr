
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RubricEditorProps {
  classId: string;
  activityId: string;
  initialRubric: string;
  onRubricSaved: (newRubric: string) => void;
}


export function RubricEditor({ classId, activityId, initialRubric, onRubricSaved }: RubricEditorProps) {
  const [rubricText, setRubricText] = useState(initialRubric);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const activityRef = doc(db, 'classes', classId, 'activities', activityId);
      await updateDoc(activityRef, { rubric: rubricText });

      onRubricSaved(rubricText);
      toast({
        title: 'Rubric Saved',
        description: `The rubric for this activity has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error saving rubric: ', error);
      toast({
        title: 'Error',
        description: 'Could not save the rubric. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Grading Rubric</CardTitle>
        <CardDescription>
          Define the criteria for grading this activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rubric-editor-textarea">Rubric Details</Label>
          <Textarea
            id="rubric-editor-textarea"
            value={rubricText}
            onChange={(e) => setRubricText(e.target.value)}
            rows={12}
            className="font-code"
            placeholder="Enter your rubric here. e.g., Criterion 1 (25pts): Description..."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

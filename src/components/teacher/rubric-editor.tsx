'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export function RubricEditor({ classId, initialRubric }: { classId: string; initialRubric: string }) {
  const [rubricText, setRubricText] = useState(initialRubric);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // In a real app, you would save this to your database, associated with the classId.
    // We'll simulate a save with a timeout.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Rubric Saved',
      description: `The rubric for class ${classId} has been updated successfully.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Grading Rubric</CardTitle>
        <CardDescription>
          Define the criteria for grading essays in this class. Your changes will be reflected in the student's submission portal.
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
            <Save className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

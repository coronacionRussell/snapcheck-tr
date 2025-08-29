
'use client';
import { useState } from 'react';
import { PlusCircle, Copy } from 'lucide-react';
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

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const { toast } = useToast();

  const handleCreateClass = () => {
    if (!className.trim()) {
      toast({
        title: 'Error',
        description: 'Class name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    // Simulate code generation
    const code =
      'C' +
      Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: 'Copied!',
      description: 'Class code copied to clipboard.',
    });
  };
  
  const handleClose = () => {
    setOpen(false);
    setClassName('');
    setGeneratedCode('');
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 size-4" />
          Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Create a new class</DialogTitle>
          <DialogDescription>
            Enter a name for your class. A unique code will be generated for
            your students to join.
          </DialogDescription>
        </DialogHeader>
        {generatedCode ? (
          <div className="space-y-4 py-4">
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Class "{className}" created successfully!</p>
                <p className="mt-2 text-sm text-muted-foreground">Share this code with your students:</p>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border bg-secondary p-4">
                <p className="flex-1 font-mono text-2xl tracking-widest">{generatedCode}</p>
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
              />
            </div>
          </div>
        )}
        <DialogFooter>
          {generatedCode ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <Button onClick={handleCreateClass}>Create Class</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

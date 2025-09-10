
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export function VerificationUploader() {
  const { user } = useAuth();
  const [verificationId, setVerificationId] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpload = async () => {
    if (!user) {
        toast({ title: "Not authenticated", variant: 'destructive'});
        return;
    }
     if (!verificationId) {
      toast({
        title: 'No file selected',
        description: 'Please choose a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const storageRef = ref(storage, `teacher_verification/${user.uid}/${verificationId.name}`);
      const uploadResult = await uploadBytes(storageRef, verificationId);
      const verificationIdUrl = await getDownloadURL(uploadResult.ref);

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { verificationIdUrl });

      toast({
        title: 'ID Uploaded Successfully!',
        description: "Your document has been submitted for verification. An admin will review it shortly.",
      });
      
      // The useAuth hook should pick up the change, but we can refresh to be sure
      router.refresh();

    } catch (error) {
      console.error('Error uploading verification ID:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your ID. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            To get full access to teacher features, please upload a photo of your teaching ID or another form of verification.
        </p>
        <div className="grid gap-2">
            <Label htmlFor="verification-id">Verification Document</Label>
                <div className="relative">
                <UploadCloud className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="verification-id" type="file" accept="image/*,.pdf" className="pl-10" onChange={(e) => setVerificationId(e.target.files?.[0] || null)} required disabled={isLoading} />
            </div>
            <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, PDF.</p>
        </div>
        <Button onClick={handleUpload} disabled={isLoading || !verificationId}>
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? 'Uploading...' : 'Upload and Submit for Review'}
        </Button>
    </div>
  );
}

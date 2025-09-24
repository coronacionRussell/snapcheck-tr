
'use client';

import { Suspense } from 'react';
import { EssayScanner } from '@/components/teacher/essay-scanner';

// This component is now simplified. It only needs to render the EssayScanner.
function ScanEssayContent() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold">Create a New Submission</h1>
        <p className="text-muted-foreground">
          Create a new submission for a student by scanning a paper or pasting in text.
        </p>
      </div>

      <EssayScanner />
    </div>
  );
}


export default function ScanEssayPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ScanEssayContent />
        </Suspense>
    )
}

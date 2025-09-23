
'use client';

import { Suspense } from 'react';
import { EssayScanner } from '@/components/teacher/essay-scanner';

// This component is now simplified. It only needs to render the EssayScanner.
function ScanEssayContent() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold">Scan an Essay</h1>
        <p className="text-muted-foreground">
          Upload or capture a photo of a handwritten essay to digitize it instantly.
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

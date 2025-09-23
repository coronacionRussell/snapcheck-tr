
'use client';

import { Suspense } from 'react';
import { EssayScanner } from '@/components/teacher/essay-scanner';
import { useSearchParams } from 'next/navigation';

function ScanEssayContent() {
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const activityId = searchParams.get('activityId');
  const studentId = searchParams.get('studentId');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold">Scan an Essay</h1>
        <p className="text-muted-foreground">
          Upload or capture a photo of a handwritten essay to digitize it instantly.
        </p>
      </div>

      <EssayScanner
        preselectedClassId={classId}
        preselectedActivityId={activityId}
        preselectedStudentId={studentId}
      />
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

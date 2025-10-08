'use client';

import { BatchSubmissionScanner } from '@/components/teacher/batch-submission-scanner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ScanBatchSubmissionsPage() {
  return (
    <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" asChild>
          <Link href="/teacher/dashboard">
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <BatchSubmissionScanner />
    </div>
  );
}

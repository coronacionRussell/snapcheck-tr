
'use client';

import { Suspense } from 'react';
import { EssaySubmissionForm } from '@/components/student/essay-submission-form';
import { FileQuestion } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SubmitEssayContent() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get('activityId');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold">Submit an Essay</h1>
        <p className="text-muted-foreground">
          Use our AI tools to improve your essay, then submit it for grading.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EssaySubmissionForm preselectedActivityId={activityId} />
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileQuestion className="size-6" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold">
                  How it works
                </h3>
                <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>Select your class and activity.</li>
                  <li>
                    Upload a photo of your essay or paste the text.
                  </li>
                  <li>Use the "Analyze Grammar" button to check for errors.</li>
                  <li>Use the "Get Rubric Feedback" button for AI suggestions based on the rubric.</li>
                  <li>When you're ready, submit your essay for official grading.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitEssayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitEssayContent />
    </Suspense>
  );
}

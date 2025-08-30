
import { EssaySubmissionForm } from '@/components/student/essay-submission-form';
import { FileQuestion } from 'lucide-react';

export default function SubmitEssayPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold">Submit an Essay</h1>
        <p className="text-muted-foreground">
          Select your class, upload your essay, and get instant AI
          feedback based on your teacher's rubric.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EssaySubmissionForm />
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
                  <li>Select your class to load the grading rubric.</li>
                  <li>
                    Upload a clear photo of your handwritten essay or paste the
                    text.
                  </li>
                  <li>Our AI analyzes your text against the rubric.</li>
                  <li>Receive constructive feedback in seconds.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

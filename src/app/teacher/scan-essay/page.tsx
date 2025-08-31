
import { EssayScanner } from '@/components/teacher/essay-scanner';

export default function ScanEssayPage() {
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

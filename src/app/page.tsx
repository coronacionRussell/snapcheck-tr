
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Cpu,
  Feather,
  UploadCloud,
} from 'lucide-react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const features = [
    {
      icon: <UploadCloud className="size-8 text-primary" />,
      title: 'Seamless Essay Submission',
      description:
        'Easily upload essay photos. Our OCR technology converts them into digital text instantly.',
    },
    {
      icon: <Cpu className="size-8 text-primary" />,
      title: 'AI-Powered Feedback',
      description:
        'Receive insightful, rubric-based feedback to understand your strengths and areas for improvement.',
    },
    {
      icon: <CheckCircle className="size-8 text-primary" />,
      title: 'Automated Grading Assistance',
      description:
        'For teachers, our AI provides preliminary scores, streamlining the grading process.',
    },
    {
      icon: <BookOpen className="size-8 text-primary" />,
      title: 'Class Management',
      description:
        'Teachers can create classes with unique codes, making it easy for students to enroll and participate.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Logo />
            </Link>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Sign Up <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container grid grid-cols-1 items-center gap-12 text-center md:grid-cols-2 md:text-left">
            <div className="space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Instant Essay Feedback,
                <br />
                Powered by AI
              </h1>
              <p className="mx-auto max-w-[600px] text-lg text-muted-foreground md:mx-0">
                SnapCheck revolutionizes essay grading for students and
                teachers. Submit a photo of your essay and get instant,
                rubric-based feedback and preliminary scores.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get Started Free <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Login as Teacher</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://picsum.photos/seed/person-studying/600/400"
                width={600}
                height={400}
                alt="A person studying with books and a laptop"
                data-ai-hint="person studying"
                className="rounded-lg object-cover shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 w-full max-w-xs rounded-lg border bg-card p-4 shadow-xl">
                <div className="mb-2 flex items-center gap-2">
                  <Feather className="size-5 text-primary" />
                  <h3 className="font-headline font-semibold">
                    AI Feedback Snippet
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  "Great thesis statement! Consider adding more specific
                  evidence in paragraph two to further support your argument."
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-secondary py-20 md:py-32">
          <div className="container">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl">
                Transforming the Way We Learn
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                SnapCheck provides powerful tools for both students and
                educators to enhance the writing and grading experience.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="font-headline mb-2 text-xl">
                      {feature.title}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SnapCheck. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

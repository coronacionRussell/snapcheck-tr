
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Cpu,
  Feather,
  Menu,
  UploadCloud,
  X,
  Users,
  Workflow,
  Sparkles,
  Gauge
} from 'lucide-react';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const features = [
    {
      icon: <UploadCloud className="size-8 text-primary" />,
      title: 'Seamless Essay Submission',
      description:
        'Students can easily upload essay photos. Our OCR technology converts them into digital text instantly.',
    },
    {
      icon: <Sparkles className="size-8 text-primary" />,
      title: 'AI-Powered Feedback',
      description:
        'Receive insightful, rubric-based feedback for strengths and areas for improvement, powered by advanced AI.',
    },
    {
      icon: <Gauge className="size-8 text-primary" />,
      title: 'Automated Grading Assistance',
      description:
        'For teachers, our AI provides preliminary scores based on your rubrics, streamlining the grading process.',
    },
    {
      icon: <CheckCircle className="size-8 text-primary" />,
      title: 'Accurate Student Identification',
      description:
        'AI helps reliably match submissions to students, reducing administrative errors in large classes.',
    },
    {
      icon: <Workflow className="size-8 text-primary" />,
      title: 'Efficient Batch Processing',
      description:
        'Grade dozens of essays at once. Scan multiple submissions, and let the AI assist in grading them all.',
    },
    {
      icon: <BookOpen className="size-8 text-primary" />,
      title: 'Class Management',
      description:
        'Teachers can create classes with unique codes, making it easy for students to enroll and participate.',
    },
    {
      icon: <Users className="size-8 text-primary" />,
      title: 'Teacher Control & Customization',
      description:
        'Maintain final say. Review and refine AI suggestions and customize AI behavior for grading and feedback.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-green-50">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <Logo className="[&>svg]:size-8 [&>span]:text-2xl" />
            </Link>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden flex-1 items-center justify-end space-x-2 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Sign Up <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </nav>
          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader className="sr-only">
                  <SheetTitle>Mobile Menu</SheetTitle>
                  <SheetDescription>
                    Navigation links for SnapCheck.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Link
                    href="/"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Logo />
                  </Link>
                  <div className="flex flex-col gap-4">
                    <Button
                      variant="ghost"
                      asChild
                      className="justify-start text-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full text-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-32 bg-gradient-to-br from-green-50 to-teal-50">
          <Image
            src="https://i.imgur.com/BBYIJ4P.png" // Abstract branding image
            alt="Abstract Background" 
            fill
            className="absolute inset-0 object-cover opacity-30"
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
          <div className="container relative z-10 grid grid-cols-1 items-center gap-12 text-center md:grid-cols-2 md:gap-16 md:text-left">
            <div className="space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl md:text-6xl">
                Revolutionize Your Grading with AI.
              </h1>
              <p className="mx-auto max-w-[600px] text-lg text-gray-700 md:mx-0">
                SnapCheck uses advanced AI to scan, grade, and provide personalized feedback on student essays, saving teachers countless hours and enhancing learning.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                <Button size="lg" asChild className="bg-[#70CBC0] hover:bg-[#5bb8ae]">
                  <Link href="/register">
                    Get Started Free <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-gray-300 text-gray-800 hover:bg-gray-100">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md md:max-w-none animate-float">
              <Image
                src="https://media.istockphoto.com/id/469090060/photo/smart-jack-russell-terrier.jpg?s=612x612&w=0&k=20&c=jr3vERTtcaXUjn5rYtW3KiixND9CWBrNvZr-ogfyowo="
                width={612}
                height={612}
                alt="A smart Jack Russell Terrier wearing glasses and a bow tie"
                className="aspect-square rounded-lg object-cover shadow-2xl border border-gray-200"
                priority
                fetchPriority="high"
              />
              <div className="mt-4 w-full rounded-lg border bg-card p-4 shadow-xl md:absolute md:-bottom-8 md:-right-8 md:mt-0 md:max-w-xs">
                <div className="mb-2 flex items-center gap-2">
                  <Feather className="size-5 text-primary" />
                  <h3 className="font-headline font-semibold">
                    AI Feedback Snippet
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  "Excellent use of supporting evidence! Consider refining your introduction to more clearly state your thesis."
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-20 md:py-32">
          <div className="container">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="font-headline text-3xl font-bold sm:text-4xl text-gray-900">
                Transforming Education: Tools for Smarter Learning and Teaching
              </h2>
              <p className="mt-4 text-lg text-gray-700">
                SnapCheck provides powerful, AI-driven tools for both students and
                educators to enhance the writing and grading experience.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#E0F2F1]"> {/* Muted Teal light */}
                      {feature.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="font-headline mb-2 text-xl text-gray-900">
                      {feature.title}
                    </CardTitle>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="call-to-action" className="bg-[#70CBC0] py-16 md:py-24 text-center text-white">
          <div className="container mx-auto max-w-3xl space-y-6">
            <h2 className="font-headline text-3xl font-bold sm:text-4xl">
              Ready to Experience Smarter Grading?
            </h2>
            <p className="text-lg opacity-90">
              Join SnapCheck today and transform the way you manage and grade essays. It's free to get started!
            </p>
            <Button size="lg" asChild className="bg-white text-[#70CBC0] hover:bg-gray-100 animate-pulse-slow">
              <Link href="/register">
                Start Your Free Account <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
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

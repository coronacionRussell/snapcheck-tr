
'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  verified?: boolean;
}

const ADMIN_EMAIL = 'admin@snapcheck.com';

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        if (firebaseUser.email === ADMIN_EMAIL) {
           const adminUser: AppUser = {
              uid: firebaseUser.uid,
              fullName: 'Admin User',
              email: firebaseUser.email,
              role: 'admin',
              verified: true
            };
            setUser(adminUser);
        } else {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<AppUser, 'uid'>;
              setUser({
                  uid: firebaseUser.uid,
                  ...userData,
              });
            } else {
              // This can happen if a user is deleted from Firestore but not from Auth.
              // Log them out to clear the session.
              await auth.signOut();
              setUser(null);
            }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

 useEffect(() => {
    if (isLoading) {
      return; // Don't do anything while loading auth state
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isLandingPage = pathname === '/';

    // If user is not logged in
    if (!user) {
      // If they are on a protected page, redirect to login. Otherwise, allow access.
      if (!isAuthPage && !isLandingPage) {
        router.replace('/login');
      }
      return;
    }

    // If user IS logged in
    const role = user.role;
    let targetDashboard = '/';
    let allowedPaths: string[] = [];

    switch (role) {
      case 'admin':
        targetDashboard = '/app/admin/dashboard';
        allowedPaths = ['/app/admin'];
        break;
      case 'teacher':
        targetDashboard = '/app/teacher/dashboard';
        allowedPaths = ['/app/teacher'];
        break;
      case 'student':
        targetDashboard = '/app/student/dashboard';
        allowedPaths = ['/app/student'];
        break;
    }

    // Redirect logged-in users from auth or landing pages to their dashboard
    if (isAuthPage || isLandingPage) {
      router.replace(targetDashboard);
      return;
    }
    
    // Enforce role-based access for /app routes
    const isPathAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isPathAllowed) {
       router.replace(targetDashboard);
    }
  }, [user, isLoading, pathname, router]);


  return { user, isLoading };
}

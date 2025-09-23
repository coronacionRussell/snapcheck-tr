
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  isVerified?: boolean;
  verificationIdUrl?: string;
  enrolledClassIds?: string[];
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  // NEW: Introduce a more detailed loading state
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const docUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setUser(userData);
            setAuthStatus('authenticated'); // User is fully loaded
          } else {
            // This case means auth user exists but Firestore doc doesn't. Log them out.
            auth.signOut();
            setUser(null);
            setAuthStatus('unauthenticated');
          }
        }, (error) => {
          console.error("Error fetching user document:", error);
          auth.signOut();
          setUser(null);
          setAuthStatus('unauthenticated');
        });
        
        return () => docUnsubscribe();

      } else {
        setUser(null);
        setAuthStatus('unauthenticated'); // No user is logged in
      }
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    // Don't run any redirect logic until auth status is determined.
    if (authStatus === 'loading') {
      return; 
    }

    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = publicPages.includes(pathname);
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    
    if (authStatus === 'authenticated' && user) {
      // User is logged in.
      let targetDashboard = '/';
      if (user.role === 'admin') {
        targetDashboard = '/admin/dashboard';
      } else if (user.role === 'teacher') {
        targetDashboard = '/teacher/dashboard';
      } else if (user.role === 'student') {
        targetDashboard = '/student/dashboard';
      }
      
      // If they are on an auth page, redirect them to their dashboard.
      if (isAuthPage) {
        router.replace(targetDashboard);
      }

    } else if (authStatus === 'unauthenticated') {
      // User is not logged in.
      // If they are on a page that requires authentication, redirect to login.
      if (!isPublicPage) {
        router.replace('/login');
      }
    }
  }, [user, authStatus, pathname, router]);


  return { user, isLoading: authStatus === 'loading' };
}

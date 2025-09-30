
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
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // A user is authenticated, now set up a real-time listener for their Firestore document.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const docUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setUser(userData);
            setAuthStatus('authenticated');
          } else {
            // This case means auth user exists but Firestore doc doesn't. This can happen
            // if doc creation fails during registration. Log them out to prevent a broken state.
            auth.signOut();
            setUser(null);
            setAuthStatus('unauthenticated');
          }
        }, (error) => {
          // Handle errors fetching the user document (e.g., permissions)
          console.error("Error fetching user document:", error);
          auth.signOut(); // Log out on error to be safe
          setUser(null);
          setAuthStatus('unauthenticated');
        });
        
        // Return the cleanup function for the Firestore listener
        return () => docUnsubscribe();

      } else {
        // No Firebase user is authenticated.
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    });

    // Return the cleanup function for the auth state listener
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

    
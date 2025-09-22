
'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  const [isLoading, setIsLoading] = useState(true);
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
          } else {
            auth.signOut();
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching user document:", error);
          auth.signOut();
          setUser(null);
          setIsLoading(false);
        });
        
        return () => docUnsubscribe();

      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return; 
    }

    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = publicPages.includes(pathname);
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isAppPage = pathname.startsWith('/student') || pathname.startsWith('/teacher') || pathname.startsWith('/admin');

    if (user) {
      let targetDashboard = '/';
      if (user.role === 'admin') {
        targetDashboard = '/admin/dashboard';
      } else if (user.role === 'teacher') {
        targetDashboard = '/teacher/dashboard';
      } else if (user.role === 'student') {
        targetDashboard = '/student/dashboard';
      }
      
      if (isAuthPage) {
        router.replace(targetDashboard);
      } else if (user.role === 'teacher' && !pathname.startsWith('/teacher')) {
         if (isAppPage) router.replace(targetDashboard);
      } else if (user.role === 'student' && !pathname.startsWith('/student')) {
         if (isAppPage) router.replace(targetDashboard);
      } else if (user.role === 'admin' && !pathname.startsWith('/admin')) {
         if (isAppPage) router.replace(targetDashboard);
      }

    } else {
      if (!isPublicPage) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, pathname, router]);


  return { user, isLoading };
}

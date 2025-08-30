
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher';
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<AppUser, 'uid'>;
          setUser({
              uid: firebaseUser.uid,
              ...userData,
          });
        } else {
          // If user exists in auth but not firestore, sign them out.
          await auth.signOut();
          setUser(null);
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
      return; 
    }

    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = publicPages.includes(pathname);
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isAppPage = pathname.startsWith('/student') || pathname.startsWith('/teacher');

    if (user) {
      // User is logged in
      let targetDashboard = '/';
      if (user.role === 'teacher') {
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
      }

    } else {
      // User is not logged in
      if (!isPublicPage) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, pathname, router]);


  return { user, isLoading };
}

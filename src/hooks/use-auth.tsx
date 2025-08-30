
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
      return; 
    }

    const publicPages = ['/', '/login', '/register'];
    const isPublicPage = publicPages.includes(pathname);
    const isAppPage = pathname.startsWith('/student') || pathname.startsWith('/teacher') || pathname.startsWith('/admin');

    if (user) {
      // User is logged in
      let targetDashboard: string;

      const isAdminPage = pathname.startsWith('/admin');
      const isTeacherPage = pathname.startsWith('/teacher');
      const isStudentPage = pathname.startsWith('/student');

      if (user.role === 'admin') {
        targetDashboard = '/admin/dashboard';
        if (!isAdminPage && isAppPage) {
          router.replace(targetDashboard);
        } else if (isPublicPage) {
          router.replace(targetDashboard);
        }
      } else if (user.role === 'teacher') {
        targetDashboard = '/teacher/dashboard';
        if (!isTeacherPage && isAppPage) {
          router.replace(targetDashboard);
        } else if (isPublicPage) {
          router.replace(targetDashboard);
        }
      } else if (user.role === 'student') {
        targetDashboard = '/student/dashboard';
        if (!isStudentPage && isAppPage) {
          router.replace(targetDashboard);
        } else if (isPublicPage) {
          router.replace(targetDashboard);
        }
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

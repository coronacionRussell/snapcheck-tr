
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
        // Special case for admin user. This check is the single source of truth for the admin role.
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
            // Logic for regular users
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<AppUser, 'uid'>;
              setUser({
                  uid: firebaseUser.uid,
                  ...userData,
              });
            } else {
              // This can happen if a user is created in Auth but their Firestore doc fails to be created.
              // Or if the admin user somehow gets here.
              // To be safe, we sign them out.
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
    // This effect handles redirection logic after auth state is determined.
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isAdminPage = pathname.startsWith('/admin');
    const isTeacherPage = pathname.startsWith('/teacher');
    const isStudentPage = pathname.startsWith('/student');

    if (!user) {
      // User is not logged in, redirect to login from protected pages
      if (!isAuthPage && pathname !== '/') {
        router.replace('/login');
      }
    } else {
      // User is logged in
      if (isAuthPage) {
        // Redirect from auth pages to the appropriate dashboard
        switch (user.role) {
          case 'admin':
            router.replace('/admin/dashboard');
            break;
          case 'teacher':
            router.replace('/teacher/dashboard');
            break;
          case 'student':
            router.replace('/student/dashboard');
            break;
          default:
            router.replace('/');
        }
      } else {
        // Enforce role-based access to protected routes
        if (user.role === 'admin' && !isAdminPage && (isTeacherPage || isStudentPage)) {
            router.replace('/admin/dashboard');
        } else if (user.role === 'teacher' && !isTeacherPage && (isAdminPage || isStudentPage)) {
            router.replace('/teacher/dashboard');
        } else if (user.role === 'student' && !isStudentPage && (isAdminPage || isTeacherPage)) {
            router.replace('/student/dashboard');
        }
      }
    }
  }, [user, isLoading, pathname, router]);


  return { user, isLoading };
}

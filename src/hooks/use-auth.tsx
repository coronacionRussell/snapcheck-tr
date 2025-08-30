
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
    if (isLoading) {
      return; // Don't do anything while loading
    }

    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isLandingPage = pathname === '/';

    // If there is no user...
    if (!user) {
      // and they are not on the landing or an auth page, redirect to login
      if (!isLandingPage && !isAuthPage) {
        router.replace('/login');
      }
      return;
    }

    // If there IS a user...
    const { role } = user;
    const isStudentPage = pathname.startsWith('/student');
    const isTeacherPage = pathname.startsWith('/teacher');
    const isAdminPage = pathname.startsWith('/admin');

    // If they are on an auth page, redirect them to their dashboard
    if (isAuthPage) {
      if (role === 'admin') router.replace('/admin/dashboard');
      else if (role === 'teacher') router.replace('/teacher/dashboard');
      else if (role === 'student') router.replace('/student/dashboard');
      return;
    }

    // Role-based route protection
    if (role === 'admin' && !isAdminPage) {
      router.replace('/admin/dashboard');
    } else if (role === 'teacher' && !isTeacherPage) {
      router.replace('/teacher/dashboard');
    } else if (role === 'student' && !isStudentPage) {
      router.replace('/student/dashboard');
    }
  }, [user, isLoading, pathname, router]);


  return { user, isLoading };
}

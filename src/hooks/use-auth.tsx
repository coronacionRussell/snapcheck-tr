
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

    const publicPages = ['/login', '/register', '/'];
    const isPublicPage = publicPages.includes(pathname);

    if (user) {
      // User is logged in
      let targetDashboard: string;
      let allowedPaths: string[];

      switch (user.role) {
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
        default:
            targetDashboard = '/login';
            allowedPaths = [];
      }

      if (isPublicPage) {
        router.replace(targetDashboard);
      } else {
        const isPathAllowed = allowedPaths.some(path => pathname.startsWith(path));
        if (!isPathAllowed) {
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

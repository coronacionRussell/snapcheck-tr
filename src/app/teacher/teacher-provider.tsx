
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { ClassContext, Class, ClassFromFirestore } from '@/contexts/class-context';
import { useToast } from '@/hooks/use-toast';

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClasses = useCallback(() => {
    if (!user) {
        setIsLoading(false);
        setClasses([]);
        return () => {};
    };

    setIsLoading(true);
    const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          studentCount: data.studentCount || 0, // Fallback to 0
          pendingSubmissions: data.pendingSubmissions || 0, // Fallback to 0
        } as Class;
      });
      setClasses(classesData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching classes: ", error);
        toast({
            title: "Error",
            description: "Could not fetch your classes.",
            variant: "destructive"
        });
        setIsLoading(false);
    });

    return unsubscribe;
  }, [user, toast]);

  useEffect(() => {
    const unsubscribe = fetchClasses();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    }
  }, [fetchClasses]);

  const onClassCreated = async (newClass: Omit<Class, 'id' | 'teacherId' | 'teacherName' | 'studentCount' | 'pendingSubmissions'>): Promise<Class | null> => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to create a class.",
            variant: "destructive"
        });
        return null;
    }
    
    try {
        const classData: ClassFromFirestore = {
            ...newClass,
            teacherId: user.uid,
            teacherName: user.fullName,
            studentCount: 0,
            pendingSubmissions: 0,
        };
        const docRef = await addDoc(collection(db, 'classes'), classData);

        toast({
            title: "Class Created!",
            description: `The class "${newClass.name}" has been created successfully.`
        });
        
        // The onSnapshot listener will automatically update the UI
        return {
            id: docRef.id,
            ...classData,
            studentCount: 0,
            pendingSubmissions: 0,
        };

    } catch (error) {
        console.error("Error creating class: ", error);
        toast({
            title: "Error",
            description: "Could not create the class.",
            variant: "destructive"
        });
        return null;
    }
  }

  const onClassDeleted = async (classId: string) => {
     try {
        const batch = writeBatch(db);

        // Delete all submissions in the class
        const submissionsRef = collection(db, 'classes', classId, 'submissions');
        const submissionsSnapshot = await getDocs(submissionsRef);
        submissionsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete all students in the class
        const studentsRef = collection(db, 'classes', classId, 'students');
        const studentsSnapshot = await getDocs(studentsRef);
        studentsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the activities subcollection
        const activitiesRef = collection(db, 'classes', classId, 'activities');
        const activitiesSnapshot = await getDocs(activitiesRef);
        activitiesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete the class document itself
        const classRef = doc(db, 'classes', classId);
        batch.delete(classRef);

        await batch.commit();

        toast({
            title: 'Class Deleted',
            description: 'The class and all its data have been successfully deleted.',
        });
    } catch (error: unknown) {
        let errorMessage = 'Could not delete the class and its associated data.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error deleting class: ", error);
        toast({
            title: 'Deletion Failed',
            description: errorMessage,
            variant: 'destructive'
        });
    }
  }

  return (
    <ClassContext.Provider value={{ classes, onClassCreated, onClassDeleted, isLoading }}>
      {children}
    </ClassContext.Provider>
  );
}

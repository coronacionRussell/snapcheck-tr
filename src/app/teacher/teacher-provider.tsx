
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
        return;
    };

    setIsLoading(true);
    const q = query(collection(db, 'classes'), where('teacherId', '==', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const classesDataPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        const submissionsQuery = query(collection(db, 'classes', doc.id, 'submissions'), where('status', '==', 'Pending Review'));
        const submissionsSnapshot = await getDocs(submissionsQuery);

        const studentsQuery = collection(db, 'classes', doc.id, 'students');
        const studentsSnapshot = await getDocs(studentsQuery);

        return {
          id: doc.id,
          ...data,
          studentCount: studentsSnapshot.size,
          pendingSubmissions: submissionsSnapshot.size,
        } as Class;
      });

      const classesData = await Promise.all(classesDataPromises);
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

    return () => unsubscribe();
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

        // Also create an empty rubric document
        await setDoc(doc(db, 'rubrics', docRef.id), { 
          content: `Example Rubric for ${newClass.name}\n\n1. Thesis Statement (25pts)\n   - Clear, concise, and arguable.\n2. Supporting Evidence (50pts)\n   - Relevant, well-explained, and properly cited.\n3. Conclusion (25pts)\n   - Summarizes main points and provides a final thought.`,
          createdAt: serverTimestamp()
        });

        toast({
            title: "Class Created!",
            description: `The class "${newClass.name}" has been created successfully.`
        });
        // The onSnapshot listener will automatically update the UI, but we can return the created class
        return {
            id: docRef.id,
            ...classData
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

        // Delete the rubric
        const rubricRef = doc(db, 'rubrics', classId);
        batch.delete(rubricRef);
        
        // Delete the class document itself
        const classRef = doc(db, 'classes', classId);
        batch.delete(classRef);

        await batch.commit();

        toast({
            title: 'Class Deleted',
            description: 'The class and all its data have been successfully deleted.',
        });
    } catch (error) {
        console.error("Error deleting class: ", error);
        toast({
            title: 'Deletion Failed',
            description: 'Could not delete the class and its associated data.',
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

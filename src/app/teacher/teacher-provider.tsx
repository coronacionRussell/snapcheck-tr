'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  const fetchClassesWithPendingCounts = useCallback(() => {
    if (!user) {
        setIsLoading(false);
        setClasses([]);
        return () => {};
    };

    setIsLoading(true);
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));

    // Clear previous unsubscribers
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];

    const classesUnsubscribe = onSnapshot(classesQuery, (classesSnapshot) => {
      const newClassesData: Class[] = [];
      let pendingPromises: Promise<void>[] = [];
      const currentClassIds = new Set<string>();

      classesSnapshot.docs.forEach((classDoc) => {
        currentClassIds.add(classDoc.id);
        const classData = classDoc.data();
        const initialClass: Class = {
          id: classDoc.id,
          ...classData,
          studentCount: classData.studentCount || 0,
          pendingSubmissions: 0, // Initialize to 0, will be updated by sub-listener
        } as Class;
        newClassesData.push(initialClass);

        // Create a listener for pending submissions for THIS class
        const submissionsQuery = query(
          collection(db, 'classes', classDoc.id, 'submissions'),
          where('status', '==', 'Pending Review')
        );

        const submissionUnsubscribe = onSnapshot(submissionsQuery, (submissionsSnapshot) => {
          setClasses(prevClasses => {
            const updatedClasses = prevClasses.map(c => {
              if (c.id === classDoc.id) {
                return { ...c, pendingSubmissions: submissionsSnapshot.size };
              }
              return c;
            });
            // If the class wasn't in prevClasses (e.g., initial load or new class)
            // ensure it's added and updated with the correct pending count.
            // This handles cases where a class is added and its submission listener fires quickly.
            if (!updatedClasses.some(c => c.id === classDoc.id)) {
                const existingClassIndex = newClassesData.findIndex(c => c.id === classDoc.id);
                if (existingClassIndex !== -1) {
                    newClassesData[existingClassIndex] = { ...newClassesData[existingClassIndex], pendingSubmissions: submissionsSnapshot.size };
                }
                return [...newClassesData]; // Re-evaluate all classes if a new one appears or needs updating
            }
            return updatedClasses;
          });
        }, (error) => {
          console.error(`Error fetching pending submissions for class ${classDoc.id}: `, error);
        });
        unsubscribeRefs.current.push(submissionUnsubscribe);
      });

      // Remove listeners for classes that no longer exist
      unsubscribeRefs.current = unsubscribeRefs.current.filter(unsubscribe => {
        // This is tricky as we don't directly store classId with unsubscribe. Requires refactoring if class deletion is frequent.
        // For now, relies on the main classesUnsubscribe to handle overall class list.
        // A better approach would be to store { classId, unsubscribeFunction } pairs.
        return true; // Keep all for now, assuming classes are not frequently deleted during runtime.
      });

      setClasses(newClassesData.sort((a, b) => a.name.localeCompare(b.name)));
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

    unsubscribeRefs.current.push(classesUnsubscribe);
    return () => {
        unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
        unsubscribeRefs.current = [];
    };
  }, [user, toast]);

  useEffect(() => {
    const unsubscribe = fetchClassesWithPendingCounts();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    }
  }, [fetchClassesWithPendingCounts]);

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


'use client';

import { useState, useEffect } from 'react';
import { ClassContext } from '@/contexts/class-context';
import { Class } from '@/contexts/class-context';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'classes'));
        const classesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Class[];
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes: ', error);
        toast({
          title: 'Error',
          description: 'Could not fetch classes from the database.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [toast]);

  const handleClassCreated = async (
    newClassData: Omit<Class, 'id' | 'studentCount' | 'pendingSubmissions'>
  ) => {
    try {
      const batch = writeBatch(db);

      // Create a new document reference with a unique ID first
      const newClassRef = doc(collection(db, 'classes'));

      const classToAdd: Class = {
        id: newClassRef.id,
        name: newClassData.name,
        teacherName: newClassData.teacherName,
        studentCount: 0,
        pendingSubmissions: 0,
      };

      batch.set(newClassRef, {
        name: classToAdd.name,
        teacherName: classToAdd.teacherName,
        studentCount: classToAdd.studentCount,
        pendingSubmissions: classToAdd.pendingSubmissions,
      });

      const rubricDocRef = doc(db, 'rubrics', newClassRef.id);
      batch.set(rubricDocRef, { content: '' });

      await batch.commit();

      setClasses((prevClasses) => [...prevClasses, classToAdd]);
      return classToAdd;
    } catch (error) {
      console.error('Error creating class: ', error);
      toast({
        title: 'Error',
        description: 'Could not create the new class.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleClassDeleted = async (classId: string) => {
    try {
      const batch = writeBatch(db);

      const classDocRef = doc(db, 'classes', classId);
      batch.delete(classDocRef);

      const rubricDocRef = doc(db, 'rubrics', classId);
      batch.delete(rubricDocRef);

      // We can also delete students subcollection here in the future

      await batch.commit();

      setClasses((prevClasses) => prevClasses.filter((c) => c.id !== classId));
      toast({
        title: 'Success',
        description: 'Class has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting class: ', error);
      toast({
        title: 'Error',
        description: 'Could not delete the class.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        onClassCreated: handleClassCreated,
        onClassDeleted: handleClassDeleted,
        isLoading,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

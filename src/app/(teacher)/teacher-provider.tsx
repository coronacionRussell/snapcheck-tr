
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ClassContext } from '@/contexts/class-context';
import { Class } from '@/contexts/class-context';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchClasses = useCallback(async () => {
    if (!user) {
      setClasses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'classes'),
        where('teacherId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
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
  }, [toast, user]);


  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleClassCreated = async (
    newClassData: Omit<Class, 'id' | 'studentCount' | 'pendingSubmissions' | 'teacherId' | 'teacherName'>
  ) => {
    if (!user) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return null;
    }
    try {
      const batch = writeBatch(db);
      const newClassRef = doc(collection(db, 'classes'));

      const classToAdd: Class = {
        id: newClassRef.id,
        name: newClassData.name,
        teacherId: user.uid,
        teacherName: user.fullName,
        studentCount: 0,
        pendingSubmissions: 0,
      };

      batch.set(newClassRef, {
        name: classToAdd.name,
        teacherId: classToAdd.teacherId,
        teacherName: classToAdd.teacherName,
        studentCount: classToAdd.studentCount,
        pendingSubmissions: classToAdd.pendingSubmissions,
      });

      const rubricDocRef = doc(db, 'rubrics', newClassRef.id);
      batch.set(rubricDocRef, { content: '' });

      await batch.commit();
      
      await fetchClasses();

      toast({
          title: 'Class Created!',
          description: `The class "${classToAdd.name}" has been created.`,
      })

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

      await batch.commit();
      
      await fetchClasses();

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


import { createContext } from 'react';
import { DocumentData, DocumentReference } from 'firebase/firestore';

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  pendingSubmissions: number;
};

export interface ClassFromFirestore {
    name: string;
    teacherId: string;
    teacherName: string;
    studentCount: number;
    pendingSubmissions: number;
}

type ClassContextType = {
  classes: Class[];
  onClassCreated: (newClass: Omit<Class, 'id' | 'studentCount' | 'pendingSubmissions' | 'teacherId' | 'teacherName'>) => Promise<Class | null>;
  onClassDeleted: (classId: string) => Promise<void>;
  isLoading: boolean;
};

export const ClassContext = createContext<ClassContextType>({
  classes: [],
  onClassCreated: async (newClass) => {
    console.error('onClassCreated not implemented');
    return null;
  },
  onClassDeleted: async (classId: string) => {
    console.error('onClassDeleted not implemented');
  },
  isLoading: true,
});


import { createContext } from 'react';
import { DocumentData, DocumentReference } from 'firebase/firestore';

export interface Class {
  id: string;
  name: string;
  studentCount: number;
  pendingSubmissions: number;
};

export interface ClassFromFirestore {
    name: string;
    studentCount: number;
    pendingSubmissions: number;
}

type ClassContextType = {
  classes: Class[];
  onClassCreated: (newClass: Omit<Class, 'id' | 'studentCount' | 'pendingSubmissions'>) => Promise<Class | null>;
  onClassDeleted: (classId: string) => Promise<void>;
  isLoading: boolean;
};

export const ClassContext = createContext<ClassContextType>({
  classes: [],
  onClassCreated: async () => null,
  onClassDeleted: async () => {},
  isLoading: true,
});

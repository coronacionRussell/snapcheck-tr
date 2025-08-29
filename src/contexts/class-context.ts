import { createContext } from 'react';
import { Class } from '@/components/teacher/create-class-dialog';

export const initialClasses: Class[] = [
  {
    id: 'ENG101',
    name: 'English Literature 101',
    studentCount: 28,
    pendingSubmissions: 5,
  },
  {
    id: 'WRI202',
    name: 'Advanced Composition',
    studentCount: 19,
    pendingSubmissions: 2,
  },
  {
    id: 'HIS301',
    name: 'American History Essays',
    studentCount: 22,
    pendingSubmissions: 0,
  },
];

type ClassContextType = {
  classes: Class[];
  onClassCreated: (newClass: Class) => void;
};

export const ClassContext = createContext<ClassContextType>({
  classes: initialClasses,
  onClassCreated: () => {},
});

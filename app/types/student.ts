// /types/student.ts

import { User } from "./user.ts";

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Exam {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string; // ISO string
}

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string; // ISO string
  description?: string;
}

export interface Student {
  id: string;
  userId: string;
  user: User;
  classId?: string;
  class?: Class;
  enrolledAt: string; // ISO string from backend
  parents?: Parent[];
  exams?: Exam[];
  transactions?: Transaction[];
}

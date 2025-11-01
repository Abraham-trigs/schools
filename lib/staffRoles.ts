import { Role } from "@prisma/client";

export const staffRoles: Role[] = [
  Role.PRINCIPAL,
  Role.VICE_PRINCIPAL,
  Role.TEACHER,
  Role.ASSISTANT_TEACHER,
  Role.COUNSELOR,
  Role.LIBRARIAN,
  Role.EXAM_OFFICER,
  Role.FINANCE,
  Role.HR,
  Role.RECEPTIONIST,
  Role.IT_SUPPORT,
  Role.TRANSPORT,
  Role.NURSE,
  Role.COOK,
  Role.CLEANER,
  Role.SECURITY,
  Role.MAINTENANCE,
  Role.AUDITOR,
];

// Map positions to roles
export const positionToRole: Record<string, Role> = {
  principal: Role.PRINCIPAL,
  "vice principal": Role.VICE_PRINCIPAL,
  teacher: Role.TEACHER,
  "assistant teacher": Role.ASSISTANT_TEACHER,
  counselor: Role.COUNSELOR,
  librarian: Role.LIBRARIAN,
  "exam officer": Role.EXAM_OFFICER,
  finance: Role.FINANCE,
  hr: Role.HR,
  receptionist: Role.RECEPTIONIST,
  "it support": Role.IT_SUPPORT,
  transport: Role.TRANSPORT,
  nurse: Role.NURSE,
  cook: Role.COOK,
  cleaner: Role.CLEANER,
  security: Role.SECURITY,
  maintenance: Role.MAINTENANCE,
  auditor: Role.AUDITOR,
};

// Map roles to default departments (optional)
export const roleToDepartment: Record<Role, string> = {
  [Role.PRINCIPAL]: "Administration",
  [Role.VICE_PRINCIPAL]: "Administration",
  [Role.TEACHER]: "Teaching",
  [Role.ASSISTANT_TEACHER]: "Teaching",
  [Role.COUNSELOR]: "Guidance",
  [Role.LIBRARIAN]: "Library",
  [Role.EXAM_OFFICER]: "Exams",
  [Role.FINANCE]: "Finance",
  [Role.HR]: "HR",
  [Role.RECEPTIONIST]: "Front Office",
  [Role.IT_SUPPORT]: "IT",
  [Role.TRANSPORT]: "Transport",
  [Role.NURSE]: "Health",
  [Role.COOK]: "Kitchen",
  [Role.CLEANER]: "Maintenance",
  [Role.SECURITY]: "Security",
  [Role.MAINTENANCE]: "Maintenance",
  [Role.AUDITOR]: "Finance",
};

// Dynamically define which roles require a class
export const roleRequiresClass: Role[] = [
  Role.TEACHER,
  Role.ASSISTANT_TEACHER,
];

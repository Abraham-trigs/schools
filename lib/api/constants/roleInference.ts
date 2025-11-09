// src/lib/api/constants/roleInference.ts
// Purpose: Map positions to roles, provide default departments, determine class and subject requirements.

import { Role } from "@prisma/client";

/** 
 * Map positions/keywords to default roles.  
 * Add new positions here if needed.
 */
export const positionRoleMap: Record<string, Role> = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  PRINCIPAL: "PRINCIPAL",
  VICE_PRINCIPAL: "VICE_PRINCIPAL",
  TEACHER: "TEACHER",
  ASSISTANT_TEACHER: "ASSISTANT_TEACHER",
  COUNSELOR: "COUNSELOR",
  LIBRARIAN: "LIBRARIAN",
  EXAM_OFFICER: "EXAM_OFFICER",
  FINANCE: "FINANCE",
  HR: "HR",
  RECEPTIONIST: "RECEPTIONIST",
  IT_SUPPORT: "IT_SUPPORT",
  TRANSPORT: "TRANSPORT",
  NURSE: "NURSE",
  COOK: "COOK",
  CLEANER: "CLEANER",
  SECURITY: "SECURITY",
  MAINTENANCE: "MAINTENANCE",
  AUDITOR: "AUDITOR",
  STUDENT: "STUDENT",
  CLASS_REP: "CLASS_REP",
  PARENT: "PARENT",
  ALUMNI: "ALUMNI",
};

/**
 * Default department for each role.
 */
export const roleToDepartment: Record<Role, string> = {
  ADMIN: "Administration",
  MODERATOR: "Administration",
  PRINCIPAL: "Administration",
  VICE_PRINCIPAL: "Administration",
  TEACHER: "Teaching",
  ASSISTANT_TEACHER: "Teaching",
  COUNSELOR: "Guidance",
  LIBRARIAN: "Library",
  EXAM_OFFICER: "Exams",
  FINANCE: "Finance",
  HR: "HR",
  RECEPTIONIST: "Front Office",
  IT_SUPPORT: "IT",
  TRANSPORT: "Transport",
  NURSE: "Health",
  COOK: "Kitchen",
  CLEANER: "Maintenance",
  SECURITY: "Security",
  MAINTENANCE: "Maintenance",
  AUDITOR: "Finance",
  STUDENT: "Student Services",
  CLASS_REP: "Student Services",
  PARENT: "Parent Relations",
  ALUMNI: "Alumni Relations",
};

/**
 * Roles that require a class assignment.
 */
export const roleRequiresClass: Role[] = ["TEACHER", "ASSISTANT_TEACHER", "CLASS_REP"];

/**
 * Roles that require subject selection.
 */
export const rolesWithSubjects: Role[] = ["TEACHER", "ASSISTANT_TEACHER"];

/**
 * Infer a role from a position string.  
 * Fallback: TEACHER
 */
export function inferRoleFromPosition(position?: string): Role {
  if (!position) return "TEACHER";

  const key = position.toUpperCase().replace(/\s+/g, "_");
  return positionRoleMap[key] ?? "TEACHER";
}

/**
 * Optional helper: get default department for a position
 */
export function inferDepartmentFromPosition(position?: string): string | undefined {
  const role = inferRoleFromPosition(position);
  return roleToDepartment[role];
}

/**
 * Optional helper: does this position require a class?
 */
export function requiresClass(position?: string): boolean {
  const role = inferRoleFromPosition(position);
  return roleRequiresClass.includes(role);
}

/**
 * Optional helper: does this role require subject assignment?
 */
export function requiresSubjects(position?: string): boolean {
  const role = inferRoleFromPosition(position);
  return rolesWithSubjects.includes(role);
}

/* 
Design reasoning → Centralized, consistent mapping for positions → roles, departments, class & subject requirements. Provides reusable helpers for UI logic.

Structure → positionRoleMap, roleToDepartment, roleRequiresClass, rolesWithSubjects, helper functions inferRoleFromPosition, inferDepartmentFromPosition, requiresClass, requiresSubjects.

Implementation guidance → Use requiresSubjects in forms to conditionally render subject selectors. Ensure inferRoleFromPosition normalizes input strings.

Scalability insight → Adding new positions, roles, or subject/class requirements is straightforward. All dependent UI and API logic reference these constants and helpers.
*/

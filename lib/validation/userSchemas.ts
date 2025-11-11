// lib/validation/userSchemas.ts
// Purpose: Zod schemas for user creation and validation including staff/public roles with conditional fields.

import { z } from "zod";

// ------------------- Design reasoning -------------------
// Centralized user schemas allow consistent validation across API routes and frontend forms.
// Conditional busId ensures only TRANSPORT role requires a bus assignment.
// Role enums enable type-safe distinctions between staff and public users.

// ------------------- Structure -------------------
// Exports:
// baseUserSchema -> Core fields shared by all users
// staffRoles     -> Array of staff roles
// publicRoles    -> Array of public roles
// allRoles       -> Combined role array for validation
// userCreateSchema -> Full schema with conditional busId validation
// isStaffRole    -> Helper to detect if a role is staff

export const baseUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const staffRoles = [
  "ADMIN",
  "MODERATOR",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "TEACHER",
  "ASSISTANT_TEACHER",
  "COUNSELOR",
  "LIBRARIAN",
  "EXAM_OFFICER",
  "FINANCE",
  "HR",
  "RECEPTIONIST",
  "IT_SUPPORT",
  "TRANSPORT",
  "NURSE",
  "COOK",
  "CLEANER",
  "SECURITY",
  "MAINTENANCE",
  "AUDITOR",
] as const;

export const publicRoles = [
  "STUDENT",
  "CLASS_REP",
  "PARENT",
  "ALUMNI",
] as const;

export const allRoles = [...staffRoles, ...publicRoles] as const;

export const userCreateSchema = baseUserSchema
  .extend({
    role: z.enum(allRoles).default("STUDENT"),
    busId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // busId required only for TRANSPORT role
      if (data.role === "TRANSPORT") return !!data.busId;
      return true;
    },
    { message: "busId is required for TRANSPORT role", path: ["busId"] }
  )
  .refine(
    (data) => {
      // busId must be empty for non-TRANSPORT roles
      if (data.role !== "TRANSPORT") return !data.busId;
      return true;
    },
    { message: "busId must be empty for non-TRANSPORT roles", path: ["busId"] }
  );

export type UserCreateInput = z.infer<typeof userCreateSchema>;

// ------------------- Implementation guidance -------------------
// Import this schema in API routes and React Hook Form to validate input.
// Call isStaffRole(role) to check if a role is staff for UI logic or access control.

export const isStaffRole = (role: string) => staffRoles.includes(role as any);

// ------------------- Scalability insight -------------------
// Adding new role-specific fields (e.g., grade for STUDENT, subject for TEACHER) can be done with additional .refine() checks.
// Centralized schema ensures consistency across APIs, stores, and UI components.
// Future roles or conditional fields can be easily added to staffRoles/publicRoles arrays.

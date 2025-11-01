// src/lib/constants/roles.ts

// 1. Centralized roles list — defines all valid system roles.
// Using `as const` makes the array readonly and enables literal types.
export const Roles = [
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
  "STUDENT",
  "CLASS_REP",
  "PARENT",
  "ALUMNI",
  "AUDITOR",
] as const;

// 2. Type-safe role type
export type Role = (typeof Roles)[number];

// 3. Helper: group roles by functional category
export const RoleGroups = {
  admin: ["ADMIN", "MODERATOR", "AUDITOR"] as const,
  management: ["PRINCIPAL", "VICE_PRINCIPAL", "HR", "FINANCE"] as const,
  academic: [
    "TEACHER",
    "ASSISTANT_TEACHER",
    "EXAM_OFFICER",
    "LIBRARIAN",
    "COUNSELOR",
  ] as const,
  support: [
    "IT_SUPPORT",
    "RECEPTIONIST",
    "TRANSPORT",
    "NURSE",
    "COOK",
    "CLEANER",
    "SECURITY",
    "MAINTENANCE",
  ] as const,
  community: ["STUDENT", "CLASS_REP", "PARENT", "ALUMNI"] as const,
};

// 4. Utility: check if a given role exists
export const isValidRole = (role: string): role is Role =>
  Roles.includes(role as Role);

// 5. Utility: get group by role
export const getRoleGroup = (role: Role): keyof typeof RoleGroups | null => {
  for (const [group, groupRoles] of Object.entries(RoleGroups)) {
    if (groupRoles.includes(role as any)) return group as keyof typeof RoleGroups;
  }
  return null;
};

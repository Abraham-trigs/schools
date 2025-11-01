// /types/user.ts

import { Role } from "./roles.ts"; 

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId: string;
}

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Payload type
export interface JwtPayload {
  id: string;
  role: string;
  schoolId: string;
}

// Sign JWT
export const signJwt = (payload: JwtPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

// Verify JWT
export const verifyJwt = (token: string) =>
  jwt.verify(token, JWT_SECRET) as JwtPayload;

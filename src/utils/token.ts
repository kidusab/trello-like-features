import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY || "token-secret-key";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

export function generateToken(payload: any): string {
  return jwt.sign(payload, TOKEN_SECRET_KEY, {
    expiresIn: "15m",
  });
}

export function verifyToken<T extends object>(token: string): T | null {
  return jwt.verify(token, TOKEN_SECRET_KEY) as T;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(
  password: string,
  hashedPassword: string
): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

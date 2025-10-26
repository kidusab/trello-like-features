import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY || "token-secret-key";

export function generateToken(payload: any, expiresIn?: number): string {
  return jwt.sign(payload, TOKEN_SECRET_KEY, {
    expiresIn: expiresIn ?? Date.now() + 1000 * 60 * 60 * 24, // 1 day
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

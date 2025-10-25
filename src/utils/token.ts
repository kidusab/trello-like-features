import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

export function generateAccessToken<T extends object>(payload: T): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken<T extends object>(payload: T): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken<T extends object>(token: string): T | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as T;
  } catch {
    return null;
  }
}

export function verifyRefreshToken<T extends object>(token: string): T | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as T;
  } catch {
    return null;
  }
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

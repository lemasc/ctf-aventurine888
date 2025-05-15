import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import crypto from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  username: string;
}

export const generateUserId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

// Hash a PIN according to the spec: plain text → base64 → SHA-256
export async function hashPin(pin: string): Promise<string> {
  const base64Pin = Buffer.from(pin).toString("base64");
  return crypto.createHash("sha256").update(base64Pin).digest("hex");
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify a password
export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

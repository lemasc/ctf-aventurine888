import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  generateToken,
  generateUserId,
  hashPassword,
  hashPin,
  verifyPassword,
} from "~/lib/auth";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { setCookie } from "hono/cookie";
import { PIN_REGEX } from "./shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  pin: z
    .string()
    .refine((val) => (val ? PIN_REGEX.test(val) : true), {
      message: "PIN must be 6 digits",
    })
    .optional(),
});

export const authApp = new Hono()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      const { username, password, pin } = c.req.valid("json");
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user) {
        return c.json(
          { success: false, message: "Invalid credentials" } as const,
          { status: 401 }
        );
      }

      // Verify password
      const isValidPassword = await verifyPassword(user.password, password);
      if (!isValidPassword) {
        return c.json(
          { success: false, message: "Invalid credentials" } as const,
          { status: 401 }
        );
      }

      // User doesn't have a PIN set
      if (!user.verificationPin) {
        if (!pin) {
          // If no PIN provided, return requiresPin flag
          return c.json({ success: false, requiresPin: true } as const, {
            status: 402,
          });
        } else {
          // update the user with the PIN
          await db
            .update(users)
            .set({ verificationPin: await hashPin(pin) })
            .where(eq(users.userId, user.userId));
        }
      }

      // Generate token
      const token = generateToken({
        userId: user.userId,
        username: user.username,
      });

      // Set cookie
      setCookie(c, "token", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return c.json(
        {
          success: true,
          message: "Login successful",
          user: {
            userId: user.userId,
            username: user.username,
            balance: user.balance,
          },
        } as const,
        { status: 200 }
      );
    } catch (error) {
      console.error("Login error:", error);
      return c.json(
        { success: false, message: "Internal server error" } as const,
        { status: 500 }
      );
    }
  })
  .post("/register", zValidator("json", loginSchema.required()), async (c) => {
    try {
      const { username, password, pin } = c.req.valid("json");
      // Check if username already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      if (existingUser.length > 0) {
        return c.json(
          { success: false, message: "Username already exists" } as const,
          { status: 400 }
        );
      }

      // Generate user ID and hash credentials
      const userId = generateUserId();
      const hashedPassword = await hashPassword(password);
      const hashedPin = await hashPin(pin);

      // Create user
      await db.insert(users).values({
        userId,
        username,
        password: hashedPassword,
        verificationPin: hashedPin,
        balance: 0,
      });

      // Generate token
      const token = generateToken({
        userId,
        username,
      });

      // Set cookie
      setCookie(c, "token", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return c.json(
        {
          message: "Registration successful",
          userId,
        } as const,
        200
      );
    } catch (error) {
      console.error("Registration error:", error);
      return c.json(
        { success: false, message: "Internal server error" } as const,
        {
          status: 500,
        }
      );
    }
  });

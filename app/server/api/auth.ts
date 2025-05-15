import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { generateUserId } from "~/lib/random";
import { generateToken, hashPassword, verifyPassword } from "~/lib/auth";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteCookie, setCookie } from "hono/cookie";
import { PIN_REGEX, successSchema, errorSchema } from "./shared/schema";
import { LibsqlError } from "@libsql/client";
import { zUser } from "~/lib/db/zod";

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
  .get("/", (c) => {
    return c.json({ success: true, message: "Auth API is running" } as const, {
      status: 200,
    });
  })
  .post(
    "/login",
    describeRoute({
      description: "Login to the service",
      tags: ["auth"],
      responses: {
        200: {
          description: "Login successful.",
          content: {
            "application/json": {
              schema: resolver(
                successSchema.extend({
                  user: zUser.pick({
                    userId: true,
                    username: true,
                  }),
                })
              ),
            },
          },
        },
        401: {
          description: "Invalid username or password.",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        402: {
          description:
            "The account PIN has been reset. PIN re-enter is required.",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        500: {
          description: "Internal server error.",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
      },
    }),
    zValidator("json", loginSchema),
    async (c) => {
      try {
        const { username, password, pin } = c.req.valid("json");
        // Get user
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (!user) {
          return c.json(
            {
              success: false,
              message: "Invalid username or password",
            } as const,
            { status: 401 }
          );
        }

        // Verify password
        const isValidPassword = await verifyPassword(user.password, password);
        if (!isValidPassword) {
          return c.json(
            {
              success: false,
              message: "Invalid username or password",
            } as const,
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
              .set({ verificationPin: pin })
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
    }
  )
  .post(
    "/register",
    describeRoute({
      description: "Register a new account",
      tags: ["auth"],
      responses: {
        200: {
          description: "Registration successful.",
        },
        400: {
          description: "Username already exists.",
        },
        500: {
          description: "Internal server error.",
        },
      },
    }),
    zValidator("json", loginSchema.required()),
    async (c) => {
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

        const createUser = async (count = 1) => {
          // Generate user ID and hash credentials
          const userId = generateUserId();
          const hashedPassword = await hashPassword(password);

          // Create user
          try {
            await db.insert(users).values({
              userId,
              username,
              password: hashedPassword,
              verificationPin: pin,
              balance: 0,
            });
          } catch (error) {
            if (
              error instanceof LibsqlError &&
              error.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
            ) {
              if (count > 10) {
                throw new Error(
                  "Too many attempts to create user. ID collision."
                );
              }
              // try again
              return createUser(count + 1);
            }
            throw error;
          }
          return userId;
        };

        const userId = await createUser();

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
    }
  )
  .post(
    "/logout",
    describeRoute({
      description: "Logout from the service",
      tags: ["auth"],
      responses: {
        200: {
          description: "Logout successful",
          content: {
            "application/json": {
              schema: resolver(successSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      deleteCookie(c, "token");
      return c.json({ success: true, message: "Logout successful" } as const, {
        status: 200,
      });
    }
  );

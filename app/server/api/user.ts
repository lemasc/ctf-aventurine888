import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";
import { hashPin } from "~/lib/auth";
import { zUser } from "~/lib/db/zod";
import { errorSchema, successSchema } from "./shared/schema";
import { z } from "zod";

export const userApp = new Hono()
  .get(
    "/",
    describeRoute({
      description: "Get user information",
      tags: ["user"],
      responses: {
        200: {
          description: "User information",
          content: {
            "application/json": {
              schema: resolver(
                successSchema.extend({
                  user: zUser.pick({
                    userId: true,
                    username: true,
                    balance: true,
                    createdAt: true,
                    verificationPin: true,
                  }),
                })
              ),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const token = getCookie(c, "token");
        if (!token) {
          return c.json({ success: false, message: "Unauthorized" }, 401);
        }

        // Verify token and get user ID
        const { userId } = verifyToken(token);

        // Get user data
        const user = await db.query.users.findFirst({
          where: eq(users.userId, userId),
        });

        if (!user) {
          return c.json({ success: false, message: "User not found" }, 404);
        }

        if (!user.verificationPin) {
          if (import.meta.env.NODE_ENV === "development") {
            console.warn("User doesn't have a PIN set. This is not normal.");
          }
          return c.json({ success: false, message: "User not found" }, 404);
        }

        // Return user data without password
        return c.json(
          {
            success: true,
            user: {
              userId: user.userId,
              username: user.username,
              balance: user.balance,
              createdAt: user.createdAt,
              pin: await hashPin(user.verificationPin!),
            },
          } as const,
          200
        );
      } catch (error) {
        console.error("Get user error:", error);
        return c.json(
          { success: false, message: "Internal server error" } as const,
          500
        );
      }
    }
  )
  .post(
    "/pull",
    describeRoute({
      description:
        'Pull a gacha character. Currently, only one character "Anaxa" can be pulled.',
      tags: ["user"],
      responses: {
        200: {
          description: "Pull successful.",
          content: {
            "application/json": {
              schema: resolver(successSchema),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        402: {
          description: "Not enough credits to pull",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        // Get token from cookie
        const token = getCookie(c, "token");
        if (!token) {
          return c.json({ success: false, message: "Unauthorized" }, 401);
        }

        // Verify token and get user ID
        const { userId } = verifyToken(token);

        // Get user data
        const user = await db.query.users.findFirst({
          where: eq(users.userId, userId),
        });

        if (!user) {
          return c.json({ success: false, message: "User not found" }, 404);
        }

        if (user.balance >= 6400) {
          // can pull
          return c.json(
            {
              success: true,
              message: "Pull successful. Open the console for the flag!",
              flag: "!tc68_F1ag{W3ll_D0n3_Xss:D_N0w_CHzzzzz}",
            },
            200
          );
        }

        // Return user data without password
        return c.json(
          {
            success: false,
            message: "Not enough credits to pull",
          } as const,
          402
        );
      } catch (error) {
        console.error("Get user error:", error);
        return c.json(
          { success: false, message: "Internal server error" } as const,
          500
        );
      }
    }
  )
  .get(
    "/list",
    describeRoute({
      description: "Get all users",
      tags: ["user"],
      responses: {
        200: {
          description: "User list",
          content: {
            "application/json": {
              schema: resolver(
                successSchema.extend({
                  users: z.array(zUser),
                })
              ),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: resolver(errorSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        // Get token from cookie
        const token = getCookie(c, "token");
        if (!token) {
          return c.json({ success: false, message: "Unauthorized" }, 401);
        }
        try {
          verifyToken(token);
        } catch {
          return c.json({ success: false, message: "Unauthorized" }, 401);
        }
        const users = await db.query.users.findMany({
          orderBy: (t) => asc(t.createdAt),
          columns: {
            balance: false,
            createdAt: false,
            userType: false,
          },
        });
        return c.json(
          {
            success: true,
            users: await Promise.all(
              users.map(async (v) => ({
                ...v,
                verificationPin: v.verificationPin
                  ? await hashPin(v.verificationPin)
                  : "",
              }))
            ),
          },
          200
        );
      } catch (error) {
        console.error("Get user list error:", error);
        return c.json(
          { success: false, message: "Internal server error" },
          500
        );
      }
    }
  );

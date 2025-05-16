import { Hono } from "hono";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";
import { describeRoute } from "hono-openapi";
import { successSchema } from "./shared/schema";

const transferSchema = z.object({
  recipientId: z.string().length(10, "Invalid recipient ID"),
  amount: z.number().int().positive("Amount must be positive"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

export const transferApp = new Hono().post(
  "/credit",
  describeRoute({
    description: "Transfer credits to another user",
    tags: ["transfer"],
    responses: {
      200: {
        description: "Transfer successful",
        content: {
          "application/json": {
            schema: resolver(
              successSchema.extend({
                newBalance: z.number().int().positive(),
              })
            ),
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.literal(false),
                message: z.string(),
              })
            ),
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.literal(false),
                message: z.string(),
              })
            ),
          },
        },
      },
      403: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.literal(false),
                message: z.string(),
              })
            ),
          },
        },
      },
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                success: z.literal(false),
                message: z.string(),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("json", transferSchema),
  async (c) => {
    try {
      // Get token from cookie
      const token = getCookie(c, "token");
      if (!token) {
        return c.json({ success: false, message: "Unauthorized" }, 401);
      }

      // Verify token and get user ID
      const { userId } = verifyToken(token);
      const { recipientId, amount, pin } = c.req.valid("json");

      if (recipientId === userId) {
        return c.json(
          { success: false, message: "You cannot transfer to yourself. Create a new account to test." },
          400
        );
      }

      // Start transaction
      return await db.transaction(async (tx) => {
        // Get sender and recipient
        const [sender, recipient] = await Promise.all([
          tx.query.users.findFirst({
            where: eq(users.userId, userId),
          }),
          tx.query.users.findFirst({
            where: eq(users.userId, recipientId),
          }),
        ]);

        if (!sender || !recipient) {
          return c.json({ success: false, message: "User not found" }, 404);
        }

        // Verify PIN
        if (sender.verificationPin !== pin) {
          return c.json({ success: false, message: "Invalid PIN" }, 403);
        }

        // Check balance
        if (sender.balance < amount) {
          return c.json(
            { success: false, message: "Insufficient balance" },
            400
          );
        }

        if (sender.userType === "user" && recipient.userType === "system") {
          return c.json(
            {
              success: false,
              message: "You cannot transfer to a system account!",
            },
            403
          );
        }

        // Update balances
        await Promise.all([
          tx
            .update(users)
            .set({ balance: sender.balance - amount })
            .where(eq(users.userId, userId)),
          tx
            .update(users)
            .set({ balance: recipient.balance + amount })
            .where(eq(users.userId, recipientId)),
        ]);

        return c.json({
          success: true,
          message: "Transfer successful",
          newBalance: sender.balance - amount,
        });
      });
    } catch (error) {
      console.error("Transfer error:", error);
      return c.json({ success: false, message: "Internal server error" }, 500);
    }
  }
);

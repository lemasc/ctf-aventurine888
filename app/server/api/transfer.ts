import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";

const transferSchema = z.object({
  recipientId: z.string().length(10, "Invalid recipient ID"),
  amount: z.number().int().positive("Amount must be positive"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

export const transferApp = new Hono()
  .post("/credit", zValidator("json", transferSchema), async (c) => {
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
          { success: false, message: "You cannot transfer to yourself!" },
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
          return c.json(
            { success: false, message: "User not found" },
            404
          );
        }

        if(sender.userType === "bot" || recipient.userType === "bot") {
          return c.json(
            { success: false, message: "Cannot send credits. Access denied." },
            403
          );
        }

        // Verify PIN
        if (sender.verificationPin !== pin) {
          return c.json(
            { success: false, message: "Invalid PIN" },
            403
          );
        }

        // Check balance
        if (sender.balance < amount) {
          return c.json(
            { success: false, message: "Insufficient balance" },
            400
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
  });
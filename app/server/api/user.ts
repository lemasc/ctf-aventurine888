import { Hono } from "hono";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";

export const userApp = new Hono().get("/", async (c) => {
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

    // Return user data without password
    return c.json(
      {
        success: true,
        user: {
          userId: user.userId,
          username: user.username,
          balance: user.balance,
          createdAt: user.createdAt,
          pin: user.verificationPin,
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
});

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "~/lib/db";
import { notifications } from "~/lib/db/schema";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";
import {
  generateNotificationId,
  getNotificatonsAndMarkNewAsRead,
} from "~/lib/notifications.server";

const notifySchema = z.object({
  receiverId: z.string().length(10, "Invalid receiver ID"),
  content: z.string().min(1, "Content is required"),
});

export const notificationsApp = new Hono()
  // Get all notifications for the current user
  .get("/", async (c) => {
    try {
      const token = getCookie(c, "token");
      if (!token) {
        return c.json({ success: false, message: "Unauthorized" }, 401);
      }

      const { userId } = verifyToken(token);

      const userNotifications = await getNotificatonsAndMarkNewAsRead(userId);
      return c.json(
        { success: true, notifications: userNotifications } as const,
        200
      );
    } catch (error) {
      console.error("Get notifications error:", error);
      return c.json(
        { success: false, message: "Internal server error" } as const,
        500
      );
    }
  })
  // Create a new notification
  .post("/notify", zValidator("json", notifySchema), async (c) => {
    try {
      const token = getCookie(c, "token");
      if (!token) {
        return c.json({ success: false, message: "Unauthorized" }, 401);
      }

      const { userId } = verifyToken(token);
      const { receiverId, content } = c.req.valid("json");

      // Create notification
      const notification = await db
        .insert(notifications)
        .values({
          id: generateNotificationId(),
          senderId: userId,
          receiverId,
          content,
          hasRead: false,
        })
        .returning()
        .get();

      return c.json({ success: true, notification } as const, 200);
    } catch (error) {
      console.error("Create notification error:", error);
      return c.json(
        { success: false, message: "Internal server error" } as const,
        500
      );
    }
  });

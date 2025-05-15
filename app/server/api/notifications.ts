import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";
import { db } from "~/lib/db";
import { notifications } from "~/lib/db/schema";
import { verifyToken } from "~/lib/auth";
import { getCookie } from "hono/cookie";
import {
  generateNotificationId,
  getNotificatonsAndMarkNewAsRead,
} from "~/lib/notifications.server";
import { errorSchema, successSchema } from "./shared/schema";
import { zNotification } from "~/lib/db/zod";

const notifySchema = z.object({
  receiverId: z.string().length(10, "Invalid receiver ID"),
  content: z.string().min(1, "Content is required"),
});

export const notificationsApp = new Hono()
  // Get all notifications for the current user
  .get(
    "/",
    describeRoute({
      description: "Get all notifications for the current user",
      tags: ["notifications"],
      responses: {
        200: {
          description: "Notifications retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(
                successSchema.extend({
                  notifications: z.array(zNotification),
                })
              ),
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
    }
  )
  // Create a new notification
  .post(
    "/notify",
    describeRoute({
      description: "Create a new notification. Supports text and HTML content.",
      tags: ["notifications"],
      responses: {
        200: {
          description: "Notification created successfully",
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
    zValidator("json", notifySchema),
    async (c) => {
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

        // checkAndTriggerBot(content);

        return c.json({ success: true, notification } as const, 200);
      } catch (error) {
        console.error("Create notification error:", error);
        return c.json(
          { success: false, message: "Internal server error" } as const,
          500
        );
      }
    }
  );

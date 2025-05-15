import { customAlphabet } from "nanoid";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { notifications } from "./db/schema";

// Generate notification ID
export const generateNotificationId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

export async function getNotificatonsAndMarkNewAsRead(userId: string) {
  const userNotifications = await db.query.notifications.findMany({
    where: eq(notifications.receiverId, userId),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
  });

  await db
    .update(notifications)
    .set({ hasRead: true })
    .where(
      inArray(
        notifications.id,
        userNotifications.filter((n) => !n.hasRead).map((n) => n.id)
      )
    );
  return userNotifications;
}

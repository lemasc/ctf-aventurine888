import { createSelectSchema } from "drizzle-zod";
import { notifications, users } from "./schema";

export const zUser = createSelectSchema(users);
export const zNotification = createSelectSchema(notifications);

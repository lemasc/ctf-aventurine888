import type { BotTask, XSSPayload } from "./types";
import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

class TaskQueue {
  private queue: BotTask[] = [];
  private processing = false;

  async add(payload: XSSPayload): Promise<void> {
    const sender = await db.query.users.findFirst({
      where: eq(users.userId, payload.userId),
    });

    if (!sender) {
      console.error(`Sender ${payload.userId} not found`);
      return;
    }

    // Get a random system user with balance > 0
    const receiver = await db.query.users.findFirst({
      where: eq(users.userType, "system"),
    });

    if (!receiver) {
      console.error("No system user found");
      return;
    }

    this.queue.push({
      sender,
      receiver,
      content: payload.content,
    });
  }

  async getNext(): Promise<BotTask | null> {
    if (this.processing || this.queue.length === 0) {
      return null;
    }
    this.processing = true;
    const task = this.queue.shift() || null;
    this.processing = false;
    return task;
  }

  get length(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.processing = false;
  }
}

export const taskQueue = new TaskQueue();

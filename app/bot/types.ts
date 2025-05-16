import type { User } from "~/lib/db/schema";

export interface XSSPayload {
  userId: string; // receiver user ID
  content: string; // potentially malicious content
}

export interface BotTask {
  sender: User;
  receiver: User;
  content: string;
}

export interface BrowserConfig {
  maxConcurrency: number;
  pageTimeout: number;
  queueTimeout: number;
  appUrl: string;
}

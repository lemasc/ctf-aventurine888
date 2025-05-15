import { BrowserManager } from "./browser";
import { taskQueue } from "./queue";
import type { XSSPayload } from "./types";
import DOMPurify from "isomorphic-dompurify";

class BotController {
  private browserManager: BrowserManager;
  private queueCheckInterval: NodeJS.Timeout | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.browserManager = new BrowserManager();
  }

  async processQueue(): Promise<void> {
    const task = await taskQueue.getNext();
    if (task) {
      await this.browserManager.processTask(task);
    }
  }

  private startQueueProcessing(): void {
    // Process queue every 250ms
    this.queueCheckInterval = setInterval(async () => {
      await this.processQueue();

      // If queue is empty and no active pages, close browser after timeout
      if (taskQueue.length === 0 && !this.browserManager.isActive) {
        this.stop();
      }
    }, 250);
  }

  async addPayload(payload: XSSPayload): Promise<void> {
    const sanitized = DOMPurify.sanitize(payload.content);

    // If sanitized content is different, it contained potentially malicious HTML
    if (sanitized !== payload.content) {
      await taskQueue.add(payload);

      // Debounce browser start
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(async () => {
        if (!this.browserManager.isActive) {
          await this.start();
        }
      }, 250);
    }
  }

  async start(): Promise<void> {
    if (this.browserManager.isActive) return;

    await this.browserManager.init();
    this.startQueueProcessing();
  }

  async stop(): Promise<void> {
    if (this.queueCheckInterval) {
      clearInterval(this.queueCheckInterval);
      this.queueCheckInterval = null;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    await this.browserManager.close();
    taskQueue.clear();
  }

  get isRunning(): boolean {
    return this.browserManager.isActive;
  }
}

// Export singleton instance
export const botController = new BotController();

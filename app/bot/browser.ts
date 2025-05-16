import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";
import type { BrowserConfig, BotTask } from "./types";
import { generateToken } from "~/lib/auth";

const DEFAULT_CONFIG: BrowserConfig = {
  maxConcurrency: 5,
  pageTimeout: 3000,
  queueTimeout: 10000,
  appUrl: process.env.VITE_APP_URL || "http://localhost:3000",
};

export class BrowserManager {
  private browser: Browser | null = null;
  private activePages = 0;
  private config: BrowserConfig;
  private closeTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async init(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: import.meta.env.PROD,
      args: ["--no-sandbox"],
      devtools: import.meta.env.DEV,
    });
  }

  async processTask(task: BotTask): Promise<void> {
    if (!this.browser || this.activePages >= this.config.maxConcurrency) {
      return;
    }

    if(this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.activePages++;
    const page = await this.browser.newPage();

    try {
      // Set up request interception for JWT injection
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if(request.isInterceptResolutionHandled()) {
          return;
        }
        const url = request.url();
        if (url.startsWith(this.config.appUrl)) {
          const headers = request.headers();
          headers["cookie"] = `token=${generateToken({
            userId: task.sender.userId,
            username: task.sender.username,
          })}`;
          request.continue({ headers });
        } else {
          request.continue();
        }
      });

      // Auto-dismiss dialogs
      page.on("dialog", (dialog) => dialog.dismiss());

      // Set timeout
      page.setDefaultNavigationTimeout(this.config.pageTimeout);

      // Navigate to app
      await page.goto(`${this.config.appUrl}/app`, {
        waitUntil: "networkidle0"
      });

      // Wait for potential XSS execution
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Fill and submit transfer form
      // const amount = Math.floor(Math.random() * 0.5 * task.sender.balance)
      // await page.type("#recipientId", task.receiver.userId);
      // await page.type("#amount", amount.toString());
      // await page.type("#transferPin", task.receiver.verificationPin || "");
      // await page.click("button[type=submit]");
      
      // Wait for potential XSS execution
      // await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("Error processing task:", error);
    } finally {
      await page.close();
      this.activePages--;
    }
    if(this.activePages === 0) {
      this.closeTimeout = setTimeout(() => {
        this.close();
      }, this.config.queueTimeout);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activePages = 0;
    }
  }

  get isActive(): boolean {
    return this.browser !== null;
  }
}

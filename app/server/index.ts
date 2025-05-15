import { Hono } from "hono";
import { apiApp } from "./api";

export const app = new Hono().route("/api", apiApp);

export type AppType = typeof app;

export const serverFetch =
  (originalRequest: Request) =>
  async (url: string | Request | URL, options?: RequestInit) => {
    const headers = new Headers(originalRequest.headers);
    return app.request(url, { ...options, headers });
  };



import { Hono } from "hono";
import { createHonoServer } from "react-router-hono-server/node";
import { apiApp } from "./api";

const app = new Hono().route("/api", apiApp);

export type AppType = typeof app;

export const serverFetch =
  (originalRequest: Request) =>
  async (url: string | Request | URL, options: RequestInit | undefined) => {
    const headers = new Headers(originalRequest.headers);
    return app.request(url, { ...options, headers });
  };

export default await createHonoServer({
  app,
});

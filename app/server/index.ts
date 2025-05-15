import { Hono } from "hono";
import { createHonoServer } from "react-router-hono-server/node";
import { openAPISpecs } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { apiApp } from "./api";

export const app = new Hono().route("/api", apiApp);

export type AppType = typeof app;

app.get(
  "/api/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Aventurine888",
        version: "1.0.0",
        description:
          "Backend API for Aventurine888 service. Here are full details of each API routes, and may tell the truth of the world!",
      },
      tags: [
        {
          name: "auth",
          description: "Authentication",
        },
        {
          name: "user",
          description: "User",
        },
        {
          name: "transfer",
          description: "Credit Transfer",
        },
      ],
    },
  })
);

app.get(
  "/api/docs",
  Scalar({
    url: "/api/openapi",
    darkMode: true,
    theme: "deepSpace",
    layout: "classic",
    pageTitle: "Aventurine888 API Documentation",
    baseServerURL: "/api",
    defaultHttpClient: {
      targetKey: "js",
      clientKey: "fetch",
    },
  })
);

export default await createHonoServer({
  app,
  hostname: "127.0.0.1",
});

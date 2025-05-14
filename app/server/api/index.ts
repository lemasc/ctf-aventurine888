import { Hono } from "hono";

const app = new Hono().get("/", (c) => {
  return c.text("Hello from Hono!");
});

export { app as apiApp };

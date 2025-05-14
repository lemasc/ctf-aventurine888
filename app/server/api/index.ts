import { Hono } from "hono";
import { authApp } from "./auth";

const app = new Hono().route("/", authApp).get("/", (c) => {
  return c.text("Hello from Hono!");
});

export { app as apiApp };

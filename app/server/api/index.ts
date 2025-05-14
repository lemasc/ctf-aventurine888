import { Hono } from "hono";
import { authApp } from "./auth";
import { userApp } from "./user";
import { transferApp } from "./transfer";

const app = new Hono()
  .route("/", authApp)
  .route("/user", userApp)
  .route("/transfer", transferApp)
  .get("/", (c) => {
    return c.text("Hello from Hono!");
  });

export { app as apiApp };
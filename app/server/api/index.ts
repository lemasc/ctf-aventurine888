import { Hono } from "hono";
import { authApp } from "./auth";
import { userApp } from "./user";
import { transferApp } from "./transfer";
import { notificationsApp } from "./notifications";

const app = new Hono()
  .route("/", authApp)
  .route("/user", userApp)
  .route("/transfer", transferApp)
  .route("/notifications", notificationsApp)
  .get("/", (c) => {
    return c.text("Hello from Hono!");
  });

export { app as apiApp };
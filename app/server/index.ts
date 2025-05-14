import { Hono } from "hono";
import { createHonoServer } from "react-router-hono-server/node";
import { apiApp } from "./api";

const app = new Hono().route("/api", apiApp);

export default await createHonoServer({
  app,
});

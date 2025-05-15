import { app } from ".";
import { createHonoServer } from "react-router-hono-server/node";

export default await createHonoServer({
  app,
  hostname: "127.0.0.1",
});

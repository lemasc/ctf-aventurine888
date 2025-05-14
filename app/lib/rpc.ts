import { hc } from "hono/client";
import type { AppType } from "~/server";

if (!import.meta.env.VITE_APP_URL) {
  throw new Error("VITE_APP_URL is not defined");
}
export const rpc = hc<AppType>(import.meta.env.VITE_APP_URL);

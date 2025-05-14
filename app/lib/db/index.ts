import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file");
}
const client = createClient({ url: process.env.DATABASE_URL as string });
export const db = drizzle(client, { schema });

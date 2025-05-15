import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { hashPassword } from "~/lib/auth";

async function main() {
  console.log("Creating initial users...");
  await db
    .insert(users)
    .values({
      // use stable id to track conflcts
      userId: "7BC1PNH99L",
      username: "madamherta",
      password: await hashPassword("herta555"),
      balance: 160,
    })
    .onConflictDoNothing();
}

main().then(() => {
  console.log("Database seeded successfully");
});

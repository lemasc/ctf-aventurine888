import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { hashPassword } from "~/lib/auth";
import creds from "../mock-creds.json"

async function main() {
  console.log("Creating initial users...");
  for (const cred of creds) {
    await db
    .insert(users)
    .values({
      userId: cred.userId,
      username: cred.username,
      password: await hashPassword(cred.password),
      balance: cred.balance,
      userType: "system",
      verificationPin: cred.verificationPin
    })
    .onConflictDoNothing();
  }
}

main().then(() => {
  console.log("Database seeded successfully");
});

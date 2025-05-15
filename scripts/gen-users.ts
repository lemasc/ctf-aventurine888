import { HSR_CHARACTERS, HSR_HIGH_CHARACTERS } from "../app/lib/characters";
import { customAlphabet, nanoid } from "nanoid";
import { writeFileSync } from "fs";
import { generateUserId } from "../app/lib/random";

const idNumbersOnly = customAlphabet("0123456789", 4);

async function main() {
  const userIds = new Set<string>();
  const characters = [...HSR_HIGH_CHARACTERS, ...HSR_CHARACTERS] as const;
  const creds = characters.map((character, i) => {
    let userId = generateUserId();
    while (userIds.has(userId)) {
      userId = generateUserId();
    }
    userIds.add(userId);
    if (character === "Herta") {
      return {
        userId,
        username: "madamherta",
        password: "herta555",
        balance: 160,
      };
    }

    const isHigh = i < HSR_HIGH_CHARACTERS.length;
    const balance = isHigh
      ? 1000 + Math.floor(Math.random() * 500) * 10
      : 200 + Math.floor(Math.random() * 50) * 10;
    return {
      userId,
      username: character.replaceAll(" ", "").toLowerCase() + idNumbersOnly(),
      password: nanoid(8),
      balance,
    };
  });

  writeFileSync("mock-creds.json", JSON.stringify(creds, null, 2));
}

main();

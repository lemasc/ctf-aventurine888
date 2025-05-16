import { HSR_CHARACTERS, HSR_HIGH_CHARACTERS } from "../app/lib/characters";
import { customAlphabet, nanoid } from "nanoid";
import { writeFileSync } from "fs";
import { generateUserId } from "../app/lib/random";

const idNumbersOnly = customAlphabet("0123456789", 4);

const hertaUserId = "7BC1PNH99L";

async function main() {
  const userIds = new Set<string>([hertaUserId]);
  const characters = [...HSR_HIGH_CHARACTERS, ...HSR_CHARACTERS] as const;
  const creds = characters.map((character, i) => {
    if (character === "Herta") {
      return {
        userId: hertaUserId,
        username: "madamherta",
        password: "herta555",
        balance: 160,
        verificationPin: null,
      };
    }
    let userId = generateUserId();
    while (userIds.has(userId)) {
      userId = generateUserId();
    }
    userIds.add(userId);
    const isHigh = i < HSR_HIGH_CHARACTERS.length;
    const balance = isHigh
      ? 1000 + Math.floor(Math.random() * 500) * 10
      : 200 + Math.floor(Math.random() * 50) * 10;
    return {
      userId,
      username: character.replaceAll(" ", "").toLowerCase() + idNumbersOnly(),
      password: nanoid(8),
      balance,
      verificationPin: idNumbersOnly(6),
    };
  });

  writeFileSync("mock-creds.json", JSON.stringify(creds, null, 2));
}

main();

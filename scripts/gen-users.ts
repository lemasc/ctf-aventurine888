import { HSR_CHARACTERS, HSR_HIGH_CHARACTERS } from "../app/lib/characters";
import { customAlphabet, nanoid } from "nanoid";
import { writeFileSync } from "fs";
import { generateUserId } from "../app/lib/random";

const idNumbersOnly = customAlphabet("0123456789", 4);

const hertaUserId = "7BC1PNH99L";

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function main() {
  const userIds = new Set<string>([hertaUserId]);
  const characters = [...HSR_HIGH_CHARACTERS, ...HSR_CHARACTERS] as const;
  const shuffledCharacters = shuffleArray(characters.slice());
  const creds = shuffledCharacters
    .map((character, i) => {
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
        ? 1000 + Math.floor(Math.random() * 400) * 10
        : 200 + Math.floor(Math.random() * 50) * 10;
      return {
        userId,
        username: character.replaceAll(" ", "").toLowerCase() + idNumbersOnly(),
        password: nanoid(8),
        balance,
        verificationPin: idNumbersOnly(6),
      };
    })
    .sort((a, b) => a.userId.localeCompare(b.userId));

  writeFileSync("mock-creds.json", JSON.stringify(creds, null, 2));
}

main();

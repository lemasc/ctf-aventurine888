import { customAlphabet } from "nanoid";

export const generateUserId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

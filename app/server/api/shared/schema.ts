import { z } from "zod";

export const PIN_REGEX = /^\d{6}$/;

export const pinSchema = z.string().regex(PIN_REGEX, "PIN must be 6 digits");

export const successSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const errorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

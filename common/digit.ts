import { regex } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a single digit
 *
 * * Regex: /^\d/
 */

export const digit: Parser<number> = regex(/^\d/).map(Number.parseInt).error(
  parseErrors.digit,
);

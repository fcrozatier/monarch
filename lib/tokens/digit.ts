import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser/main.ts";
import { regex } from "./regex.ts";

/**
 * Parses a single digit
 *
 * * Regex: /^\d/
 */
export const digit: Parser<number> = regex(/^\d/).map(Number.parseInt).error(
  parseErrors.digit,
);

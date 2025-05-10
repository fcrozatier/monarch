import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";

/**
 * Parses a single letter (case insensitive)
 *
 * Regex: /^[a-zA-Z]/
 */
export const letter: Parser<string> = regex(/^[a-zA-Z]/).error(
  parseErrors.letter,
);

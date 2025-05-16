import { regex } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a single letter (case insensitive)
 *
 * Regex: /^[a-zA-Z]/
 */
export const letter: Parser<string> = regex(/^[a-zA-Z]/).error(
  parseErrors.letter,
);

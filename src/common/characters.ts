import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";
import { regex } from "./mod.ts";

/**
 * Parses alphanumeric characters (0+)
 *
 * Regex: \w*
 */
export const alphaNums: Parser<string> = regex(/^\w*/);

/**
 * Parses a single lower case letter
 *
 * Regex: [a-z]
 */
export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

/**
 * Parses a single upper case letter
 *
 * Regex: [A-Z]
 */
export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

/**
 * Parses a single letter (case insensitive)
 *
 * Regex: [a-zA-Z]
 */
export const letter: Parser<string> = regex(/^[a-zA-Z]/).error(
  parseErrors.letter,
);

/**
 * Parses many letters (0+)
 *
 * Regex: [a-zA-Z]*
 */
export const letters: Parser<string> = regex(/^[a-zA-Z]*/);

/**
 * Parses an identifier as letter + alphanums
 */
export const identifier: Parser<string> = letter.bind((l) =>
  alphaNums.map((rest) => l + rest)
);

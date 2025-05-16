import { regex } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a single white space with the regex `/\s\/`
 *
 * @throws Throws "Expected a white space character" when the parse fails
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  parseErrors.whitespace,
);

import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";
/**
 * Parses a single white space with the regex `/\s\/`
 *
 * @throws Throws "Expected a white space character" when the parse fails
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  "Expected a white space character",
);

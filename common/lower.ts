import { regex } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a single lower case letter
 *
 * * Regex: /^[a-z]/
 */

export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

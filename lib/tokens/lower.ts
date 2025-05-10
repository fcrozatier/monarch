import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";

/**
 * Parses a single lower case letter
 *
 * * Regex: /^[a-z]/
 */
export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

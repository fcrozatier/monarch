import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";

/**
 * Parses a single upper case letter
 *
 * * Regex: /^[A-Z]/
 */
export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

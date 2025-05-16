import { regex } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a single upper case letter
 *
 * * Regex: /^[A-Z]/
 */

export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

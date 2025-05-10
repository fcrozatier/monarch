import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";

/**
 * Parses white spaces (0 or more)
 *
 * Regex: /\s*\/
 */
export const whitespaces: Parser<string> = regex(/^\s*/);

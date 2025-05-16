import { regex } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses whitespaces (0 or more)
 *
 * Regex: /\s*\/
 */

export const whitespaces: Parser<string> = regex(/^\s*/);

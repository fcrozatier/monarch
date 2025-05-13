import type { Parser } from "../../src/parser/main.ts";
import { regex } from "./regex.ts";

/**
 * Parses white spaces (1 or more)
 *
 * Regex: /\s+\/
 */
export const whitespaces1: Parser<string> = regex(/^\s+/);

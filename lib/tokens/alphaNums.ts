import type { Parser } from "../../src/parser/main.ts";
import { regex } from "./regex.ts";

/**
 * Parses alphanumeric characters (0 or more)
 *
 * * Regex: /^\w*\/
 */
export const alphaNums: Parser<string> = regex(/^\w*/);

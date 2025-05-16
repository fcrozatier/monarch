import { regex } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses alphanumeric characters (0 or more)
 *
 * Regex: /^\w*\/
 */
export const alphaNums: Parser<string> = regex(/^\w*/);

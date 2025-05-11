import type { Parser } from "../../src/parser.ts";
import { regex } from "./regex.ts";

/**
 * Parses the newline character
 */
export const newline: Parser<string> = regex(/^\n/);

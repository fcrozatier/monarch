import type { Parser } from "../../src/parser/main.ts";
import { regex } from "./regex.ts";

/**
 * Parses the newline character
 */
export const newline: Parser<string> = regex(/^\n/);

import type { Parser } from "../../src/index.ts";
import { regex } from "./regex.ts";

/**
 * Parses the newline character
 */
export const newline: Parser<string> = regex(/^\n/);

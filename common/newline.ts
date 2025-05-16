import { regex } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses the newline character
 */

export const newline: Parser<string> = regex(/^\n/);

import { regex } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses whitespaces (1 or more)
 *
 * Regex: /\s+\/
 */

export const whitespaces1: Parser<string> = regex(/^\s+/);

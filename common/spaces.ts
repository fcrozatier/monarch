import { regex } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses the space character (0 or more)
 */

export const spaces: Parser<string> = regex(/^ */);

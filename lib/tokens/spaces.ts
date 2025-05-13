import type { Parser } from "../../src/parser/main.ts";
import { regex } from "./regex.ts";

/**
 * Parses the space character (0 or more)
 */
export const spaces: Parser<string> = regex(/^ */);

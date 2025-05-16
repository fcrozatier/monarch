import { alphaNums, letter } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses an identifier token as letter + alphanums
 */

export const identifier: Parser<string> = letter.bind((l) =>
  alphaNums.map((rest) => l + rest)
);

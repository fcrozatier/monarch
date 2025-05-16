import { digit, spaces } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import { foldL1, type Parser } from "../index.ts";
import { result } from "../primitives/mod.ts";

/**
 * Parses a natural number
 */

export const natural: Parser<number> = foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
).skipTrailing(spaces).error(parseErrors.natural);

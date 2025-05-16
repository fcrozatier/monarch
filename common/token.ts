import { literal, whitespaces } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a literal and discards trailing spaces
 *
 * @param value The literal value to parse
 * @param trailing The kind of whitespace to skip. Default to {@linkcode whitespaces}
 */

export function token(value: string, trailing = whitespaces): Parser<string> {
  return literal(value).skipTrailing(trailing);
}

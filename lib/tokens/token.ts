import type { Parser } from "../../src/index.ts";
import { first } from "../combinators/sequencing/first.ts";
import { literal } from "./literal.ts";
import { whitespaces } from "./whitespaces.ts";

/**
 * Parses a token and discards trailing spaces
 */
export function token(value: string): Parser<string> {
  return first(literal(value), whitespaces);
}

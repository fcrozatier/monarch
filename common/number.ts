import { alt } from "../combinators/alternation/mod.ts";
import { decimal, integer } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a number as decimal | integer
 */

export const number: Parser<number> = alt(decimal, integer).error(
  parseErrors.number,
);

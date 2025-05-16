import { alt } from "../combinators/alternation/mod.ts";
import { literal, natural } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = alt(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

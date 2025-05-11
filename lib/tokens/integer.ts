import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser.ts";
import { or } from "../combinators/choice/or.ts";
import { literal } from "./literal.ts";
import { natural } from "./natural.ts";

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = or(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

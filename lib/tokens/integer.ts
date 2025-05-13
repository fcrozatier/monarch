import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser/main.ts";
import { alt } from "../combinators/choice/alt.ts";
import { literal } from "./literal.ts";
import { natural } from "./natural.ts";

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = alt(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

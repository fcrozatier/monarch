import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser/main.ts";
import { alt } from "../combinators/choice/alt.ts";
import { decimal } from "./decimal.ts";
import { integer } from "./integer.ts";

/**
 * Parses a number as decimal | integer
 */
export const number: Parser<number> = alt(decimal, integer).error(
  parseErrors.number,
);

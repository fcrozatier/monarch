import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/index.ts";
import { or } from "../combinators/choice/or.ts";
import { decimal } from "./decimal.ts";
import { integer } from "./integer.ts";

/**
 * Parses a number as decimal | integer
 */
export const number: Parser<number> = or(decimal, integer).error(
  parseErrors.number,
);

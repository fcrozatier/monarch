import { seq } from "../combinators/sequencing/seq.ts";
import { integer, literal, natural, spaces } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a decimal number aka a float
 */

export const decimal: Parser<number> = seq(
  integer,
  literal("."),
  natural,
).map(([integral, _, fractional]) =>
  integral +
  Math.sign(integral) * Math.pow(10, -Math.ceil(Math.log10(fractional))) *
    fractional
).skipTrailing(spaces).error(parseErrors.decimal);

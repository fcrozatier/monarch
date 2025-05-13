import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser/main.ts";
import { sequence } from "../combinators/sequencing/sequence.ts";
import { first } from "../combinators/sequencing/first.ts";
import { integer } from "./integer.ts";
import { literal } from "./literal.ts";
import { natural } from "./natural.ts";
import { spaces } from "./spaces.ts";

/**
 * Parses a decimal number aka a float
 */
export const decimal: Parser<number> = first(
  sequence([
    integer,
    literal("."),
    natural,
  ]).map(([integral, _, fractional]) =>
    integral +
    Math.sign(integral) * Math.pow(10, -Math.ceil(Math.log10(fractional))) *
      fractional
  ),
  spaces,
).error(parseErrors.decimal);

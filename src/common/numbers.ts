import { alt, foldL1, seq } from "$combinators";
import { literal, regex } from "$common";
import { parseErrors } from "../errors.ts";
import type { Parser } from "$core";
import { result } from "$core";
import { spaces } from "./whitespaces.ts";

/**
 * Parses a single digit
 *
 * Regex: \d
 */
export const digit: Parser<number> = regex(/^\d/).map(Number.parseInt).error(
  parseErrors.digit,
);

/**
 * Parses a natural number (an element of ℕ)
 */
export const natural: Parser<number> = foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
).skipTrailing(spaces).error(parseErrors.natural);

/**
 * Parses an integer (an element of ℤ)
 */
export const integer: Parser<number> = alt(
  literal("-").flatMap(() => natural).map((x) => -x),
  literal("+").flatMap(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

/**
 * Parses a decimal number (a float)
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

/**
 * Parses a number  (decimal | integer)
 *
 * @see {@linkcode decimal}
 * @see {@linkcode integer}
 */
export const number: Parser<number> = alt(decimal, integer).error(
  parseErrors.number,
);

import type { Parser } from "../../../src/parser/main.ts";
import { sepBy } from "./sepBy.ts";

/**
 * Repeats a parser and a separator greedily 1 or more times
 *
 * - alias for `sepBy(parser, separator, 1)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy1(digit, literal(","));
 *
 * numbers.parse("1,2,3,a,b,c");
 * // results: [{ value: [1, 2, 3], remaining: ",a,b,c" }]
 * numbers.parse("1");
 * // results: [{ value: [1], remaining: "" }]
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode sepBy}
 */
export const sepBy1 = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
): Parser<T[]> => sepBy(parser, separator, 1);

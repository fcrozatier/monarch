import type { Parser } from "../../../src/parser/main.ts";
import { sepBy } from "./sepBy.ts";

/**
 * Repeats a parser and a separator greedily 0 or more times
 *
 * - alias for `sepBy(parser, separator, 0)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy0(digit, literal(","));
 *
 * numbers.parse("1,2,3,a,b,c");
 * // results: [{ value: [1, 2, 3], remaining: ",a,b,c" }]
 * numbers.parse("1");
 * // results: [{ value: [1], remaining: "" }]
 * numbers.parse("");
 * // results: [{ value: [], remaining: "" }]
 * ```
 *
 * @see {@linkcode sepBy}
 */
export const sepBy0 = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
): Parser<T[]> => sepBy(parser, separator, 0);

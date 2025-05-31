import type { Parser } from "$core";
import { repeat } from "$combinators";

/**
 * Repeats a parser greedily 0 or more times
 *
 * - alias for `repeat(parser, 0)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = repeat0(digit);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }]
 * numbers.parse("1");
 * // [{ value: [1], remaining: "", ... }]
 * numbers.parse("");
 * // results: [{ value: [], remaining: "" }]
 * ```
 *
 * @see {@linkcode repeat}
 */
export const repeat0 = <T>(parser: Parser<T>): Parser<T[]> => repeat(parser, 0);

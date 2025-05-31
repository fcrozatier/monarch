import type { Parser } from "$core";
import { repeat } from "$combinators";

/**
 * Repeats a parser a specific number of times
 *
 * - alias for `repeat(parser, times, times)`
 *
 * @param parser The parser
 * @param times The specific number of times the parser must succeed
 * @returns A parser returning an array of parse results
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = repeatN(digit, 2);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2], remaining: "3abc", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode repeat}
 */
export const repeatN = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times < 0) {
    throw new Error("repeatN: times cannot be negative");
  }
  return repeat(parser, times, times);
};

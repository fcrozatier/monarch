import type { Parser } from "$core";
import { many } from "$combinators";

/**
 * Repeats a parser a predefined number of times
 *
 * - alias for `many(parser, times, times)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = repeat(digit, 2);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2], remaining: "3abc", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode many}
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times < 0) {
    throw new Error("repeat: times cannot be negative");
  }
  return many(parser, times, times);
};

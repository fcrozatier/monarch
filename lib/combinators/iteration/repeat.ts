import type { Parser } from "../../../src/parser/main.ts";
import { zero } from "../../primitives/zero.ts";
import { many } from "./many.ts";

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
    return zero.error("repeat: times cannot be negative");
  }
  return many(parser, times, times);
};

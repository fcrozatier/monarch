import type { Parser } from "../../../src/parser/main.ts";
import { many } from "./many.ts";

/**
 * Repeats a parser greedily 1 or more times
 *
 * - alias for `many(parser, 1)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many1(digit);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }]
 * numbers.parse("1");
 * // [{ value: [1], remaining: "", ... }]
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode many}
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => many(parser, 1);

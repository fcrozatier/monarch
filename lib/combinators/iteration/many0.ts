import type { Parser } from "../../../src/parser/main.ts";
import { many } from "./many.ts";

/**
 * Repeats a parser greedily 0 or more times
 *
 * - alias for `many(parser, 0)`
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many0(digit);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }]
 * numbers.parse("1");
 * // [{ value: [1], remaining: "", ... }]
 * numbers.parse("");
 * // results: [{ value: [], remaining: "" }]
 * ```
 *
 * @see {@linkcode many}
 */
export const many0 = <T>(parser: Parser<T>): Parser<T[]> => many(parser, 0);

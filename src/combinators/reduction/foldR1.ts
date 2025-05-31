import type { Parser } from "$core";
import { foldR } from "$combinators";

/**
 * Repeats a parser and a right-associative operator parser greedily 1 or more times, inclusive. Alias for `foldR(itemParser, operatorParser, 1)`
 *
 * @example Exponentiation
 *
 * ```ts
 * const caret = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR1(digit, caret);
 *
 * exponentiation.parse("3^2^1^a^b^c");
 * // results: [{ value: 9, remaining: "^a^b^c" }]
 * exponentiation.parse("1");
 * // results: [{ value: 1, remaining: "" }]
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldR1 = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
): Parser<T> => foldR(parser, operator, 1);

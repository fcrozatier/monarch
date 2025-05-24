import type { Parser } from "$core";
import { foldL } from "$combinators";

/**
 * Repeats an item parser and a left-associative operator parser greedily 1 or more times, inclusive. Alias for `foldL(itemParser, operatorParser, 1)`
 *
 * @example Addition
 *
 * ```ts
 * const plus = literal("+").map(() => (a: number, b: number) => a + b);
 * const addition = foldL1(digit, plus);
 *
 * addition.parse("1+2+3+a+b+c");
 * // results: [{ value: 6, remaining: "+a+b+c" } ]
 * addition.parse("1");
 * // results: [{ value: 1, remaining: "" } ]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldL1 = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
): Parser<T> => foldL(parser, operator, 1);

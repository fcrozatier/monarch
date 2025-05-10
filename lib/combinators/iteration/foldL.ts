import type { Parser } from "../../../src/index.ts";
import { or } from "../choice/or.ts";
import { foldL1 } from "./foldL1.ts";

/**
 * Parses maybe-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 *
 * @example Addition
 *
 * We lift the addition literal `+` into a binary function parser and apply a left fold
 *
 * ```ts
 * const add = literal("+").map(() => (a: number, b: number) => a + b);
 * const addition = foldL(number, add);
 *
 * addition.parse("1+2+3"); // results: [{value: 6, remaining: "" }]
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldL = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return or(foldL1(item, operator), item);
};

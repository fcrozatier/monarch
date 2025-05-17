import { alt } from "../alternation/mod.ts";
import { foldL1 } from "./foldL1.ts";
import type { Parser } from "$core";

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
 * addition.parseOrThrow("1+2+3"); // 6
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldL = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return alt(foldL1(item, operator), item);
};

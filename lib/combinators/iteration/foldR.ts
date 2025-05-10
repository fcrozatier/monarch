import type { Parser } from "../../../src/index.ts";
import { or } from "../choice/or.ts";
import { foldR1 } from "./foldR1.ts";

/**
 * Parses maybe-empty sequences of items separated by an operator parser that associates to the right and performs the fold
 *
 * @example Exponentiation
 *
 * We lift the power literal `^` into a binary function parser and apply a right fold since exponentiation associates to the right
 *
 * ```ts
 * const pow = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR(number, pow);
 *
 * exponentiation.parse("2^2^3");
 * // results: [{value: 256, remaining: ""}]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldR = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return or(foldR1(item, operator), item);
};

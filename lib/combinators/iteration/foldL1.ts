import type { Parser } from "../../../src/index.ts";
import { result } from "../../primitives/result.ts";
import { or } from "../choice/or.ts";

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 *
 * @example Slick natural number parser implementation
 *
 * We revisit the `natural` parser as a sequence of digits that are combined together
by folding a binary operator around the digits.
 *
 * ```ts
 * const natural = foldL1(digit, result((a: number, b: number) => 10 * a + b));
 *
 * natural.parse("123"); // results: [{value: 123, remaining: ""}]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldL1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  const rest = (x: T): Parser<T> => {
    return or(
      operator.bind((f) => item.bind((y) => rest(f(x, y)))),
      result(x),
    );
  };
  return item.bind(rest);
};

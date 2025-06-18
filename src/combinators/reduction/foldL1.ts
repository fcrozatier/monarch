import { alt } from "../alternation/mod.ts";
import type { Parser } from "$core";
import { result } from "$core";

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 *
 * @example Natural numbers
 *
 * Natural numbers can be expressed as a sequence of digits combined together in base 10
 *
 * ```ts
 * import { foldL1, result } from '@fcrozatier/monarch';
 * import { digit } from '@fcrozatier/monarch/common';
 *
 * const natural = foldL1(digit, result((a: number, b: number) => 10 * a + b));
 *
 * natural.parseOrThrow("123"); // 123
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldL1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  const rest = (x: T): Parser<T> => {
    return alt(
      operator.chain((f) => item.chain((y) => rest(f(x, y)))),
      result(x),
    );
  };
  return item.chain(rest);
};

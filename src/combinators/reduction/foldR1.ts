import { alt } from "../alternation/mod.ts";
import type { Parser } from "$core";
import { result } from "$core";

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the right and performs the fold
 *
 * @see {@linkcode foldR}
 */
export const foldR1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return item.bind((x) => {
    return alt(
      operator.bind((f) => foldR1(item, operator).bind((y) => result(f(x, y)))),
      result(x),
    );
  });
};

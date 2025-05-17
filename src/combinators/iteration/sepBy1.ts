import type { Parser } from "$core";
import { result } from "$core";
import { many } from "./many.ts";

/**
 * Recognizes non-empty sequences of a given parser and separator, and ignores the separator
 *
 * @see {@linkcode sepBy}
 */
export const sepBy1 = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return parser.bind((x) =>
    many(sep.bind(() => parser)).bind((rest) => result([x, ...rest]))
  );
};

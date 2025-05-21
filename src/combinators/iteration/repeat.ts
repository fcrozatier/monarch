import type { Parser } from "$core";
import { result } from "$core";

/**
 * Repeats a parser a predefined number of times
 *
 * @example Repeated {@linkcode anyChar}
 *
 * ```ts
 * const { results } = repeat(anyChar, 2).parse("hello"); // [{value: 'he', remaining: 'llo', ...}]
 * ```
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times > 0) {
    return parser.flatMap((a) =>
      repeat(parser, times - 1).flatMap((rest) => result([a, ...rest]))
    );
  }
  return result([]);
};

import type { Parser } from "$core";
import { result } from "$core";

/**
 * Repeats a parser a predefined number of times
 *
 * @example Repeated {@linkcode anyChar}
 *
 * ```ts
 * import { repeat } from "@fcrozatier/monarch";
 * import { anyChar } from "@fcrozatier/monarch/common";
 *
 * repeat(anyChar, 2).parse("hello");
 * // [{value: 'he', remaining: 'llo', ...}]
 * ```
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times > 0) {
    return parser.chain((a) =>
      repeat(parser, times - 1).chain((rest) => result([a, ...rest]))
    );
  }
  return result([]);
};

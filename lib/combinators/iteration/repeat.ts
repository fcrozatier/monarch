import type { Parser } from "../../../src/index.ts";
import { result } from "../../primitives/result.ts";

/**
 * Repeats a parser a predefined number of times
 *
 * @example Repeated {@linkcode take}
 *
 * ```ts
 * const { results } = repeat(take, 2).parse("hello"); // [{value: 'he', remaining: 'llo', ...}]
 * ```
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times > 0) {
    return parser.bind((a) =>
      repeat(parser, times - 1).bind((rest) => result([a, ...rest]))
    );
  }
  return result([]);
};

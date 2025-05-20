import type { Parser } from "$core";
import { result } from "$core";
import { any } from "$combinators";

/**
 * Returns an array of all iterated parses
 *
 * @example
 *
 * ```ts
 * const { results } = iterate(digit).parse("42");
 * // [{value: [4, 2], remaining: ""}, {value: [4], remaining: "2"}, {value: [], remaining: "42"}]
 * ```
 */
export const iterate = <T>(parser: Parser<T>): Parser<T[]> => {
  return any(
    parser.bind((a) => iterate(parser).bind((x) => result([a, ...x]))),
    result([]),
  );
};

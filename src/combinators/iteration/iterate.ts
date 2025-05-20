import type { Parser } from "$core";
import { result } from "$core";
import { explore } from "$combinators";

/**
 * Returns an array of all iterated parses
 *
 * @example
 *
 * ```ts
 * const { results } = iterate(digit).parse("42");
 * // [{value: [4, 2], remaining: ""}, {value: [4], remaining: "2"}, {value: [], remaining: "42"}]
 * ```
 *
 * @see {@linkcode explore}
 */
export const iterate = <T>(parser: Parser<T>): Parser<T[]> => {
  return explore(
    parser.bind((a) => iterate(parser).bind((x) => result([a, ...x]))),
    result([]),
  );
};

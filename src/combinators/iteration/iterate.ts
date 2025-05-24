import type { Parser } from "$core";
import { result } from "$core";
import { explore } from "$combinators";

/**
 * A parser that runs a parser iteratively
 *
 * @param parser The parser
 * @returns A parser returning an array of iterative parse results
 *
 * @example
 *
 * ```ts
 * const digits = iterate(digit);
 *
 * digits.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }, { value: [1, 2], remaining: "3abc", ... }, { value: [1], remaining: "23abc", ... }, { value: [], remaining: "123abc", ... }]
 * ```
 */
export const iterate = <T>(parser: Parser<T>): Parser<T[]> => {
  return explore(
    parser.flatMap((a) => iterate(parser).flatMap((x) => result([a, ...x]))),
    result([]),
  );
};

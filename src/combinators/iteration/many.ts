import { alt } from "../alternation/alt.ts";
import type { Parser } from "$core";
import { result } from "$core";

/**
 * Returns the longest matching parse array (0 or more matches)
 *
 * @example
 *
 * ```ts
 * const digit = regex(/^\d/);
 * const { results } = many(digit).parse("23 and more"); // [{value: ["2", "3"], remaining: " and more", ...}]
 * ```
 */
export const many = <T>(parser: Parser<T>): Parser<T[]> => {
  return alt(
    parser.flatMap((a) => many(parser).flatMap((x) => result([a, ...x]))),
    result([]),
  );
};

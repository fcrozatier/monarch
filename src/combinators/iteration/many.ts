import { alt } from "../alternation/alt.ts";
import type { Parser } from "$core";
import { result } from "$core";

/**
 * Returns the longest matching parse array (0 or more matches)
 *
 * @example
 *
 * ```ts
 * import { many } from "@fcrozatier/monarch";
 * import { digit, regex } from "@fcrozatier/monarch/common";
 *
 * const digit = regex(/^\d/);
 * many(digit).parse("23 and more");
 * // [{value: ["2", "3"], remaining: " and more", ...}]
 * ```
 */
export const many = <T>(parser: Parser<T>): Parser<T[]> => {
  return alt(
    parser.chain((a) => many(parser).chain((x) => result([a, ...x]))),
    result([]),
  );
};

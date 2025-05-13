import type { Parser } from "../../../src/parser/main.ts";
import { result } from "../../primitives/result.ts";

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
  return parser.bind((a) => iterate(parser).bind((x) => result([a, ...x])))
    .plus(result([]));
};

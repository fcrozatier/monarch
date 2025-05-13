import { result } from "../../primitives/result.ts";
import type { Parser } from "../../../src/parser/main.ts";

/**
 * Skips the first parser
 *
 * @param skip The first parser
 * @param parser The second parser
 * @returns A parser returning the result of the second parser
 *
 * @example Discard leading spaces
 *
 * ```ts
 * const word = last(whitespace, letters);
 *
 * word.parse(" abc");
 * // [{ value: "abc", remaining: "", ... }]
 * ```
 */
export function last<T, U>(skip: Parser<T>, parser: Parser<U>): Parser<U> {
  return skip.bind((_) => parser.bind((r) => result(r)));
}

import type { Parser } from "../../../src/parser/main.ts";
import { result } from "../../primitives/result.ts";

/**
 * Skips the second parser
 *
 * @param parser The first parser
 * @param skip The second parser
 * @returns A parser returning the result of the first parser
 *
 * @example Discard trailing spaces
 *
 * ```ts
 * const word = first(letters, whitespace);
 *
 * word.parse("abc ");
 * // [{ value: "abc", remaining: "", ... }]
 * ```
 */
export function first<T, U>(parser: Parser<T>, skip: Parser<U>): Parser<T> {
  return parser.bind((r) => skip.bind((_) => result(r)));
}

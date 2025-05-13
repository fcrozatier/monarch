import type { Parser } from "../../../src/parser/main.ts";
import { result } from "../../primitives/result.ts";
import type { Unpack } from "../../types.ts";

/**
 * Makes a sequence of parses and returns the array of parse results
 *
 * The input parsers can be of different types
 *
 * @example Reimplementing the `bracket` parser
 *
 * ```ts
 * const parenthesizedNumber = sequence([literal("("), natural, literal(")")]);
 * // inferred type: Parser<[string, number, string]>
 *
 * const extract: Parser<number> = parenthesizedNumber.map((arr) => arr[1]);
 * const { results } = extract.parse("(42)");
 * // [{value: 42, remaining: "", ...}]
 * ```
 *
 * @see {@linkcode bracket}
 */
export const sequence = <const A extends readonly Parser<unknown>[]>(
  parsers: A,
  acc = [] as Unpack<A>,
): Parser<Unpack<A>> => {
  if (parsers.length > 0) {
    // @ts-ignore existential types
    return parsers[0].bind((x) => {
      return sequence(parsers.slice(1), [...acc, x]);
    }).bind((arr) => result(arr));
  }
  return result(acc);
};

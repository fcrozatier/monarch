import type { Parser } from "../../../src/parser.ts";
import { result } from "../../primitives/result.ts";
import type { UnwrappedTuple } from "../../types.ts";

/**
 * Parses a sequence.
 *
 * @param parsers The parsers.
 * @returns A parser returning an array of parse results.
 *
 * @example Reimplementing the `bracket` parser
 *
 * ```ts
 * const text = and(digit, letter);
 *
 * text.parse("1a2b");
 * // results: [{ value: [1, "a"], remaining: "2b", ... }]
 * ```
 */
export function and<T extends Parser<unknown>[]>(
  ...parsers: [...T]
): Parser<UnwrappedTuple<T>> {
  //  p1.bind((r1) => p2.bind((r2) => ... => pN.bind((rN) => result([r1, r2, ..., rN])) ... ));
  return parsers.reduceRight(
    (acc, parser) =>
      parser.bind((r) => acc.map((rs) => [r, ...rs] as UnwrappedTuple<T>)),
    result([] as UnwrappedTuple<T>),
  );
}

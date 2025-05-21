import type { Parser } from "$core";
import { result } from "$core";

/**
 * Maps an heterogeneous array of Parser types to their inner types
 *
 * @internal
 */
type Unwrap<T extends Parser<unknown>[]> = {
  [K in keyof T]: T[K] extends Parser<infer U> ? U : never;
};

/**
 * The sequence combinator
 *
 * Succeeds if all parsers of the sequence are successful.
 *
 * The input parsers can be of different types
 *
 * @example Reimplementing the `between` parser
 *
 * ```ts
 * const parenthesizedNumber = seq(literal("("), natural, literal(")"));
 * // inferred type: Parser<[string, number, string]>
 *
 * const extract = parenthesizedNumber.map((arr) => arr[1]);
 * extract.parseOrThrow("(42)"); // 42
 * ```
 *
 * @param parsers The parsers
 *
 * @see {@linkcode between}
 */
export const seq = <T extends Parser<unknown>[]>(
  ...parsers: T
): Parser<Unwrap<T>> => {
  return parsers.reduceRight(
    (acc: Parser<Unwrap<T>>, parser) =>
      parser.flatMap((r) => acc.map((rest) => [r, ...rest] as Unwrap<T>)),
    result([] as Unwrap<T>),
  );
};

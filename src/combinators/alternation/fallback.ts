import type { Parser } from "$core";
import { result } from "$core";
import { alt } from "./alt.ts";

/**
 * Returns a fallback value on failure.
 *
 * @param parser The parser
 * @param value The default value.
 * @returns A parser returning the successful parse result or the default value.
 *
 * @example
 * ```ts
 * const number = fallback(digit, 42);
 *
 * number.parse("123");
 * // [{ value: 1, remaining: "23", ... }]
 * number.parse("abc");
 * // [{ value: 42, remaining: "abc", ... }]
 */
export const fallback = <T>(
  parser: Parser<T>,
  value: T,
): Parser<T> => {
  return alt(parser, result(value));
};

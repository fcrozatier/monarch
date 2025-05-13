import type { Parser } from "../../../src/parser/main.ts";
import { result } from "../../primitives/result.ts";
import { alt } from "./alt.ts";

/**
 * Tries a parser or defaults to a value.
 * @param parser The parser.
 * @param value The default value.
 * @returns A parser returning the successful parse result or the default value.
 *
 * @example
 * ```ts
 * const number = defaulted(digit, 42);
 *
 * number.parse("123");
 * // [{ value: 1, remaining: "23", ... }]
 * number.parse("abc");
 * // [{ value: 42, remaining: "abc", ... }]
 */
export const defaulted = <T>(
  parser: Parser<T>,
  value: T,
): Parser<T> => {
  return alt(parser, result(value));
};

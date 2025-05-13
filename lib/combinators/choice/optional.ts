import type { Parser } from "../../../src/parser/main.ts";
import { defaulted } from "./defaulted.ts";

/**
 * Tries a parser or defaults to `undefined`.
 * @param parser The parser.
 * @returns A parser returning the successful parse result or `undefined`.
 *
 * @example
 * ```ts
 * const number = optional(digit);
 *
 * number.parse("123");
 * // [{ value: 1, remaining: "23", ... }]
 * number.parse("abc");
 * // [{ value: undefined, remaining: "abc", ... }]
 */
export const optional = <T>(parser: Parser<T>): Parser<T | undefined> => {
  return defaulted(parser, undefined);
};

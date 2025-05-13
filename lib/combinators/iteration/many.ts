import type { Parser } from "../../../src/parser/main.ts";
import { result } from "../../primitives/result.ts";
import { zero } from "../../primitives/zero.ts";
import { defaulted } from "../choice/defaulted.ts";

/**
 * Recursive helper for `many`
 *
 * @param parser The parser
 * @param min The minimum number of times the parser must succeed
 * @param max The maximum number of times the parser can succeed
 * @param count The current count of successful parses
 * @param acc The accumulator for the parsed values
 * @returns A parser returning an array of parse results
 */
const manyRecursive = <T>(
  parser: Parser<T>,
  min: number,
  max: number,
  count: number,
  acc: T[],
): Parser<T[]> => {
  if (count >= max) {
    return result(acc);
  }

  const rest = parser.bind((item) =>
    manyRecursive(parser, min, max, count + 1, [...acc, item])
  );

  if (count >= min) {
    return defaulted(rest, acc);
  } else {
    return rest;
  }
};

/**
 * Repeats a parser greedily between min and max times, inclusive
 *
 * @param parser The parser
 * @param min The minimum number of times the parser must succeed
 * @param max The maximum number of times the parser can succeed (default: Infinity)
 * @returns A parser returning an array of parse results
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many(digit, 2, 3);
 *
 * numbers.parse("1234ab");
 * // [{ value: [1, 2, 3], remaining: "4ab", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 */
export const many = <T>(
  parser: Parser<T>,
  min: number,
  max: number = Infinity,
): Parser<T[]> => {
  if (min < 0) {
    return zero.error("many: min cannot be negative");
  }
  if (max < min) {
    return zero.error("many: max cannot be less than min");
  }
  if (max === 0 && min === 0) {
    return result([]);
  }

  return manyRecursive(parser, min, max, 0, []);
};

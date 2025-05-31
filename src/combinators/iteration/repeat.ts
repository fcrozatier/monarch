import type { Parser } from "$core";
import { result } from "$core";

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
 * const numbers = repeat(digit, 2, 3);
 *
 * numbers.parse("1234ab");
 * // [{ value: [1, 2, 3], remaining: "4ab", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 */
export const repeat = <T>(
  parser: Parser<T>,
  min: number,
  max: number = Infinity,
): Parser<T[]> => {
  if (min < 0) {
    throw new Error("repeat: min cannot be negative");
  }
  if (max < min) {
    throw new Error("repeat: max cannot be less than min");
  }
  if (max === 0 && min === 0) {
    return result([]);
  }

  return repeatRecursive(parser, min, max, 0, []);
};

/**
 * Recursive helper for `repeat`
 *
 * @param parser The parser
 * @param min The minimum number of times the parser must succeed
 * @param max The maximum number of times the parser can succeed
 * @param count The current count of successful parses
 * @param acc The accumulator for the parsed values
 * @returns A parser returning an array of parse results
 */
const repeatRecursive = <T>(
  parser: Parser<T>,
  min: number,
  max: number,
  count: number,
  acc: T[],
): Parser<T[]> => {
  if (count >= max) {
    return result(acc);
  }

  const rest = parser.flatMap((item) =>
    repeatRecursive(parser, min, max, count + 1, [...acc, item])
  );

  if (count >= min) {
    return rest.fallback(acc);
  } else {
    return rest;
  }
};

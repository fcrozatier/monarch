import type { Parser } from "$core";
import { result } from "$core";
import { many } from "$combinators";

/**
 * Repeats a parser and a separator greedily between min and max times, inclusive
 *
 * @param parser The item parser
 * @param separator The separator parser
 * @param min The minimum number of items
 * @param max The maximum number of items (default: Infinity)
 * @returns A parser returning an array of parse results, ignoring the separator
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy(digit, literal(","), 2, 3);
 *
 * numbers.parse("1,2,3,4,a,b");
 * // results: [{ value: [1, 2, 3], remaining: ",4,a,b" }]
 * numbers.parse("1");
 * // message: "Expected ',', but got 'EOI'"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 */
export const sepBy = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
  min: number,
  max: number = Infinity,
): Parser<T[]> => {
  if (min < 0) {
    throw new Error("sepBy: min cannot be negative");
  }
  if (max < min) {
    throw new Error("sepBy: max cannot be less than min");
  }
  if (max === 0 && min === 0) {
    return result([]);
  }

  const minRemaining = Math.max(0, min - 1);
  const maxRemaining = Math.max(0, max - 1);
  const separatorItem = separator.flatMap(() => parser);
  const separatorItems = many(separatorItem, minRemaining, maxRemaining);

  if (min === 0) {
    return parser
      .flatMap((firstItem) =>
        separatorItems.map((rest) => [firstItem, ...rest])
      )
      .fallback([]);
  } else {
    return parser
      .flatMap((firstItem) =>
        separatorItems.map((rest) => [firstItem, ...rest])
      );
  }
};

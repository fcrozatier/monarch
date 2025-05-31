import type { Parser } from "$core";
import { repeat, seq } from "$combinators";

/**
 * Repeats a parser and a right-associative operator parser greedily between min and max times, inclusive
 *
 * @param parser The item parser
 * @param operator The operator parser, returning a function (a:T, b:T) => T
 * @param min The minimum number of items to parse
 * @param max The maximum number of items to parse (default: Infinity)
 * @returns A parser returning the folded result
 *
 * @example Exponentiation
 *
 * ```ts
 * const caret = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR(digit, caret, 2, 3);
 *
 * exponentiation.parse("4^3^2^1^a^b");
 * // results: [{ value: 262144, remaining: "^1^a^b" }]
 * exponentiation.parse("1");
 * // message: "Expected '^', but got 'EOI'"
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldR = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
  min: number,
  max: number = Infinity,
): Parser<T> => {
  if (min < 1) {
    throw new Error("foldR: min cannot be less than 1");
  }
  if (max < min) {
    throw new Error("foldR: max cannot be less than min");
  }
  if (min === 1 && max === 1) {
    return parser;
  }

  const operatorItem = seq(operator, parser);
  const operatorItems = repeat(operatorItem, min - 1, max - 1);

  return parser.flatMap((firstItem) =>
    operatorItems.map((pairs) => {
      // single item
      if (!pairs.length) {
        return firstItem;
      }

      const lastItem = pairs.at(-1)![1];

      return pairs.reduceRight((acc, [op, _], index, array) => {
        // previous value or `firstItem` if at start
        const val = index == 0 ? firstItem : array[index - 1][1];
        return op(val, acc);
      }, lastItem);
    })
  );
};

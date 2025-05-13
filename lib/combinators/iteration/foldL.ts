import type { Parser } from "../../../src/parser/main.ts";
import { zero } from "../../primitives/zero.ts";
import { sequence } from "../sequencing/sequence.ts";
import { many } from "./many.ts";

/**
 * Repeats an item parser and a left-associative operator parser greedily between min and max times, inclusive
 *
 * @param parser The item parser
 * @param operator The operator parser, returning a function (a:T, b:T) => T
 * @param min The minimum number of items to parse
 * @param max The maximum number of items to parse (default: Infinity)
 * @returns A parser returning the folded result
 *
 * @example Addition
 *
 * ```ts
 * const plus = literal("+").map(() => (a: number, b: number) => a + b);
 * const addition = foldL(digit, plus, 2, 3);
 *
 * addition.parse("1+2+3+4+a+b");
 * // results: [{ value: 6, remaining: "+4+a+b" }]
 * addition.parse("1");
 * // message: "Expected '+', but got 'EOI'"
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldL = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
  min: number,
  max: number = Infinity,
): Parser<T> => {
  if (min < 1) {
    return zero.error("foldL: min cannot be less than 1");
  }
  if (max < min) {
    return zero.error("foldL: max cannot be less than min");
  }
  if (min === 1 && max === 1) {
    return parser;
  }

  const operatorItem = sequence([operator, parser]);
  const operatorItems = many(operatorItem, min - 1, max - 1);

  return parser.bind((firstItem) =>
    operatorItems.map((pairs) =>
      pairs.reduce((acc, [op, val]) => op(acc, val), firstItem)
    )
  );
};

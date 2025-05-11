import type { Parser } from "../../../src/parser.ts";
import { result } from "../../primitives/result.ts";
import { or } from "../choice/or.ts";
import { sepBy1 } from "./sepBy1.ts";

/**
 * Recognizes (maybe empty) sequences of a given parser and separator, and ignores the separator
 *
 * @example Lists of numbers
 *
 * ```ts
 * const listOfNumbers = bracket(
 *   literal("["),
 *   sepBy(number, literal(",")),
 *   literal("]"),
 * );
 *
 * listOfNumbers.parse("[1,2,3]"); // results: [{value: [1,2,3], remaining: ""}]
 * ```
 */
export const sepBy = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return or(sepBy1(parser, sep), result([]));
};

import type { Parser } from "../../../src/index.ts";
import { result } from "../../primitives/result.ts";
import { and } from "./and.ts";

/**
 * Utility combinator for the common open-body-close pattern
 *
 * @example
 * ```ts
 * const listOfNumbers = bracket(
 *   literal("["),
 *   sepBy(number, literal(",")),
 *   literal("]"),
 * );
 *
 * listOfNumbers.parse("[1,2,3]");
 * // [{value: [1,2,3], remaining: ""}]
 * ```
 */
export function bracket<T, U, V>(
  openBracket: Parser<T>,
  body: Parser<U>,
  closeBracket: Parser<V>,
): Parser<U> {
  return and([openBracket, body, closeBracket]).bind((arr) => result(arr[1]));
}

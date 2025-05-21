import type { Parser } from "$core";
import { result } from "$core";
import { seq } from "./seq.ts";

/**
 * Structural combinator for the common open-body-close pattern
 *
 * This pattern is common when parsing strings, lists, or scoped content inside curly brackets. The `open` and `close` parsers are discarded by {@linkcode between} and you can {@linkcode Parser.map map} the `body` to the data structure matching you need.
 *
 * ### `between` vs skipping
 *
 * `between` is functionally equivalent to skipping a prefix and suffix around the body with {@linkcode Parser.skipLeading skipLeading} and {@linkcode Parser.skipTrailing skipTrailing}, but the intent is different:
 * - `between` is a structural parser and describes your grammar
 * - skipping is a refinement to express tokenizer concerns or write convenience utilities: skipping whitespaces, extracting data from the body but not the frontmatter etc.
 *
 * @example Parsing strings
 * ```ts
 * const string = between(literal('"'), letters, literal('"'));
 *
 * string.parseOrThrow('"hello world"'); // "hello world"
 * ```
 *
 * @example Parsing lists
 * ```ts
 * const listOfNumbers = between(
 *   literal("["),
 *   sepBy(number, literal(",")),
 *   literal("]"),
 * );
 *
 * listOfNumbers.parseOrThrow("[1,2,3]"); // [1,2,3]
 * ```
 *
 * @param open The open parser to discard
 * @param body The main parser of the body
 * @param close The close parser to discard
 *
 * @see {@linkcode Parser.skipTrailing skipLeading}
 * @see {@linkcode Parser.skipLeading skipTrailing}
 */
export function between<T, U, V>(
  open: Parser<T>,
  body: Parser<U>,
  close: Parser<V>,
): Parser<U> {
  return seq(open, body, close).flatMap((arr) => result(arr[1]));
}

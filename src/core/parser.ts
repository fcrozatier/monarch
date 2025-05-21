import { ParseError } from "../errors.ts";
import { result } from "./result.ts";
import type { ParseResult, ParsingHandler, Position } from "./types.ts";
import { sortPosition } from "../utils.ts";

/**
 * The parser class
 */
export class Parser<T> {
  #parse: ParsingHandler<T>;
  #error = "";

  /**
   * Creates a new {@linkcode Parser}
   *
   * @see {@linkcode createParser}
   */
  constructor(parse: ParsingHandler<T>) {
    this.#parse = parse;
  }

  /**
   * Parses the input
   *
   * @param input The input to parse
   * @param position The starting position
   */
  parse(
    input: string,
    position: Position = { line: 1, column: 0 },
  ): ParseResult<T> {
    const result = this.#parse(input, position);

    if (!result.success && this.#error) {
      return { success: false, message: this.#error, position };
    }

    return result;
  }

  /**
   * Parse an input with a given parser and extract the first result value or throw if the parse fails
   */
  parseOrThrow(
    input: string,
  ): T {
    const result = this.parse(input);

    if (!result.success) {
      const lines = input.split("\n");
      const { line } = result.position;
      const snippet = lines[line - 1];

      throw new ParseError(
        result.position,
        result.message,
        snippet,
      );
    }

    return result.results[0].value;
  }

  /**
   * Transforms a parser of type T into a parser of type U
   *
   * @example Mapping a `Parser<string>` to a `Parser<number>`
   *
   * ```ts
   * const digit = regex(/^\d/).map(Number.parseInt);
   * const { results } = digit.parse("23 and more");
   * // [{value: 2, remaining: "3 and more", ...}]
   *
   * const natural = many(digit).map((arr) => Number(arr.join("")));
   * const { results } = natural.parse("23 and more");
   * // [{value: 23, remaining: " and more", ...}]
   * ```
   */
  map<U>(transform: (value: T) => U): Parser<U> {
    return createParser((input, position) => {
      const result = this.parse(input, position);

      if (!result.success) return result;

      return {
        success: true,
        results: result.results.map(({ value, remaining, position }) => ({
          value: transform(value),
          remaining,
          position,
        })),
      };
    });
  }

  /**
   * Monadic sequencing of parsers.
   *
   * This method chains the result of a `Parser<T>` with the next parser of the sequence.
   *
   * Useful when you want more control over the sequencing, for dynamic parsing or context aware parsing where a later parser result depends on the result of a previous parser
   *
   * @example Parse simple identifiers
   *
   * ```ts
   * const letter = regex(/^[a-zA-Z]/);
   * const alphanumeric = many(regex(/^\w/)); // Parser<string[]>
   * const identifier = letter.flatMap((l) =>
   *   alphanumeric.map((rest) => [l, ...rest].join(""))
   * );
   *
   * const { results } = identifier.parse("user1 = 'Bob'");
   * // [{value: "user1", remaining: " = 'Bob'", ...}]
   * ```
   *
   * @example Discard trailing spaces
   *
   * ```ts
   * const spaces = regex(/^\s* /);
   * const token = <T>(parser) => parser.flatMap((p) => spaces.flatMap((_) => result(p)));
   *
   * const { results } = token(identifier).parse("ageUser1  = 42");
   * // [{value: "ageUser1", remaining: "= 42", ...}]
   * ```
   *
   * @param transform A function lifting the value of the previous parse into another parser
   * @returns A flattened parser with the return type of the `transform` parameter
   *
   * @see {@linkcode skipTrailing}
   */
  flatMap<U>(transform: (value: T) => Parser<U>): Parser<U> {
    return createParser((input, position) => {
      const result = this.parse(input, position);

      if (!result.success) return result;

      const nextResults = result.results.map(
        ({ position, remaining, value }) => {
          return transform(value).parse(remaining, position);
        },
      );

      if (nextResults.every((r) => r.success === false)) {
        // Heuristic: return the error message of the most successful parse
        const [error] = nextResults.sort((a, b) =>
          sortPosition(a.position, b.position)
        );

        return error;
      }

      const results = nextResults.filter((r) => r.success === true).flatMap((
        r,
      ) => r.results);
      return {
        success: true,
        results,
      };
    });
  }

  /**
   * Returns a fallback value on failure.
   *
   * @example `public` and `private` class modifiers
   *
   * ```ts
   * const visibility = alt(token('public'), token('private')).fallback('public');
   *
   * visibility.parse('myIdentifier')// [{value: 'public', remaining: 'myIdentifier', ...}]
   * ```
   *
   * @param value The fallback value
   * @returns A parser returning the successful parse result or the fallback value
   */
  fallback(value: T): Parser<T> {
    return createParser((input, position) => {
      const result = this.parse(input, position);
      if (result.success === true) return result;

      return {
        success: true,
        results: [{ value, position, remaining: input }],
      };
    });
  }

  /**
   * Filters a parser with a predicate and matches only if the predicate returns true
   *
   * For regex predicates, prefer using the {@linkcode regex} parser
   *
   * @example
   *
   * ```ts
   * const isVowel = (char) => ["a", "e", "i", "o", "u", "y"].includes(char);
   * const vowel = take.filter(isVowel).error("Expected a vowel");
   *
   * const { results } = vowel.parse("a");
   * // [{value: 'a', remaining: '', ...}]
   *
   * const { message } = vowel.parse("b");
   * // "Expected a vowel"
   * ```
   *
   * @see {@linkcode regex}
   */
  filter(predicate: (value: T) => boolean): Parser<T> {
    return createParser((input, position) => {
      const result = this.parse(input, position);

      if (!result.success) return result;

      const results = result.results.filter((r) => predicate(r.value));

      if (results.length === 0) {
        return {
          success: false,
          message: "Expected to match against predicate",
          position,
        };
      }
      return { success: true, results };
    });
  }

  /**
   * Skips trailing parsers.
   *
   * The parsers to skip can consume characters and must all succeed
   *
   * @example Discard trailing spaces
   *
   * ```ts
   * const ident = letter.skipTrailing(whitespaces);
   *
   * ident.parseOrThrow("a"); // "a"
   * ident.parseOrThrow("a ") // "a"
   *
   * const ident1 = letter.skipTrailing(whitespaces1);
   *
   * ident1.parseOrThrow("a"); // Error: Expected whitespace
   * ident1.parseOrThrow("a ") // "a"
   * ```
   *
   * @param parsers Parsers to skip
   *
   * @see {@linkcode skipLeading}
   */
  skipTrailing(...parsers: Parser<unknown>[]): Parser<T> {
    return [this, ...parsers].reduceRight((acc, current) =>
      current.flatMap((r) => acc.flatMap(() => result(r)))
    ) as Parser<T>;
  }

  /**
   * Skips leading parsers.
   *
   * The parsers to skip can consume characters and must all succeed
   *
   * @example Discard leading spaces
   *
   * ```ts
   * const ident = letter.skipLeading(whitespaces);
   *
   * ident.parseOrThrow("a"); // "a"
   * ident.parseOrThrow(" a") // "a"
   *
   * const ident1 = letter.skipLeading(whitespaces1);
   *
   * ident1.parseOrThrow("a"); // Error: Expected whitespace
   * ident1.parseOrThrow(" a") // "a"
   * ```
   *
   * @param parsers Parsers to skip
   *
   * @see {@linkcode skipTrailing}
   */
  skipLeading(...parsers: Parser<unknown>[]): Parser<T> {
    return parsers.reduceRight(
      (acc, current) => current.flatMap(() => acc),
      this,
    ) as Parser<T>;
  }

  /**
   * Customize the error message of a parser
   *
   * @example
   *
   * ```ts
   * const even = regex(/^[02468]/).error("Expected an even number");
   *
   * const { results } = even.parse("24"); // [{value: '2', remaining: '4', ...}]
   * const { message } = even.parse("13"); // "Expected an even number"
   * ```
   */
  error(message: string): this {
    this.#error = message;
    return this;
  }
}

/**
 * Utility to create a new parser
 */
export const createParser = <T>(
  fn: ParsingHandler<T>,
): Parser<T> => new Parser(fn);

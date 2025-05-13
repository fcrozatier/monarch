import { ParseError } from "../errors.ts";
import type { ParseResult, ParsingHandler, Position } from "../types.ts";
import { sortPosition } from "../utilities.ts";

/**
 * The monadic parser class
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
   * const natural = many0(digit).map((arr) => Number(arr.join("")));
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
   * Useful when you want more control over the sequencing, for dynamic parsing or context aware parsing where a later parser result depends on the result of a previous parser
   *
   * @example Parse simple identifiers
   *
   * ```ts
   * const letter = regex(/^[a-zA-Z]/);
   * const alphanumeric = many0(regex(/^\w/)); // Parser<string[]>
   * const identifier = letter.bind((l) =>
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
   * const token = <T>(parser) => parser.bind((p) => spaces.bind((_) => result(p)));
   *
   * const { results } = token(identifier).parse("ageUser1  = 42");
   * // [{value: "ageUser1", remaining: "= 42", ...}]
   * ```
   *
   * @see {@linkcode first}
   */
  bind<U>(transform: (value: T) => Parser<U>): Parser<U> {
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
        const error = nextResults.sort((a, b) =>
          sortPosition(a.position, b.position)
        )[0];

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
   * Concatenates the resulting parse arrays
   */
  plus(...parsers: Parser<T>[]): Parser<T> {
    return createParser((input, position) => {
      const results = [this, ...parsers].map((parser) =>
        parser.#parse(input, position)
      );

      if (results.every((r) => r.success === false)) {
        // Heuristic: return the error message of the most successful parse
        const error = results.sort((a, b) =>
          sortPosition(a.position, b.position)
        )[0];

        return error;
      }
      return {
        success: true,
        results: results.filter((r) => r.success === true).flatMap((r) =>
          r.results
        ),
      };
    });
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

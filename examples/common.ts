import { parseErrors } from "../errors.ts";
import {
  and,
  bracket,
  createParser,
  foldL1,
  many,
  or,
  type Parser,
  repeat,
  result,
  sepBy,
  updatePosition,
} from "../index.ts";

/**
 * Represents a predicate function
 *
 * @internal
 */
type Predicate = (input: string) => boolean;

/**
 * Returns a predicate function from a regex that can be used with the {@linkcode filter} combinator.
 *
 * Prefer using the {@linkcode regex} parser for filter string parsers
 *
 * @example
 *
 * ```ts
 * const isVowel = regexPredicate(/[aeiouy]/);
 * const vowel = filter(take, isVowel).error("Expected a vowel");
 * vowel.parse("allo"); // [{value: 'a', remaining: 'llo', ...}]
 *
 * // vowel is equivalent to
 * const vowel2 = regex(/[aeiouy]/);
 * ```
 *
 * @see {@linkcode regex}
 */
export function regexPredicate(regex: RegExp): Predicate {
  return (input: string) => regex.test(input);
}

/**
 * Creates a parser matching against a given regex
 *
 * @example
 *
 * ```ts
 * const even = regex(/^[02468]/).error("Expected an even number");
 * const { results } = even.parseOrThrow("24"); // [{value: '2', remaining: '4', ...}]
 * const { message } = even.parse("13"); // "Expected an even number"
 * ```
 */
export function regex(re: RegExp): Parser<string> {
  return createParser((input, position) => {
    const match = input.match(re);

    if (!match) {
      return {
        success: false,
        message: `Expected to match against regex ${re}`,
        position,
      };
    }

    const value = match[0];
    const newPosition = updatePosition(position, value);

    return {
      success: true,
      results: [
        { value, remaining: input.slice(value.length), position: newPosition },
      ],
    };
  });
}

/**
 * Consumes the next character of the input and fails if the input is empty.
 *
 * @example Non-empty input
 *
 * ```ts
 * const { results } = take.parse("hello");
 * // [{value: 'h', remaining: 'ello', ...}]
 * ```
 *
 * @example Empty input
 *
 * ```ts
 * const { message } = take.parse("");
 * // "Unexpected end of input"
 * ```
 */
export const take: Parser<string> = createParser(
  (input, position) => {
    if (input.length === 0) {
      return {
        success: false,
        message: parseErrors.takeError,
        position,
      };
    }

    const consumed = input[0];
    const newPosition = updatePosition(position, consumed);

    return {
      success: true,
      results: [{
        value: consumed,
        position: newPosition,
        remaining: input.slice(1),
      }],
    };
  },
);

/**
 * Parses the next two characters
 */
export const takeTwo: Parser<string> = repeat(take, 2).map((arr) =>
  arr.join("")
).error(parseErrors.takeTwoError);

/**
 * Tries a parser or defaults to a value.
 * @param parser The parser.
 * @param value The default value.
 * @returns A parser returning the successful parse result or the default value.
 *
 * @example
 * ```ts
 * const number = defaulted(digit, 42);
 *
 * number.parse("123");
 * // [{ value: 1, remaining: "23", ... }]
 * number.parse("abc");
 * // [{ value: 42, remaining: "abc", ... }]
 */
export const defaulted = <T>(
  parser: Parser<T>,
  value: T,
): Parser<T> => {
  return or(parser, result(value));
};

/**
 * Tries a parser or defaults to `undefined`.
 * @param parser The parser.
 * @returns A parser returning the successful parse result or `undefined`.
 *
 * @example
 * ```ts
 * const number = optional(digit);
 *
 * number.parse("123");
 * // [{ value: 1, remaining: "23", ... }]
 * number.parse("abc");
 * // [{ value: undefined, remaining: "abc", ... }]
 */
export const optional = <T>(parser: Parser<T>): Parser<T | undefined> => {
  return defaulted(parser, undefined);
};

/**
 * Parses a single white space with the regex `/\s\/`
 *
 * @throws Throws "Expected a white space character" when the parse fails
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  "Expected a white space character",
);

/**
 * Parses white spaces (0 or more)
 *
 * Regex: /\s*\/
 */
export const whitespaces: Parser<string> = regex(/^\s*/);

/**
 * Parses white spaces (1 or more)
 *
 * Regex: /\s+\/
 */
export const whitespaces1: Parser<string> = regex(/^\s+/);

/**
 * Parses the space character (0 or more)
 */
export const spaces: Parser<string> = regex(/^ */);

/**
 * Parses the newline character
 */
export const newline: Parser<string> = regex(/^\n/);

/**
 * Matches against a specific character or keyword
 *
 * @example
 *
 * ```ts
 * const dot = literal(".");
 * const { results } = dot.parse(".23");
 * // [{value: '.', remaining: '23', ...}]
 *
 * const { message } = dot.parse("0.23");
 * // "Expected '.' but got '0'"
 * ```
 */
export function literal(value: string): Parser<string> {
  return (createParser((input, position) => {
    if (!input.startsWith(value)) {
      return {
        success: false,
        position,
        message: `Expected '${value}', but got '${
          input.slice(0, value.length) || "EOI"
        }'`,
      };
    }

    return {
      success: true,
      results: [{
        value,
        remaining: input.slice(value.length),
        position: updatePosition(position, value),
      }],
    };
  }));
}

/**
 * Parses a token and discards trailing spaces
 */
export function token(value: string): Parser<string> {
  return literal(value).skip(whitespaces);
}

/**
 * Parses a single letter (case insensitive)
 *
 * Regex: /^[a-zA-Z]/
 */
export const letter: Parser<string> = regex(/^[a-zA-Z]/).error(
  parseErrors.letter,
);

/**
 * Parses a string of letters
 */
export const letters: Parser<string> = many(letter).map((letters) =>
  letters.join("")
);

/**
 * Parses a single lower case letter
 *
 * * Regex: /^[a-z]/
 */
export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

/**
 * Parses a single upper case letter
 *
 * * Regex: /^[A-Z]/
 */
export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

/**
 * Parses alphanumeric characters (0 or more)
 *
 * * Regex: /^\w*\/
 */
export const alphaNums: Parser<string> = regex(/^\w*/);

/**
 * Parses an identifier token as letter + alphanums
 */
export const identifier: Parser<string> = letter.bind((l) =>
  alphaNums.map((rest) => l + rest)
);

/**
 * Parses a single digit
 *
 * * Regex: /^\d/
 */
export const digit: Parser<number> = regex(/^\d/).map(Number.parseInt).error(
  parseErrors.digit,
);

/**
 * Parses a natural number
 */
export const natural: Parser<number> = foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
).skip(spaces).error(parseErrors.natural);

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = or(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

/**
 * Parses a decimal number aka a float
 */
export const decimal: Parser<number> = and([
  integer,
  literal("."),
  natural,
]).map(([integral, _, fractional]) =>
  integral +
  Math.sign(integral) * Math.pow(10, -Math.ceil(Math.log10(fractional))) *
    fractional
).skip(spaces).error(parseErrors.decimal);

/**
 * Parses a number as decimal | integer
 */
export const number: Parser<number> = or(decimal, integer).error(
  parseErrors.number,
);

/**
 * Builds a parser that expects the list syntax [p(,p)*]
 */
export function listOf<T>(parser: Parser<T>): Parser<T[]> {
  return bracket(
    token("["),
    sepBy(parser, token(",")),
    token("]"),
  );
}

/**
 * Parses a list of integers
 */
export const listOfInts: Parser<number[]> = listOf(integer);

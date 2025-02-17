import { parseErrors } from "../errors.ts";
import {
  bracket,
  createParser,
  first,
  foldL1,
  many,
  type Parser,
  repeat,
  result,
  sepBy,
  sequence,
  updatePosition,
} from "../index.ts";

type Predicate = (input: string) => boolean;

/**
 * Returns a predicate function from a regex
 */
export function regexPredicate(regex: RegExp): Predicate {
  return (input: string) => regex.test(input);
}

/**
 * Creates a parser matching against a given regex
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
 * Parses the next character
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
 * Parses a single white space
 *
 * Regex: /\s\/
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  "Expected a white space character",
);

/**
 * Parses white space (0 or more)
 *
 * Regex: /\s*\/
 */
export const whitespaces: Parser<string> = regex(/^\s*/);

/**
 * Parses the space character (0 or more)
 */
export const spaces: Parser<string> = regex(/^ */);

/**
 * Parses the newline character
 */
export const newline: Parser<string> = regex(/^\n/);

/**
 * Parses a given string
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
 * Alias: keyword
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
export const integer: Parser<number> = first(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
).error(parseErrors.integer);

/**
 * Parses a decimal number aka a float
 */
export const decimal: Parser<number> = sequence([
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
export const number: Parser<number> = first(decimal, integer).error(
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

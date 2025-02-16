import {
  bracket,
  createParser,
  first,
  foldL1,
  many,
  type Parser,
  repeat,
  result,
  sepBy1,
  sequence,
  updatePosition,
} from "../index.ts";
import { parseErrors } from "../errors.ts";

type Predicate = (input: string) => boolean;

/**
 * Builds a predicate from a regex
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
 * Parses white space (0 or more)
 *
 * Regex: /\s*\/
 */
export const whitespace: Parser<string> = regex(/\s*/);

/**
 * Discards trailing spaces
 */
export function trimEnd<T>(parser: Parser<T>): Parser<T> {
  return parser.skip(whitespace);
}

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
 * Parses a keyword and discards trailing spaces
 * Alias: token
 */
export const keyword: (value: string) => Parser<string> = (value: string) =>
  trimEnd(literal(value));

/**
 * Parses a token and discards trailing spaces
 * Alias: keyword
 */
export function token(value: string): Parser<string> {
  return trimEnd(literal(value));
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
 * Parser a string of letters
 */
export const letters: Parser<string> = many(letter).map((letters) =>
  letters.join("")
);

/**
 * Pareses a single lower case letter
 *
 * * Regex: /^[a-z]/
 */
export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

/**
 * Pareses a single upper case letter
 *
 * * Regex: /^[A-Z]/
 */
export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

export const alphaNum: Parser<string> = many(regex(/^\w/)).map((
  letters,
) => letters.join(""));

export const identifier: Parser<string> = trimEnd(
  letter.bind((l) => alphaNum.map((rest) => l + rest)),
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
export const natural: Parser<number> = trimEnd(foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
)).error(parseErrors.natural);

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = trimEnd(first(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
)).error(parseErrors.integer);

/**
 * Parses a decimal number aka a float
 */
export const decimal: Parser<number> = trimEnd(
  sequence([integer, literal("."), natural]).map(([pre, _, post]) => {
    return pre +
      Math.sign(pre) * Math.pow(10, -Math.ceil(Math.log10(post))) * post;
  }),
).error(parseErrors.decimal);

/**
 * Parses a number as decimal | integer
 */
export const number: Parser<number> = first(decimal, integer).error(
  parseErrors.number,
);

/**
 * Utility parser builder that expects the list syntax [p(,p)+]
 */
export function listOf<T>(p: Parser<T>): Parser<T[]> {
  return bracket(
    token("["),
    sepBy1(p, token(",")),
    token("]"),
  );
}

export const listOfInts: Parser<number[]> = listOf(integer);

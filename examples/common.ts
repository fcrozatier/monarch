import { takeError, takeTwoError } from "../errors.Ts";
import {
  bracket,
  createParser,
  filter,
  first,
  foldL1,
  many,
  type Parser,
  repeat,
  result,
  sepBy1,
  sequence,
} from "../index.ts";

type Predicate = (input: string) => boolean;
type RegexPredicate = (regex: RegExp) => Predicate;

export const regexPredicate: RegexPredicate =
  (regex: RegExp) => (input: string) => regex.test(input);

export const isAlphaNum: Predicate = regexPredicate(/^\w/);
export const isLetter: Predicate = regexPredicate(/^[a-zA-Z]/);
export const isLower: Predicate = regexPredicate(/^[a-z]/);
export const isUpper: Predicate = regexPredicate(/^[A-Z]/);
export const isDigit: Predicate = regexPredicate(/^\d/);
export const isSpace: Predicate = regexPredicate(/^\s/);

/**
 * Creates a parser matching against a given regex
 */
export const regex = (re: RegExp): Parser<string> => {
  return createParser((input) => {
    const match = input.match(re);
    return match && match.index === 0
      ? [{ value: match[0], remaining: input.slice(match[0].length) }]
      : [];
  });
};

/**
 * Parses the next character
 */
export const take: Parser<string> = createParser((input) => {
  if (input.length > 0) {
    return [{ value: input[0], remaining: input.slice(1) }];
  }
  return [{ error: takeError }];
});

/**
 * Parses the next two characters
 */
export const takeTwo: Parser<string> = repeat(take, 2).map((arr) =>
  arr.join("")
).error(takeTwoError);

/**
 * Parses white space
 */
export const whitespace: Parser<string> = regex(/\s*/);

/**
 * Discards trailing spaces
 */
export const trimEnd: <T>(parser: Parser<T>) => Parser<T> = <T>(
  parser: Parser<T>,
) => {
  return parser.bind((p) => whitespace.bind(() => result(p)));
};

/**
 * Parses a given string
 */
export const literal: (value: string) => Parser<string> = (value: string) => {
  return (createParser((input) => {
    if (input.startsWith(value)) {
      return [{ value, remaining: input.slice(value.length) }];
    } else {
      return [
        {
          error:
            (`Expected ${value}, but got '${
              input.slice(0, value.length) || "EOI"
            }'`),
        },
      ];
    }
  }));
};

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
export const token: (value: string) => Parser<string> = (value: string) =>
  trimEnd(literal(value));

/**
 * Parses a single letter (case insensitive)
 */
export const letter: Parser<string> = filter(take, isLetter);

/**
 * Pareses a single lower case letter
 */
export const lower: Parser<string> = filter(take, isLower);

/**
 * Pareses a single upper case letter
 */
export const upper: Parser<string> = filter(take, isUpper);

/**
 * Parser a string of letters
 */
export const word: Parser<string> = many(letter).map((letters) =>
  letters.join("")
);

export const alphaNum: Parser<string> = many(filter(take, isAlphaNum)).map((
  letters,
) => letters.join(""));

export const identifier: Parser<string> = trimEnd(
  letter.bind((l) => alphaNum.map((rest) => l + rest)),
);

/**
 * Parses a single digit
 */
export const digit: Parser<number> = filter(take, isDigit).map(Number.parseInt);

/**
 * Parses a natural number
 */
export const natural: Parser<number> = trimEnd(foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
));

/**
 * Parses an integer (element of ℤ)
 */
export const integer: Parser<number> = trimEnd(first(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
));

/**
 * Parses a decimal number aka a float
 */
export const decimal: Parser<number> = trimEnd(
  sequence([integer, literal("."), natural]).map(([pre, _, post]) =>
    pre + Math.pow(10, -Math.ceil(Math.log10(post))) * post
  ),
);

/**
 * Parses a number as decimal | integer
 */
export const number: Parser<number> = first(decimal, integer);

export const listOf: <T>(p: Parser<T>) => Parser<T[]> = <T>(p: Parser<T>) =>
  bracket(
    token("["),
    sepBy1(p, token(",")),
    token("]"),
  );

export const listOfInts: Parser<number[]> = listOf(integer);

const assertDigit = createParser((input) => {
  return /^\d/.test(input)
    ? [{ value: input[0], remaining: input.slice(1) }]
    : [{ error: `Expected a digit but got ${input[0] || "EOI"}` }];
});

const assertletter = createParser((input) => {
  return /^[a-zA-Z]/.test(input)
    ? [{ value: input[0], remaining: input.slice(1) }]
    : [{ error: `Expected a letter but got ${input[0] || "EOI"}` }];
});

import { ParseError } from "./errors.ts";
import type { ParseResult, ParsingHandler, Position } from "./types.ts";

// Utilities

/**
 * Compute the new position from the current position and the consumed string
 */
export const updatePosition = (
  position: Position,
  consumed: string,
): Position => {
  const lines = consumed.split("\n");
  const newLines = lines.length > 1;

  return {
    line: position.line + lines.length - 1,
    column: newLines
      ? lines.at(-1)!.length
      : position.column + lines.at(-1)!.length,
  };
};

/**
 * Sort positions in a descending (line, column) order
 */
export const sortPosition = (a: Position, b: Position): number => {
  if (a.line !== b.line) return b.line - a.line;
  return b.column - a.column;
};

// Main

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
   * Useful when you want more control over the sequencing, for dynamic parsing or context aware parsing where a later parser result depends on the result of a previous parser
   *
   * @example Parse simple identifiers
   *
   * ```ts
   * const letter = regex(/^[a-zA-Z]/);
   * const alphanumeric = many(regex(/^\w/)); // Parser<string[]>
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
   * @see {@linkcode skip}
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
   * Convenience method for skipping a parser.
   *
   * Shorthand for: `mainParser.bind((r) => parserToSkip.bind(() => result(r)))`
   *
   * @example Discard trailing spaces
   *
   * ```ts
   * const token = <T>(parser: Parser<T>) =>
   *   parser.bind((p) => spaces.bind((_) => result(p)));
   *
   * // equivalent to
   * const token = <T>(parser: Parser<T>) => parser.skip(spaces);
   * ```
   *
   * @see {@linkcode token}
   */
  skip<U>(parser: Parser<U>): Parser<T> {
    return this.bind((r) => parser.bind(() => result(r)));
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

// Helpers

/**
 * Utility to create a new parser
 */
export const createParser = <T>(
  fn: ParsingHandler<T>,
): Parser<T> => new Parser(fn);

/**
 * The default embedding of a value in the Parser context
 *
 * Succeeds without consuming any of the input string
 */
export const result = <T>(value: T): Parser<T> => {
  return createParser((
    remaining,
    position,
  ) => ({ success: true, results: [{ value, remaining, position }] }));
};

/**
 * The always failing parser
 *
 * It is the unit of alternation and plus, and also is an absorbing element of bind
 */
export const zero: Parser<never> = createParser((_, position) => ({
  success: false,
  message: "",
  position,
}));

// Combinators

// Sequencing

/**
 * Unpacks an array of parsers types
 */
type Unpack<T> = {
  [K in keyof T]: T[K] extends Parser<infer A> ? A : never;
};

/**
 * Makes a sequence of parses and returns the array of parse results
 *
 * The input parsers can be of different types
 *
 * @example Reimplementing the `bracket` parser
 *
 * ```ts
 * const parenthesizedNumber = sequence([literal("("), natural, literal(")")]);
 * // inferred type: Parser<[string, number, string]>
 *
 * const extract: Parser<number> = parenthesizedNumber.map((arr) => arr[1]);
 * const { results } = extract.parse("(42)");
 * // [{value: 42, remaining: "", ...}]
 * ```
 *
 * @see {@linkcode bracket}
 */
export const sequence = <const A extends readonly Parser<unknown>[]>(
  parsers: A,
  acc = [] as Unpack<A>,
): Parser<Unpack<A>> => {
  if (parsers.length > 0) {
    // @ts-ignore existential types
    return parsers[0].bind((x) => {
      return sequence(parsers.slice(1), [...acc, x]);
    }).bind((arr) => result(arr));
  }
  return result(acc);
};

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
  return sequence([openBracket, body, closeBracket]).bind((arr) =>
    result(arr[1])
  );
}

// Alternation

/**
 * Returns all matching parses
 */
export const any = <T>(...parsers: Parser<T>[]): Parser<T> => {
  return createParser((input, position) => {
    const results = parsers.map((parser) => parser.parse(input, position));

    if (results.every((r) => r.success === false)) {
      const error = results.sort((a, b) =>
        sortPosition(a.position, b.position)
      )[0];

      return error;
    }

    return {
      success: true,
      results: results.filter((res) => res.success === true).flatMap((r) =>
        r.results
      ),
    };
  });
};

// Choice

/**
 * Only returns the first successful parse result
 *
 * @example Signed integers
 *
 * ```ts
 * const integer = first(
 *   literal("-").bind(() => natural).map((x) => -x),
 *   literal("+").bind(() => natural).map((x) => x),
 *   natural,
 * );
 *
 * integer.parse("-42"); // results: [{value: -42, remaining: ''}]
 * integer.parse("+42"); // results: [{value: 42, remaining: ''}]
 * integer.parse("42"); // results: [{value: 42, remaining: ''}]
 * ```
 */
export const first = <T>(
  ...parsers: Parser<T>[]
): Parser<T> => {
  return createParser((input, position) => {
    const results = [];
    for (const parser of parsers) {
      const result = parser.parse(input, position);
      if (result.success === true) return result;
      results.push(result);
    }

    const error = results.sort((a, b) =>
      sortPosition(a.position, b.position)
    )[0];

    return error;
  });
};

// Iteration

/**
 * Returns an array of all iterated parses
 *
 * @example
 *
 * ```ts
 * const { results } = iterate(digit).parse("42");
 * // [{value: [4, 2], remaining: ""}, {value: [4], remaining: "2"}, {value: [], remaining: "42"}]
 * ```
 */
export const iterate = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((a) => iterate(parser).bind((x) => result([a, ...x])))
    .plus(result([]));
};

/**
 * Recursive helper for `many`.
 * @param parser The parser.
 * @param min The minimum number of times the parser must succeed.
 * @param max The maximum number of times the parser can succeed
 * @param count The current count of successful parses.
 * @param acc The accumulator for the parsed values.
 * @returns A parser returning an array of parse results.
 */
const manyRecursive = <T>(
  parser: Parser<T>,
  min: number,
  max: number,
  count: number,
  acc: T[],
): Parser<T[]> => {
  if (count >= max) {
    return result(acc);
  }

  const rest = parser.bind((item) =>
    manyRecursive(parser, min, max, count + 1, [...acc, item])
  );

  if (count >= min) {
    return first(rest, result(acc));
  } else {
    return rest;
  }
};

/**
 * Repeats a parser greedily between min and max times, inclusive.
 * @param parser The parser.
 * @param min The minimum number of times the parser must succeed.
 * @param max The maximum number of times the parser can succeed (default: Infinity).
 * @returns A parser returning an array of parse results.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many(digit, 2, 3);
 *
 * numbers.parse("1234ab");
 * // [{ value: [1, 2, 3], remaining: "4ab", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 */
export const many = <T>(
  parser: Parser<T>,
  min: number,
  max: number = Infinity,
): Parser<T[]> => {
  if (min < 0) {
    return zero.error("many: min cannot be negative");
  }
  if (max < min) {
    return zero.error("many: max cannot be less than min");
  }
  if (max === 0 && min === 0) {
    return result([]);
  }

  return manyRecursive(parser, min, max, 0, []);
};

/**
 * Repeats a parser greedily 0 or more times. Alias for `many(parser, 0)`.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many0(digit);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }]
 * numbers.parse("1");
 * // [{ value: [1], remaining: "", ... }]
 * numbers.parse("");
 * // results: [{ value: [], remaining: "" }]
 * ```
 *
 * @see {@linkcode many}
 */
export const many0 = <T>(parser: Parser<T>): Parser<T[]> => many(parser, 0);

/**
 * Repeats a parser greedily 1 or more times. Alias for `many(parser, 1)`.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = many1(digit);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2, 3], remaining: "abc", ... }]
 * numbers.parse("1");
 * // [{ value: [1], remaining: "", ... }]
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode many}
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => many(parser, 1);

/**
 * Repeats a parser a predefined number of times. Alias for `many(parser, times, times)`.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = repeat(digit, 2);
 *
 * numbers.parse("123abc");
 * // [{ value: [1, 2], remaining: "3abc", ... }]
 * numbers.parse("1");
 * // message: "Expected a digit"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode many}
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times < 0) {
    return zero.error("repeat: times cannot be negative");
  }
  return many(parser, times, times);
};

/**
 * Repeats a parser and a separator greedily between min and max times, inclusive.
 * @param parser The item parser.
 * @param separator The separator parser.
 * @param min The minimum number of items.
 * @param max The maximum number of items (default: Infinity).
 * @returns A parser returning an array of parse results, ignoring the separator.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy(digit, literal(","), 2, 3);
 *
 * numbers.parse("1,2,3,4,a,b");
 * // results: [{ value: [1, 2, 3], remaining: ",4,a,b" }]
 * numbers.parse("1");
 * // message: "Expected ',', but got 'EOI'"
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 */
export const sepBy = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
  min: number,
  max: number = Infinity,
): Parser<T[]> => {
  if (min < 0) {
    return zero.error("sepBy: min cannot be negative");
  }
  if (max < min) {
    return zero.error("sepBy: max cannot be less than min");
  }
  if (max === 0 && min === 0) {
    return result([]);
  }

  const minRemaining = Math.max(0, min - 1);
  const maxRemaining = Math.max(0, max - 1);
  const separatorItem = separator.bind(() => parser);
  const separatorItems = many(separatorItem, minRemaining, maxRemaining);

  if (min === 0) {
    return first(
      parser.bind((firstItem) =>
        separatorItems.map((rest) => [firstItem, ...rest])
      ),
      result<T[]>([]),
    );
  } else {
    return parser.bind((firstItem) =>
      separatorItems.map((rest) => [firstItem, ...rest])
    );
  }
};

/**
 * Repeats a parser and a separator greedily 0 or more times. Alias for `sepBy(parser, separator, 0)`.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy0(digit, literal(","));
 *
 * numbers.parse("1,2,3,a,b,c");
 * // results: [{ value: [1, 2, 3], remaining: ",a,b,c" }]
 * numbers.parse("1");
 * // results: [{ value: [1], remaining: "" }]
 * numbers.parse("");
 * // results: [{ value: [], remaining: "" }]
 * ```
 *
 * @see {@linkcode sepBy}
 */
export const sepBy0 = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
): Parser<T[]> => sepBy(parser, separator, 0);

/**
 * Repeats a parser and a separator greedily 1 or more times. Alias for `sepBy(parser, separator, 1)`.
 *
 * @example List of numbers
 *
 * ```ts
 * const numbers = sepBy1(digit, literal(","));
 *
 * numbers.parse("1,2,3,a,b,c");
 * // results: [{ value: [1, 2, 3], remaining: ",a,b,c" }]
 * numbers.parse("1");
 * // results: [{ value: [1], remaining: "" }]
 * numbers.parse("");
 * // message: "Expected a digit"
 * ```
 *
 * @see {@linkcode sepBy}
 */
export const sepBy1 = <T, U>(
  parser: Parser<T>,
  separator: Parser<U>,
): Parser<T[]> => sepBy(parser, separator, 1);

/**
 * Repeats an item parser and a left-associative operator parser greedily between min and max times, inclusive.
 * @param parser The item parser.
 * @param operator The operator parser, returning a function (a:T, b:T) => T.
 * @param min The minimum number of items to parse.
 * @param max The maximum number of items to parse (default: Infinity).
 * @returns A parser returning the folded result.
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

/**
 * Repeats an item parser and a left-associative operator parser greedily 1 or more times, inclusive. Alias for `foldL(itemParser, operatorParser, 1)`.
 *
 * @example Addition
 *
 * ```ts
 * const plus = literal("+").map(() => (a: number, b: number) => a + b);
 * const addition = foldL1(digit, plus);
 *
 * addition.parse("1+2+3+a+b+c");
 * // results: [{ value: 6, remaining: "+a+b+c" } ]
 * addition.parse("1");
 * // results: [{ value: 1, remaining: "" } ]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldL1 = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
): Parser<T> => foldL(parser, operator, 1);

/**
 * Repeats a parser and a right-associative operator parser greedily between min and max times, inclusive.
 * @param parser The item parser.
 * @param operator The operator parser, returning a function (a:T, b:T) => T.
 * @param min The minimum number of items to parse.
 * @param max The maximum number of items to parse (default: Infinity).
 * @returns A parser returning the folded result.
 *
 * @example Exponentiation
 *
 * ```ts
 * const caret = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR(digit, caret, 2, 3);
 *
 * exponentiation.parse("4^3^2^1^a^b");
 * // results: [{ value: 262144, remaining: "^1^a^b" }]
 * exponentiation.parse("1");
 * // message: "Expected '^', but got 'EOI'"
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldR = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
  min: number,
  max: number = Infinity,
): Parser<T> => {
  if (min < 1) {
    return zero.error("foldR: min cannot be less than 1");
  }
  if (max < min) {
    return zero.error("foldR: max cannot be less than min");
  }
  if (min === 1 && max === 1) {
    return parser;
  }

  const operatorItem = sequence([operator, parser]);
  const operatorItems = many(operatorItem, min - 1, max - 1);

  return parser.bind((firstItem) =>
    operatorItems.map((pairs) => {
      // single item
      if (!pairs.length) {
        return firstItem;
      }

      const lastItem = pairs.at(-1)![1];

      return pairs.reduceRight((acc, [op, _], index, array) => {
        // previous value or `firstItem` if at start
        const val = index == 0 ? firstItem : array[index - 1][1];
        return op(val, acc);
      }, lastItem);
    })
  );
};

/**
 * Repeats a parser and a right-associative operator parser greedily 1 or more times, inclusive. Alias for `foldR(itemParser, operatorParser, 1)`.
 *
 * @example Exponentiation
 *
 * ```ts
 * const caret = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR1(digit, caret);
 *
 * exponentiation.parse("3^2^1^a^b^c");
 * // results: [{ value: 9, remaining: "^a^b^c" }]
 * exponentiation.parse("1");
 * // results: [{ value: 1, remaining: "" }]
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldR1 = <T, O extends (a: T, b: T) => T>(
  parser: Parser<T>,
  operator: Parser<O>,
): Parser<T> => foldR(parser, operator, 1);

// Filtering

/**
 * Filters a parser with a predicate and matches only if the predicate returns true
 *
 * Preserves `zero` and distributes over alternation
 *
 * @example
 *
 * ```ts
 * const isVowel = (char) => ["a", "e", "i", "o", "u", "y"].includes(char);
 * const vowel = filter(take, isVowel).error("Expected a vowel");
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
export const filter = <T>(
  parser: Parser<T>,
  predicate: (value: T) => boolean,
): Parser<T> => {
  return createParser((input, position) => {
    const result = parser.parse(input, position);

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
};

// Lazy Evaluation

/**
 * Takes a parser thunk and memoize it upon evaluation.
 *
 * @see {@linkcode lazy}
 */
export const memoize = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  let parser: Parser<T>;

  return createParser((input, position) => {
    if (!parser) {
      parser = parserThunk();
    }
    return parser.parse(input, position);
  });
};

/**
 * Defers evaluation, without memoization
 *
 * This helps with undeclared variable references in recursive grammars
 *
 * @example Simple expression parser
 *
 * The following `factor` parser is an integer or a parenthesized expression and `lazy`
allows us to lazily evaluate this parser definition to avoid directly referencing `expr` which is not yet defined.
 *
 * ```ts
 * const add = literal("+").map(() => (a: number, b: number) => a + b);
 * const mul = literal("*").map(() => (a: number, b: number) => a * b);
 *
 * // integer | (expr)
 * const factor = lazy(() =>
 *   first(
 *     integer,
 *     bracket(
 *       literal("("),
 *       expr,
 *       literal(")"),
 *     ),
 *   )
 * );
 * const term = foldL(factor, mul);
 * const expr = foldL(term, add);
 *
 * expr.parse("1+2*3"); // results: [{value: 7, remaining: ""}]
 * ```
 *
 * @see {@linkcode memoize}
 */
export const lazy = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  return createParser((input, position) => {
    return parserThunk().parse(input, position);
  });
};

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
export const zero: Parser<any> = createParser((_, position) => ({
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
export const sequence = <const A extends readonly Parser<any>[]>(
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
 * Returns the longest matching parse array (0 or more matches)
 *
 * @example
 *
 * ```ts
 * const digit = regex(/^\d/);
 * const { results } = many(digit).parse("23 and more"); // [{value: ["2", "3"], remaining: " and more", ...}]
 * ```
 */
export const many = <T>(parser: Parser<T>): Parser<T[]> => {
  return first(
    parser.bind((a) => many(parser).bind((x) => result([a, ...x]))),
    result([]),
  );
};

/**
 * Returns the longest matching parse array (1 or more matches)
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((x) => many(parser).bind((rest) => result([x, ...rest])));
};

/**
 * Repeats a parser a predefined number of times
 *
 * @example Repeated {@linkcode take}
 *
 * ```ts
 * const { results } = repeat(take, 2).parse("hello"); // [{value: 'he', remaining: 'llo', ...}]
 * ```
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times > 0) {
    return parser.bind((a) =>
      repeat(parser, times - 1).bind((rest) => result([a, ...rest]))
    );
  }
  return result([]);
};

/**
 * Recognizes non-empty sequences of a given parser and separator, and ignores the separator
 *
 * @see {@linkcode sepBy}
 */
export const sepBy1 = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return parser.bind((x) =>
    many(sep.bind(() => parser)).bind((rest) => result([x, ...rest]))
  );
};

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
  return first(sepBy1(parser, sep), result([]));
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 *
 * @example Slick natural number parser implementation
 *
 * We revisit the `natural` parser as a sequence of digits that are combined together
by folding a binary operator around the digits.
 *
 * ```ts
 * const natural = foldL1(digit, result((a: number, b: number) => 10 * a + b));
 *
 * natural.parse("123"); // results: [{value: 123, remaining: ""}]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldL1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  const rest = (x: T): Parser<T> => {
    return first(
      operator.bind((f) => item.bind((y) => rest(f(x, y)))),
      result(x),
    );
  };
  return item.bind(rest);
};

/**
 * Parses maybe-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 *
 * @example Addition
 *
 * We lift the addition literal `+` into a binary function parser and apply a left fold
 *
 * ```ts
 * const add = literal("+").map(() => (a: number, b: number) => a + b);
 * const addition = foldL(number, add);
 *
 * addition.parse("1+2+3"); // results: [{value: 6, remaining: "" }]
 * ```
 *
 * @see {@linkcode foldR}
 */
export const foldL = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(foldL1(item, operator), item);
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the right and performs the fold
 *
 * @see {@linkcode foldR}
 */
export const foldR1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return item.bind((x) => {
    return first(
      operator.bind((f) => foldR1(item, operator).bind((y) => result(f(x, y)))),
      result(x),
    );
  });
};

/**
 * Parses maybe-empty sequences of items separated by an operator parser that associates to the right and performs the fold
 *
 * @example Exponentiation
 *
 * We lift the power literal `^` into a binary function parser and apply a right fold since exponentiation associates to the right
 *
 * ```ts
 * const pow = literal("^").map(() => (a: number, b: number) => a ** b);
 * const exponentiation = foldR(number, pow);
 *
 * exponentiation.parse("2^2^3");
 * // results: [{value: 256, remaining: ""}]
 * ```
 *
 * @see {@linkcode foldL}
 */
export const foldR = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(foldR1(item, operator), item);
};

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

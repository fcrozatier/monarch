import { ParseError } from "./errors.ts";
import type { Position } from "./types.ts";

type ParseFail = {
  success: false;
  message: string;
  position: Position;
};

type ParseSuccess<T> = {
  success: true;
  results: {
    value: T;
    remaining: string;
    position: Position;
  }[];
};

type ParseResult<T> = ParseSuccess<T> | ParseFail;

type ParsingHandler<T> = (
  input: string,
  position: Position,
) => ParseResult<T>;

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

  constructor(parse: ParsingHandler<T>) {
    this.#parse = parse;
  }

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
   * Monadic sequencing of parsers
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

  error(message: string): this {
    this.#error = message;
    return this;
  }
}

// Helpers

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
 */
export const iterate = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((a) => iterate(parser).bind((x) => result([a, ...x])))
    .plus(result([]));
};

/**
 * Returns the longest matching parse array (0 or more matches)
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
 * Recognizes sequences (maybe empty) of a given parser and separator, and ignores the separator
 */
export const sepBy = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return first(sepBy1(parser, sep), result([]));
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the left and performs the fold
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
 */
export const foldL = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(foldL1(item, operator), item);
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the right and performs the fold
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
 */
export const foldR = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(foldR1(item, operator), item);
};

// Filtering

/**
 * Filters a parser by a predicate and matches only if the predicate returns true
 *
 * Preserves `zero` and distributes over alternation
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
 */
export const lazy = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  return createParser((input, position) => {
    return parserThunk().parse(input, position);
  });
};

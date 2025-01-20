type State = string;

type ParseResult<T> = {
  value?: T;
  remaining?: State;
  error?: string;
};

/**
 * The monadic parser class
 */
export class Parser<T> {
  line = 1;
  #input!: string;
  #error?: (input: string) => string;
  #parse: (input: State) => ParseResult<T>[];

  constructor(parse: (input: State) => ParseResult<T>[]) {
    this.#parse = parse;
  }

  parse(input: string): ParseResult<T>[] {
    this.#input = input;
    const results = this.#parse(input);
    if (results.every((r) => r.error) && this.#error) {
      return [{ error: `line ${this.line}: ${this.#error(this.#input)}` }];
    }
    return results;
  }

  /**
   * Transforms a parser of type T into a parser of type U
   */
  map<U>(transform: (value: T) => U): Parser<U> {
    return createParser((input) => {
      return this.#parse(input).map((result) => ({
        ...result,
        value: result?.value !== undefined
          ? transform(result.value)
          : undefined,
      }));
    });
  }

  /**
   * Applies a function parser to a lifted value
   */
  apply<U>(fn: Parser<(value: T) => U>): Parser<U> {
    return createParser((input: State) => {
      return fn.#parse(input).flatMap(({ value, remaining, error }) => {
        if (value && remaining !== undefined) {
          return this.#parse(remaining).map((res) => {
            if (res.value && res.remaining) {
              return {
                value: value(res.value),
                remaining: res.remaining,
              } satisfies ParseResult<U>;
            }
            return { error: res.error };
          });
        }
        return [{ error }];
      });
    });
  }

  /**
   * Monadic sequencing of parsers
   */
  bind<U>(transform: (value: T) => Parser<U>): Parser<U> {
    return createParser((input: State) => {
      return this.#parse(input).flatMap(({ value, remaining, error }) => {
        if (value !== undefined && remaining !== undefined) {
          return transform(value).#parse(remaining);
        } else if (error) {
          return [{ error }];
        }
        return [];
      });
    });
  }

  /**
   * Concatenates the resulting parse arrays
   */
  plus(...parsers: Parser<T>[]): Parser<T> {
    return createParser((input) => {
      return [this, ...parsers].flatMap((parser) => parser.#parse(input));
    });
  }

  error(cb: (input: string) => string) {
    this.#error = cb;
    return this;
  }
}

// Helpers

export const createParser = <T>(
  fn: (input: State) => ParseResult<T>[],
): Parser<T> => new Parser(fn);

/**
 * The default embedding of a value in the Parser context
 *
 * Succeeds without consuming any of the input string
 */
export const result = <T>(value: T): Parser<T> => {
  return createParser((remaining: State) => [{ value, remaining }]);
};

/**
 * The always failing parser
 *
 * It is the unit of alternation and plus, and also is an absorbing element of flatMap
 */
export const zero: Parser<any> = createParser((_: State) => []);

/**
 * Decorator that makes a parser return an error message if it fails
 */
export const orThrow = <T>(parser: Parser<T>, error: string): Parser<T> => {
  return createParser((input) => {
    const results = parser.parse(input);
    if (results.filter((result) => result.value !== undefined).length > 0) {
      return results;
    }
    return [{ error }];
  });
};

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
export const bracket = <T, U, V>(
  openBracket: Parser<T>,
  body: Parser<U>,
  closeBracket: Parser<V>,
): Parser<U> => {
  return sequence([openBracket, body, closeBracket]).bind((arr) =>
    result(arr[1])
  );
};

// Alternation

/**
 * Returns all matching parses
 */
export const any = <T>(...parsers: Parser<T>[]): Parser<T> => {
  return createParser((input) => {
    const results = parsers.flatMap((parser) => parser.parse(input));

    if (results.some((res) => res.value !== undefined)) {
      return results.filter((res) => res.value !== undefined);
    }

    return [];
  });
};

// Choice

/**
 * Only returns the first successful parse result
 */
export const first = <T>(
  ...parsers: Parser<T>[]
): Parser<T> => {
  return createParser((input) => {
    for (const parser of parsers) {
      const results = parser.parse(input);
      if (results.find((res) => res.value !== undefined)) {
        return results.filter((res) => res.value !== undefined);
      }
    }
    return [];
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
  error?: string,
): Parser<T> => {
  return parser.bind((value) => {
    if (predicate(value)) {
      return result(value);
    } else if (error) {
      return createParser(() => [{ error }]);
    }
    return zero;
  });
};

// Lazy Evaluation

/**
 * Takes a parser thunk and memoize it upon evaluation.
 */
export const memoize = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  let parser: Parser<T>;

  return createParser((input) => {
    if (!parser) {
      parser = parserThunk();
    }
    return parser.parse(input);
  });
};

/**
 * Defers evaluation, without memoization
 *
 * This helps with undeclared variable references in recursive grammars
 */
export const lazy = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  return createParser((input) => {
    return parserThunk().parse(input);
  });
};

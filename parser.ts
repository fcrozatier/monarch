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
  parse: (input: State) => ParseResult<T>[];

  constructor(parse: (input: State) => ParseResult<T>[]) {
    this.parse = parse;
  }

  /**
   * Transforms a parser of type T into a parser of type U
   */
  map<U>(transform: (value: T) => U): Parser<U> {
    return createParser((input) => {
      return this.parse(input).map((result) => ({
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
      return fn.parse(input).flatMap(({ value, remaining, error }) => {
        if (value && remaining !== undefined) {
          return this.parse(remaining).map((res) => {
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
      return this.parse(input).flatMap(({ value, remaining, error }) => {
        if (value !== undefined && remaining !== undefined) {
          return transform(value).parse(remaining);
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
  plus(...parsers: Parser<T>[]) {
    return createParser((input) => {
      return [this, ...parsers].flatMap((parser) => parser.parse(input));
    });
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
export const unit = <T>(value: T): Parser<T> => {
  return createParser((remaining: State) => [{ value, remaining }]);
};

/**
 * The always failing parser
 *
 * It is the unit of alternation and plus, and also is an absorbing element of flatMap
 */
export const zero = createParser<any>((_: State) => []);

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
 * Makes a sequence of parses and returns the array of parse results
 */
export const sequence = <T>(...parsers: Parser<T>[]): Parser<T[]> => {
  const results: T[] = [];

  return parsers.reduce((prev, curr) => {
    return prev.bind((x) => {
      results.push(x);
      return curr;
    });
  }).bind((x) => unit([...results, x]));
};

// Alternation

/**
 * Returns all matching parses
 */
export const any = <T>(...parsers: Parser<T>[]) => {
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
 * Only returns the first successful parse results
 */
export const first = <T>(
  ...parsers: Parser<T>[]
): Parser<T> => {
  return createParser((input) => {
    for (const parser of parsers) {
      const results = parser.parse(input);
      if (results.find((result) => result.value !== undefined)) {
        return results;
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
  return parser.bind((a) => (iterate(parser).bind((x) => unit([a, ...x]))))
    .plus(unit([]));
};

/**
 * Returns the longest matching parse array (0 or more matches)
 */
export const many = <T>(parser: Parser<T>): Parser<T[]> => {
  return first(
    parser.bind((a) => many(parser).bind((x) => unit([a, ...x]))),
    unit([]),
  );
};

/**
 * Returns the longest matching parse array (1 or more matches)
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((x) => many(parser).bind((rest) => unit([x, ...rest])));
};

/**
 * Repeats a parser a predefined number of times
 */
export const repeat = <T>(parser: Parser<T>, times: number): Parser<T[]> => {
  if (times > 0) {
    return parser.bind((a) =>
      repeat(parser, times - 1).bind((rest) => unit([a, ...rest]))
    );
  }
  return unit([]);
};

/**
 * Recognizes non-empty sequences of a given parser and separator, and ignores the separator
 */
export const sepBy1 = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return parser.bind((x) =>
    many(sep.bind(() => parser)).bind((rest) => unit([x, ...rest]))
  );
};

/**
 * Recognizes sequences (maybe empty) of a given parser and separator, and ignores the separator
 */
export const sepBy = <T, U>(
  parser: Parser<T>,
  sep: Parser<U>,
): Parser<T[]> => {
  return sepBy1(parser, sep).plus(unit([]));
};

export const bracket = <T, U, V>(
  openBracket: Parser<T>,
  body: Parser<U>,
  closeBracket: Parser<V>,
) => {
  return openBracket.bind(() =>
    body.bind((b) => closeBracket.bind(() => unit(b)))
  );
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the left and performs the fold
 */
export const chainl1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  const rest = (x: T): Parser<T> => {
    return first(
      operator.bind((f) => item.bind((y) => rest(f(x, y)))),
      unit(x),
    );
  };
  return item.bind(rest);
};

export const chainl = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(chainl1(item, operator), item);
};

/**
 * Parses non-empty sequences of items separated by an operator parser that associates to the right and performs the fold
 */
export const chainr1 = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return item.bind((x) => {
    return first(
      operator.bind((f) => chainr1(item, operator).bind((y) => unit(f(x, y)))),
      unit(x),
    );
  });
};

export const chainr = <T, U extends (a: T, b: T) => T>(
  item: Parser<T>,
  operator: Parser<U>,
): Parser<T> => {
  return first(chainr1(item, operator), item);
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
      return unit(value);
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

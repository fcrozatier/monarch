import { createParser, type Parser } from "../../../src/parser/main.ts";

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
